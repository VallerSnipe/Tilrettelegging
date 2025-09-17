// db.js (Endelig versjon med korrekt databaseplassering OG migreringssystem)

const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const Database = require('better-sqlite3');

// 1. IMPORTERER DEN NYE MIGRERINGSFUNKSJONEN
const { runMigrations } = require('./database-migration.js');

// 2. DIN EKSISTERENDE, KORREKTE LOGIKK FOR Å FINNE DATABASESTI BEHOLDES
const isPackaged = app.isPackaged;
let dbPath;

if (isPackaged) {
    // I PRODUKSJON: Bruk den skrivebare 'userData'-mappen
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'tilrettelegging.db');
    
    // Kopier databasen fra den skrivebeskyttede kildekoden første gang appen kjøres
    const sourceDbPath = path.join(process.resourcesPath, 'tilrettelegging.db'); // Bruker process.resourcesPath i en pakket app
    if (fs.existsSync(sourceDbPath) && !fs.existsSync(dbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
        console.log(`Database kopiert til ${dbPath}`);
    }
} else {
    // I UTVIKLING: Bruk databasen direkte fra prosjektmappen
    dbPath = path.join(__dirname, 'tilrettelegging.db');
}

// 3. KOBLE TIL DATABASEN
console.log(`Kobler til database på: ${dbPath}`);
const db = new Database(dbPath);

// 4. KJØRER MIGRERINGER VED HVER OPPSTART (Erstatter createTables)
// Denne funksjonen vil nå sørge for at tabellene eksisterer og er oppdatert.
try {
    runMigrations(db);
} catch (error) {
    console.error("KRITISK FEIL under databasemigrering:", error);
}

// 5. EKSPORTERER KUN db-objektet nå
module.exports = { db };