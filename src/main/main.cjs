const { app, BrowserWindow, ipcMain, powerSaveBlocker, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const screenshot = require('screenshot-desktop');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set FFmpeg path based on environment
let ffmpegPath;
if (app.isPackaged) {
    // In production, ffmpeg-static is copied to resources/ffmpeg-static
    ffmpegPath = path.join(process.resourcesPath, 'ffmpeg-static', 'ffmpeg.exe');
} else {
    // In development, require resolves to the path in node_modules
    ffmpegPath = ffmpegStatic;
}
ffmpeg.setFfmpegPath(ffmpegPath);

let mainWindow;
let captureInterval = null;
let captureTimeout = null;
let powerSaveId = null;
let tempDir = null;
let frameCount = 0;
let userTargetFPS = 12; // Store user's FPS selection
let userSavePath = ''; // Store user's save path selection
let captureStartTime = null; // Store capture start timestamp
let isPaused = false; // Capture pause state
let isCapturingFrame = false; // Guard for overlapping captures


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1290,
        height: 510,
        useContentSize: true,
        resizable: false, // Ensure constant width/height everywhere
        autoHideMenuBar: true, // Cleaner look
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
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

app.commandLine.appendSwitch('force-device-scale-factor', '1');

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

// Helper: Format time as HH-MM-SS
const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}-${minutes}-${seconds}`;
};

// Helper: Format date as YYYY-MM-DD
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Handle SELECT_SAVE_LOCATION - FOLDER PICKER
ipcMain.handle('select-save-location', async () => {
    try {
        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Choose Folder to Save Timelapse Videos',
            defaultPath: app.getPath('desktop'),
            properties: ['openDirectory'],
        });

        return filePaths && filePaths.length > 0 ? filePaths[0] : null;
    } catch (error) {
        console.error('Select save location error:', error);
        return null;
    }
});

// Handle RESIZE_WINDOW
ipcMain.handle('resize-window', async (event, { width, height }) => {
    if (mainWindow) {
        // Use setBounds with animate: true for smoother transition
        // Note: setBounds uses window size (including frame), setContentSize uses area.
        // We need to calculate window size from content size if we want exact content match,
        // or just accept that setBounds might be slightly different if not careful.
        // However, Electron's setBounds usually takes the window dimensions.
        // If the user wants specific content size, we should stick to setContentSize OR calculate the difference.
        // But the user specifically asked for setBounds.
        // Let's trust the user's snippet which passes { width, height }.
        // We might need to get current position to keep it in place or let it animate freely.
        const bounds = mainWindow.getBounds();
        mainWindow.setBounds({
            x: bounds.x,
            y: bounds.y,
            width: width,
            height: height
        });
    }
});

// Handle START_CAPTURE
ipcMain.handle('start-capture', async (event, { intervalMs, durationMs, isInfinite, targetFPS, savePath }) => {
    try {
        // Store user's FPS selection and save path
        userTargetFPS = targetFPS || 12;
        userSavePath = savePath || '';
        captureStartTime = new Date(); // Record start time
        isPaused = false; // Reset pause state
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

        const captureFrame = async () => {
            if (isPaused || isCapturingFrame) return; // Skip if paused or already capturing

            isCapturingFrame = true;
            try {
                // Capture screenshot
                const imgBuffer = await screenshot({ format: 'png' });

                // Only if capture succeeds, increment and save
                frameCount++;
                const filename = `img_${padNumber(frameCount)}.png`;
                const filepath = path.join(tempDir, filename);

                await fs.writeFile(filepath, imgBuffer);

                // Send status update
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('status-update', {
                        status: 'Recording',
                        frameCount,
                    });
                }
            } catch (error) {
                console.error('Screenshot capture error:', error);
            } finally {
                isCapturingFrame = false;
            }
        };

        // Capture first frame immediately
        captureFrame();

        // Start capture loop
        captureInterval = setInterval(captureFrame, intervalMs);


        // Set auto-stop if not infinite
        if (!isInfinite) {
            console.log(`Setting auto-stop timeout for ${durationMs}ms`);
            captureTimeout = setTimeout(async () => {
                console.log('Auto-stop timeout triggered!');
                // Auto-stop capture
                clearInterval(captureInterval);
                captureInterval = null;

                // Stop power save blocker
                if (powerSaveId !== null) {
                    powerSaveBlocker.stop(powerSaveId);
                    powerSaveId = null;
                }

                // Send rendering status
                mainWindow.webContents.send('status-update', {
                    status: 'Rendering',
                    frameCount,
                });

                try {
                    // Generate filename with format: trace_starttime-endtime_date.mp4
                    const endTime = new Date();

                    const startTimeStr = formatTime(captureStartTime);
                    const endTimeStr = formatTime(endTime);
                    const dateStr = formatDate(endTime);
                    const filename = `trace_${startTimeStr}-${endTimeStr}_${dateStr}.mp4`;

                    const filePath = path.join(userSavePath, filename);

                    if (!filePath) {
                        console.error('No save path was set');
                        mainWindow.webContents.send('status-update', {
                            status: 'Idle',
                            frameCount: 0,
                        });
                        // Clean up temp directory
                        if (tempDir) {
                            await fs.remove(tempDir);
                            tempDir = null;
                        }
                        return;
                    }



                    // Use the user's FPS selection stored when capture started
                    const targetFPS = userTargetFPS;
                    console.log(`Starting FFmpeg export: ${frameCount} frames at ${targetFPS} FPS to ${filePath}`);

                    // Create video with FFmpeg
                    await new Promise(async (resolve, reject) => {
                        // Check if files exist
                        const files = await fs.readdir(tempDir);
                        if (files.length === 0) {
                            return reject(new Error('No frames found in temp directory. Screenshot capture likely failed.'));
                        }

                        // FFmpeg pattern needs to use / even on Windows for best compatibility
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
                } catch (error) {
                    console.error('Auto-stop export error:', error);
                    mainWindow.webContents.send('status-update', {
                        status: 'Idle',
                        frameCount: 0,
                    });
                    // Clean up temp directory
                    if (tempDir) {
                        await fs.remove(tempDir);
                        tempDir = null;
                    }
                }
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

        try {
            // Generate filename with format: trace_starttime-endtime_date.mp4
            const endTime = new Date();
            const startTimeStr = formatTime(captureStartTime);
            const endTimeStr = formatTime(endTime);
            const dateStr = formatDate(endTime);
            const filename = `trace_${startTimeStr}-${endTimeStr}_${dateStr}.mp4`;

            const filePath = path.join(userSavePath, filename);
            const targetFPS = userTargetFPS;

            // Create video with FFmpeg
            await new Promise(async (resolve, reject) => {
                // Check if files exist
                const files = await fs.readdir(tempDir);
                if (files.length === 0) {
                    return reject(new Error('No frames were captured. Screenshot capture likely failed.'));
                }

                // FFmpeg pattern needs to use / even on Windows for best compatibility
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
            console.error('FFmpeg export error:', error);
            throw error; // Rethrow to be caught by outer catch
        }
    } catch (error) {
        console.error('Stop capture error:', error);

        // Try to clean up temp dir
        if (tempDir) {
            try {
                await fs.remove(tempDir);
                tempDir = null;
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

// Handle PAUSE_CAPTURE
ipcMain.handle('pause-capture', () => {
    isPaused = true;
    console.log('Capture paused');
});

// Handle RESUME_CAPTURE
ipcMain.handle('resume-capture', () => {
    isPaused = false;
    console.log('Capture resumed');
});
