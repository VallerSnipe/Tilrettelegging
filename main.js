// main.js (Endelig, ren versjon)

const { app, BrowserWindow, ipcMain, net, shell, Notification } = require('electron');
const path = require('path');
const log = require('electron-log');
const semver = require('semver');
const serverApp = require('./server.js');
const dbHandler = require('./database-handler.js');

// Konfigurer hvor loggfilen skal lagres. Dette må gjøres etter 'app' er klar.
function configureLogging() {
    log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
    log.info('--- Ny app-økt startet ---');
}

const PORT = 3001;
let mainWindow;

function checkForUpdates() {
    log.info('Starter sjekk for oppdateringer...');
    const currentVersion = app.getVersion();
    log.info(`Gjeldende app-versjon: ${currentVersion}`);
    
    const repoOwner = 'VallerSnipe';
    const repoName = 'Tilrettelegging';

    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
    log.info(`Sjekker mot URL: ${apiUrl}`);

    const request = net.request(apiUrl);

    request.on('response', (response) => {
        log.info(`Mottok svar fra GitHub. Statuskode: ${response.statusCode}`);
        if (response.statusCode !== 200) {
            log.error(`Feil statuskode mottatt: ${response.statusCode}`);
            return;
        }

        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
            try {
                const release = JSON.parse(body);
                if (!release.tag_name) {
                    log.warn('Svar fra GitHub manglet "tag_name". Sjekk at releasen er publisert korrekt.');
                    return;
                }
                
                const latestVersion = release.tag_name.replace('v', '');
                log.info(`Siste versjon funnet på GitHub: ${latestVersion}`);
                
                log.info(`Sammenligner: ${latestVersion} (ny) > ${currentVersion} (gammel)?`);
                if (semver.gt(latestVersion, currentVersion)) {
                    log.info('Ny versjon funnet! Viser varsel.');
                    new Notification({
                        title: 'Ny versjon tilgjengelig!',
                        body: `Versjon ${latestVersion} er klar for nedlasting.`,
                    }).on('click', () => {
                        shell.openExternal(release.html_url);
                    }).show();
                } else {
                    log.info('Ingen ny versjon funnet.');
                }
            } catch (e) {
                log.error('Kunne ikke behandle svar fra GitHub:', e.message);
            }
        });
    });

    request.on('error', (error) => {
        log.error(`Feil ved sjekk av oppdatering (nettverksfeil): ${error.message}`);
    });

    request.end();
}

function startServer() {
    serverApp.listen(PORT, () => {
        log.info(`Backend-server for utvikling startet på http://localhost:${PORT}`);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({ width: 1400, height: 900, icon: path.join(__dirname, 'frontend/public/Valler.png'), webPreferences: { preload: path.join(__dirname, 'preload.js'), webSecurity: true, nodeIntegration: false, contextIsolation: true, }, });
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
    // Konfigurer logging så snart appen er klar
    configureLogging();

    const isDev = !app.isPackaged;
    if (isDev) { startServer(); }
    
    createWindow();
    checkForUpdates();
    
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

ipcMain.on('quit-app', () => { app.quit(); });

ipcMain.handle('api-request', async (event, { method = 'GET', endpoint, params, body }) => {
    log.info(`IPC Mottatt: ${method} ${endpoint}`);
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
        log.error(`Feil i IPC-handler for ${endpoint}:`, error.message);
        return { error: error.message };
    }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { log.info('Appen avsluttes.'); });