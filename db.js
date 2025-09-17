// db.js

const Database = require('better-sqlite3');

// Vi eksporterer nå kun en funksjon for å lage en ny database-instans
function connectToDatabase(dbPath) {
    console.log(`Kobler til database på: ${dbPath}`);
    return new Database(dbPath);
}

module.exports = { connectToDatabase };