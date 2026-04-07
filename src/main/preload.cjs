const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    startCapture: (params) => ipcRenderer.invoke('start-capture', params),
    stopCapture: (params) => ipcRenderer.invoke('stop-capture', params),
    selectSaveLocation: () => ipcRenderer.invoke('select-save-location'),
    resizeWindow: (dimensions) => ipcRenderer.invoke('resize-window', dimensions),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_, data) => callback(data)),
    pauseCapture: () => ipcRenderer.invoke('pause-capture'),
    resumeCapture: () => ipcRenderer.invoke('resume-capture'),
});
