// Handle SELECT_SAVE_LOCATION
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
