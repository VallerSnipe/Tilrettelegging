// preload.js (Komplett og oppdatert)

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Sender en forespørsel og forventer et svar
    sendRequest: (requestDetails) => ipcRenderer.invoke('api-request', requestDetails),
    
    // NY FUNKSJON: Sender en melding om å lukke appen (trenger ikke svar)
    quitApp: () => ipcRenderer.send('quit-app')
});