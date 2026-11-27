// db.js

const Database = require('better-sqlite3');

// Eksporterer kun en funksjon for å lage en ny database-instans
function connectToDatabase(dbPath) {
    console.log(`Kobler til database på: ${dbPath}`);
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    return db;
}

module.exports = { connectToDatabase };