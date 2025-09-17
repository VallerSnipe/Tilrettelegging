// main.js

const { app, BrowserWindow, ipcMain, net, shell, Notification } = require('electron');
const path = require('path');
const semver = require('semver'); // Bruker semver for pålitelig versjonssammenligning
const serverApp = require('./server.js');
const dbHandler = require('./database-handler.js');

const PORT = 3001;
let mainWindow;

function checkForUpdates() {
    const currentVersion = app.getVersion();
    const repoOwner = 'VallerSnipe';
    const repoName = 'Tilrettelegging';

    if (repoOwner === 'ditt-github-brukernavn' || repoName === 'ditt-repo-navn') {
        console.log("Oppdateringssjekk hoppet over: Vennligst konfigurer repoOwner og repoName i main.js.");
        return;
    }

    const request = net.request({
        method: 'GET',
        protocol: 'https',
        hostname: 'api.github.com',
        path: `/repos/${repoOwner}/${repoName}/releases/latest`,
        headers: { 'User-Agent': 'Electron-App-Updater' }
    });

    request.on('response', (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
            try {
                const release = JSON.parse(body);
                if (!release.tag_name) return;
                
                const latestVersion = release.tag_name.replace('v', '');

                // Bruker semver.gt() (greater than) for korrekt sammenligning
                if (semver.gt(latestVersion, currentVersion)) {
                    new Notification({
                        title: 'Ny versjon tilgjengelig!',
                        body: `Versjon ${latestVersion} er klar for nedlasting.`,
                    }).on('click', () => {
                        shell.openExternal(release.html_url);
                    }).show();
                }
            } catch (e) {
                console.error('Kunne ikke behandle svar fra GitHub:', e.message);
            }
        });
    });

    request.on('error', (error) => {
        console.error(`Feil ved sjekk av oppdatering: ${error.message}`);
    });

    request.end();
}

function startServer() {
    serverApp.listen(PORT, () => {
        console.log(`Backend-server for utvikling startet på http://localhost:${PORT}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, 'frontend/public/Valler.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.setMenu(null);
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
    const isDev = !app.isPackaged;
    if (isDev) {
        startServer();
    }
    createWindow();
    checkForUpdates();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

ipcMain.on('quit-app', () => {
    app.quit();
});

ipcMain.handle('api-request', async (event, { method = 'GET', endpoint, params, body }) => {
    console.log(`IPC Mottatt: ${method} ${endpoint}`);
    try {
        const elevByIdMatch = endpoint.match(/^\/api\/elever\/(\d+)$/);
        const faggruppeDetailsMatch = endpoint.match(/^\/api\/faggrupper\/(.+)$/);
        const faggruppeListMatch = endpoint.match(/^\/api\/faggruppe\/(.+)$/);
        const tilretteleggingMatch = endpoint.match(/^\/api\/tilrettelegging\/(\d+)$/);
        const bulkTilretteleggingMatch = endpoint.match(/^\/api\/elever\/(\d+)\/bulk-update-tilrettelegginger$/);
        const bulkKommentarMatch = endpoint.match(/^\/api\/elever\/(\d+)\/bulk-update-kommentar$/);
        
        if (method === 'GET') {
            if (elevByIdMatch) return dbHandler.getElevById(elevByIdMatch[1]);
            if (faggruppeDetailsMatch) return dbHandler.getFaggruppeDetails(decodeURIComponent(faggruppeDetailsMatch[1]));
            if (faggruppeListMatch) return dbHandler.getEleverForFaggruppe(decodeURIComponent(faggruppeListMatch[1]));
            if (endpoint === '/api/elever') return dbHandler.getElever(params?.sok);
            if (endpoint === '/api/faggrupper') return dbHandler.getFaggrupper(params?.sok);
        }
        if (method === 'POST') {
            if (endpoint === '/api/elever') return dbHandler.addElev(body);
            if (bulkTilretteleggingMatch) return dbHandler.bulkUpdateTilrettelegginger(bulkTilretteleggingMatch[1], body);
            if (bulkKommentarMatch) return dbHandler.bulkUpdateKommentar(bulkKommentarMatch[1], body);
            if (endpoint === '/api/tilrettelegging') return dbHandler.addTilrettelegging(body);
        }
        if (method === 'DELETE') {
            if (elevByIdMatch) return dbHandler.deleteElev(elevByIdMatch[1]);
            if (tilretteleggingMatch) return dbHandler.deleteTilrettelegging(tilretteleggingMatch[1]);
            if (endpoint === '/api/database/all-data') return dbHandler.clearAllData();
        }
        if (method === 'PUT') {
            if (tilretteleggingMatch) return dbHandler.updateTilrettelegging(tilretteleggingMatch[1], body);
            if (elevByIdMatch) return dbHandler.updateElev(elevByIdMatch[1], body);
        }

        throw new Error(`Ukjent endepunkt: ${method} ${endpoint}`);
    } catch (error) {
        console.error(`Feil i IPC-handler for ${endpoint}:`, error.message);
        return { error: error.message };
    }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { console.log('Appen avsluttes.'); });