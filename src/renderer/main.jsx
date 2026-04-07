import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Mock Electron IPC bridge if running in a standard browser
if (!window.electron) {
    console.warn('Running in browser: Mocking Electron IPC bridge');
    window.electron = {
        startCapture: async (params) => {
            console.log('[MOCK] startCapture', params);
            return { success: true };
        },
        stopCapture: async (params) => {
            console.log('[MOCK] stopCapture', params);
            return { success: true, outputPath: 'mock-video.mp4' };
        },
        selectSaveLocation: async () => {
            console.log('[MOCK] selectSaveLocation');
            return '/mock/desktop/trace-videos';
        },
        resizeWindow: (dimensions) => {
            console.log('[MOCK] resizeWindow', dimensions);
        },
        onStatusUpdate: (callback) => {
            console.log('[MOCK] onStatusUpdate registered');
            return () => { };
        },
        pauseCapture: () => console.log('[MOCK] pauseCapture'),
        resumeCapture: () => console.log('[MOCK] resumeCapture'),
    };
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
