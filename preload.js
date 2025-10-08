// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Sender en generell forespørsel og forventer et svar
    sendRequest: (requestDetails) => ipcRenderer.invoke('api-request', requestDetails),
    
    // Sender melding om å lukke appen
    quitApp: () => ipcRenderer.send('quit-app'),

    // Ny funksjon for å håndtere filimport
    importFile: (filePath) => ipcRenderer.invoke('import-file', filePath)
});