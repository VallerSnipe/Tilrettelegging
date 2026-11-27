// preload.js

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Sender en generell forespørsel og forventer et svar
    sendRequest: (requestDetails) => ipcRenderer.invoke('api-request', requestDetails),

    // Sender melding om å lukke appen
    quitApp: () => ipcRenderer.send('quit-app'),

    // Håndterer filimport via webUtils.getPathForFile (kompatibel med Electron 31+)
    importFile: (fileOrPath) => {
        const filePath = typeof fileOrPath === 'string'
            ? fileOrPath
            : webUtils.getPathForFile(fileOrPath);
        return ipcRenderer.invoke('import-file', filePath);
    }
});