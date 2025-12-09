// server.js (Forenklet og korrekt versjon for Electron-prosjektet)

const express = require('express');
const cors = require('cors');

// Importerer 'db' i tilfelle du skulle trenge den til noe, men ingen funksjoner.
const { db } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Den gamle createTables()-kallet som forårsaket krasjen, er nå fjernet.
// Migreringssystemet i db.js håndterer opprettelse av tabeller automatisk ved oppstart.

// Alle de gamle API-endepunktene er fjernet herfra, siden de håndteres
// av IPC-systemet i main.js for Electron-appen.
// Denne serveren er nå kun en "dummy" som trengs for utviklingsmodus.

app.get('/', (req, res) => {
    res.send('Dummy backend-server for utvikling kjører.');
});

module.exports = app;