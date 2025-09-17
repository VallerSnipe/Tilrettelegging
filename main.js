// main.js

const { app, BrowserWindow, ipcMain, net, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const semver = require('semver');
const serverApp = require('./server.js');

// Importer funksjoner, men ikke initialiser noe ennå
const { connectToDatabase } = require('./db.js');
const { runMigrations } = require('./database-migration.js');
const dbHandlerFactory = require('./database-handler.js');

let db;
let dbHandler;

// ... (checkForUpdates, startServer, createWindow forblir uendret) ...
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
        if (response.statusCode !== 200) { log.error(`Feil statuskode mottatt: ${response.statusCode}`); return; }
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
            try {
                const release = JSON.parse(body);
                if (!release.tag_name) { log.warn('Svar fra GitHub manglet "tag_name".'); return; }
                const latestVersion = release.tag_name.replace('v', '');
                log.info(`Siste versjon funnet på GitHub: ${latestVersion}`);
                log.info(`Sammenligner: ${latestVersion} (ny) > ${currentVersion} (gammel)?`);
                if (semver.gt(latestVersion, currentVersion)) {
                    log.info('Ny versjon funnet! Viser varsel.');
                    new Notification({ title: 'Ny versjon tilgjengelig!', body: `Versjon ${latestVersion} er klar for nedlasting.`}).on('click', () => { shell.openExternal(release.html_url); }).show();
                } else {
                    log.info('Ingen ny versjon funnet.');
                }
            } catch (e) { log.error('Kunne ikke behandle svar fra GitHub:', e.message); }
        });
    });
    request.on('error', (error) => { log.error(`Feil ved sjekk av oppdatering (nettverksfeil): ${error.message}`); });
    request.end();
}
let mainWindow;
function startServer() { log.info(`Backend-server for utvikling startet.`); serverApp.listen(3001); }
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

// === NY, KORREKT OPPSTARTSSEKVENS ===
app.whenReady().then(() => {
    // 1. Konfigurer logging så snart appen er klar
    log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
    log.info('--- Ny app-økt startet ---');

    // 2. Bestem database-sti ETTER at appen er klar
    const isPackaged = app.isPackaged;
    let dbPath;
    if (isPackaged) {
        const userDataPath = app.getPath('userData');
        dbPath = path.join(userDataPath, 'tilrettelegging.db');
        const sourceDbPath = path.join(process.resourcesPath, 'tilrettelegging.db');
        if (fs.existsSync(sourceDbPath) && !fs.existsSync(dbPath)) {
            fs.copyFileSync(sourceDbPath, dbPath);
            log.info(`Database kopiert til ${dbPath}`);
        }
    } else {
        dbPath = path.join(__dirname, 'tilrettelegging.db');
    }

    // 3. Koble til og migrer databasen
    try {
        db = connectToDatabase(dbPath);
        runMigrations(db);
    } catch(err) {
        log.error("KRITISK FEIL VED DATABASE-INIT:", err);
        app.quit();
    }

    // 4. Initialiser database-handleren med den ferdige db-forbindelsen
    dbHandler = dbHandlerFactory(db);

    // 5. Start resten av appen
    const isDev = !app.isPackaged;
    if (isDev) { startServer(); }
    
    createWindow();
    checkForUpdates();
    
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

// ... (ipcMain.on og ipcMain.handle forblir identiske, da de bruker den nå initialiserte dbHandler)
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