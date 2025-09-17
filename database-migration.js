// database-migration.js

// Definer den nyeste versjonen av databasestrukturen din her.
const LATEST_DB_VERSION = 1;

function runMigrations(db) {
    const { user_version } = db.prepare('PRAGMA user_version').get();
    let currentVersion = user_version;

    console.log(`Database-versjon: ${currentVersion}, Siste versjon: ${LATEST_DB_VERSION}`);

    if (currentVersion === LATEST_DB_VERSION) {
        console.log('Databasen er allerede på siste versjon.');
        return;
    }

    // Kjører alle migreringer innenfor én transaksjon for sikkerhet.
    const migrate = db.transaction(() => {
        console.log(`Starter migrering fra versjon ${currentVersion}...`);

        // ====================================================================
        // Migrering til versjon 1: Oppretter den grunnleggende strukturen.
        // Denne kjøres kun hvis databasen er helt ny (versjon 0).
        // ====================================================================
        if (currentVersion < 1) {
            console.log('Kjører migrering til v1: Oppretter databasens tabeller...');
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
                    ekstra_tid INTEGER DEFAULT 0,
                    skjermet_plass INTEGER DEFAULT 0,
                    opplest_oppgave INTEGER DEFAULT 0,
                    kommentar TEXT,
                    FOREIGN KEY (elev_id) REFERENCES elever(elev_id) ON DELETE CASCADE
                );
            `);
            console.log('Tabeller opprettet.');
        }

        // ====================================================================
        // FREMTIDIGE MIGRERINGER LEGGES TIL HER
        // ====================================================================
        // Eksempel: Migrering til versjon 2 (når du trenger det i fremtiden)
        // if (currentVersion < 2) {
        //     console.log('Kjører migrering til v2: Legger til epost-kolonne...');
        //     db.prepare('ALTER TABLE elever ADD COLUMN epost TEXT').run();
        // }
        // ====================================================================


        // Oppdaterer databasens versjonsnummer til den nyeste til slutt.
        db.prepare(`PRAGMA user_version = ${LATEST_DB_VERSION}`).run();
        console.log(`Databasemigrering fullført. Ny versjon er ${LATEST_DB_VERSION}.`);
    });

    migrate();
}

module.exports = { runMigrations };