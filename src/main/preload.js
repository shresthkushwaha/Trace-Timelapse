import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    startCapture: (params) => ipcRenderer.invoke('start-capture', params),
    stopCapture: (params) => ipcRenderer.invoke('stop-capture', params),
    onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_, data) => callback(data)),
});
