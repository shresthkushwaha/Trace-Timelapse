import { app, BrowserWindow, ipcMain, powerSaveBlocker, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs-extra';
import screenshot from 'screenshot-desktop';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

let mainWindow;
let captureInterval = null;
let captureTimeout = null;
let powerSaveId = null;
let tempDir = null;
let frameCount = 0;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Helper function to pad numbers with zeros
function padNumber(num, length = 5) {
    return String(num).padStart(length, '0');
}

// Handle START_CAPTURE
ipcMain.handle('start-capture', async (event, { intervalMs, durationMs, isInfinite }) => {
    try {
        // Create temp directory
        const timestamp = Date.now();
        tempDir = path.join(os.tmpdir(), `trace_session_${timestamp}`);
        await fs.ensureDir(tempDir);

        frameCount = 0;

        // Enable power save blocker
        powerSaveId = powerSaveBlocker.start('prevent-display-sleep');

        // Send initial status
        mainWindow.webContents.send('status-update', {
            status: 'Recording',
            frameCount: 0,
        });

        // Start capture loop
        captureInterval = setInterval(async () => {
            try {
                frameCount++;

                // Capture screenshot
                const imgBuffer = await screenshot({ format: 'png' });
                const filename = `img_${padNumber(frameCount)}.png`;
                const filepath = path.join(tempDir, filename);

                await fs.writeFile(filepath, imgBuffer);

                // Send status update
                mainWindow.webContents.send('status-update', {
                    status: 'Recording',
                    frameCount,
                });
            } catch (error) {
                console.error('Screenshot capture error:', error);
            }
        }, intervalMs);

        // Set auto-stop if not infinite
        if (!isInfinite) {
            captureTimeout = setTimeout(() => {
                // Auto-stop capture
                clearInterval(captureInterval);
                captureInterval = null;

                mainWindow.webContents.send('status-update', {
                    status: 'Stopped',
                    frameCount,
                    autoStopped: true,
                });
            }, durationMs);
        }

        return { success: true };
    } catch (error) {
        console.error('Start capture error:', error);
        return { success: false, error: error.message };
    }
});

// Handle STOP_CAPTURE
ipcMain.handle('stop-capture', async (event, { targetFPS }) => {
    try {
        // Clear interval and timeout
        if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
        }
        if (captureTimeout) {
            clearTimeout(captureTimeout);
            captureTimeout = null;
        }

        // Stop power save blocker
        if (powerSaveId !== null) {
            powerSaveBlocker.stop(powerSaveId);
            powerSaveId = null;
        }

        if (frameCount === 0) {
            mainWindow.webContents.send('status-update', {
                status: 'Idle',
                frameCount: 0,
            });
            return { success: false, error: 'No frames captured' };
        }

        // Send rendering status
        mainWindow.webContents.send('status-update', {
            status: 'Rendering',
            frameCount,
        });

        // Prompt user for save location
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Timelapse Video',
            defaultPath: path.join(app.getPath('desktop'), 'timelapse.mp4'),
            filters: [
                { name: 'MP4 Video', extensions: ['mp4'] },
            ],
        });

        if (!filePath) {
            mainWindow.webContents.send('status-update', {
                status: 'Idle',
                frameCount: 0,
            });
            return { success: false, error: 'Save cancelled' };
        }

        // Create video with FFmpeg
        await new Promise((resolve, reject) => {
            const inputPattern = path.join(tempDir, 'img_%05d.png').replace(/\\/g, '/');

            ffmpeg()
                .input(inputPattern)
                .inputOptions(['-start_number', '1'])
                .inputFPS(targetFPS)
                .outputFPS(targetFPS)
                .videoCodec('libx264')
                .outputOptions([
                    '-pix_fmt yuv420p',
                ])
                .output(filePath)
                .on('progress', (progress) => {
                    console.log('Processing: ' + progress.percent + '% done');
                })
                .on('end', () => {
                    console.log('Video creation finished');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Clean up temp directory
        await fs.remove(tempDir);
        tempDir = null;

        // Send done status
        mainWindow.webContents.send('status-update', {
            status: 'Done',
            frameCount: 0,
            outputPath: filePath,
        });

        return { success: true, outputPath: filePath };
    } catch (error) {
        console.error('Stop capture error:', error);

        // Try to clean up temp dir
        if (tempDir) {
            try {
                await fs.remove(tempDir);
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        }

        mainWindow.webContents.send('status-update', {
            status: 'Idle',
            frameCount: 0,
        });

        return { success: false, error: error.message };
    }
});
