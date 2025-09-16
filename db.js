// db.js (Endelig versjon med korrekt databasehåndtering for Electron)

const path = require('path');
const fs = require('fs');
const { app } = require('electron'); // Importerer 'app' fra Electron for å finne riktig mappe
const Database = require('better-sqlite3');

// Sjekker om appen kjører som en ferdig pakke
const isPackaged = app.isPackaged;

// Setter riktig sti til databasen basert på om vi er i utvikling eller produksjon
let dbPath;

if (isPackaged) {
    // I PRODUKSJON: Bruk den skrivebare 'userData'-mappen
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'tilrettelegging.db');
    
    // Kopier databasen fra den skrivebeskyttede kildekoden første gang appen kjøres
    const sourceDbPath = path.join(__dirname, 'tilrettelegging.db');
    if (!fs.existsSync(dbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
    }
} else {
    // I UTVIKLING: Bruk databasen direkte fra prosjektmappen
    dbPath = path.join(__dirname, 'tilrettelegging.db');
}

// Koble til databasen på den korrekte, skrivebare stien
const db = new Database(dbPath);

function createTables() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS elever (
            elev_id INTEGER PRIMARY KEY,
            navn TEXT NOT NULL,
            klasse TEXT
        );
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS tilrettelegginger (
            tilrettelegging_id INTEGER PRIMARY KEY,
            elev_id INTEGER NOT NULL,
            faggruppe_navn TEXT,
            fagnavn TEXT,
            lærer TEXT,
            ekstra_tid BOOLEAN,
            skjermet_plass BOOLEAN,
            opplest_oppgave BOOLEAN,
            kommentar TEXT,
            FOREIGN KEY (elev_id) REFERENCES elever(elev_id) ON DELETE CASCADE
        );
    `);
}

module.exports = { db, createTables };