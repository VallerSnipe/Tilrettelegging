// database-handler.js

const xlsx = require('xlsx');

module.exports = function(db) {
    return {
        getElever(sok = '') {
            try {
                const query = `SELECT elev_id, navn, klasse FROM elever WHERE navn LIKE ? ORDER BY navn LIMIT 10`;
                return db.prepare(query).all(sok + '%');
            } catch (error) { console.error("Feil i getElever:", error); return { error: error.message }; }
        },
        getFaggrupper(sok = '') {
            try {
                const query = `SELECT DISTINCT faggruppe_navn FROM tilrettelegginger WHERE faggruppe_navn LIKE ? ORDER BY faggruppe_navn LIMIT 10`;
                return db.prepare(query).all(sok + '%');
            } catch (error) { console.error("Feil i getFaggrupper:", error); return { error: error.message }; }
        },
        getElevById(id) {
            try {
                const elev = db.prepare('SELECT * FROM elever WHERE elev_id = ?').get(id);
                if (!elev) { return { error: 'Elev ikke funnet.' }; }
                const tilrettelegginger = db.prepare('SELECT * FROM tilrettelegginger WHERE elev_id = ? ORDER BY faggruppe_navn').all(id);
                return { ...elev, tilrettelegginger };
            } catch (error) { console.error("Feil i getElevById:", error); return { error: error.message }; }
        },
        getFaggruppeDetails(faggruppeNavn) {
            try { return db.prepare('SELECT fagnavn, lærer FROM tilrettelegginger WHERE faggruppe_navn = ? LIMIT 1').get(faggruppeNavn); } 
            catch (error) { console.error(`Feil i getFaggruppeDetails:`, error); return { error: error.message }; }
        },
        getEleverForFaggruppe(faggruppeNavn) {
            try {
                // 1. Hent listen over elever som før
                const eleverQuery = `
                    SELECT e.elev_id, e.navn, e.klasse, t.faggruppe_navn, 
                           t.ekstra_tid, t.skjermet_plass, t.opplest_oppgave, t.kommentar 
                    FROM elever e 
                    JOIN tilrettelegginger t ON e.elev_id = t.elev_id 
                    WHERE t.faggruppe_navn = ? 
                    ORDER BY e.navn`;
                const elever = db.prepare(eleverQuery).all(faggruppeNavn);

                // 2. Trekk ut rom-informasjon fra faggruppenavnet
                const parts = faggruppeNavn.split(' ');
                const rom = parts.length > 1 ? parts[0] : 'Ikke spesifisert';

                // 3. Returner et objekt som inneholder både elever og rom
                return { elever, rom };

            } catch (error) {
                console.error(`Feil i getEleverForFaggruppe:`, error);
                return { error: error.message };
            }
        },
        addElev({ navn, klasse }) {
            try { const result = db.prepare('INSERT INTO elever (navn, klasse) VALUES (?, ?)').run(navn, klasse); return { id: result.lastInsertRowid, navn, klasse }; } 
            catch (error) { console.error(`Feil i addElev:`, error); return { error: error.message }; }
        },
        deleteElev(id) {
            try { const result = db.prepare('DELETE FROM elever WHERE elev_id = ?').run(id); return { changes: result.changes }; } 
            catch (error) { console.error(`Feil i deleteElev:`, error); return { error: error.message }; }
        },
        addTilrettelegging(data) {
            try { 
                const { elev_id, faggruppe_navn, fagnavn, lærer } = data; 
                const stmt = db.prepare(`INSERT INTO tilrettelegginger (elev_id, faggruppe_navn, fagnavn, lærer, ekstra_tid, skjermet_plass, opplest_oppgave, kommentar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`); 
                const result = stmt.run(elev_id, faggruppe_navn, fagnavn, lærer, 0, 0, 0, ""); 
                return { id: result.lastInsertRowid }; 
            } catch (error) { console.error(`Feil i addTilrettelegging:`, error); return { error: error.message }; }
        },
        deleteTilrettelegging(id) {
            try { const result = db.prepare('DELETE FROM tilrettelegginger WHERE tilrettelegging_id = ?').run(id); return { changes: result.changes }; } 
            catch (error) { console.error(`Feil i deleteTilrettelegging:`, error); return { error: error.message }; }
        },
        updateTilrettelegging(id, data) {
            try { 
                const { ekstra_tid, skjermet_plass, opplest_oppgave, kommentar } = data; 
                const stmt = db.prepare(`UPDATE tilrettelegginger SET ekstra_tid = ?, skjermet_plass = ?, opplest_oppgave = ?, kommentar = ? WHERE tilrettelegging_id = ?`); 
                const result = stmt.run(ekstra_tid ? 1 : 0, skjermet_plass ? 1 : 0, opplest_oppgave ? 1 : 0, kommentar, id); 
                return { changes: result.changes }; 
            } catch (error) { console.error(`Feil i updateTilrettelegging:`, error); return { error: error.message }; }
        },
        bulkUpdateTilrettelegginger(elevId, { field, value }) {
            try { 
                const tillatteFelter = ['ekstra_tid', 'skjermet_plass', 'opplest_oppgave']; 
                if (!tillatteFelter.includes(field)) throw new Error('Ugyldig felt for oppdatering.'); 
                const query = `UPDATE tilrettelegginger SET ${field} = ? WHERE elev_id = ?`; 
                const result = db.prepare(query).run(value ? 1 : 0, elevId); 
                return { changes: result.changes }; 
            } catch (error) { console.error(`Feil i bulkUpdateTilrettelegginger:`, error); return { error: error.message }; }
        },
        bulkUpdateKommentar(elevId, { kommentar }) {
            try { const query = `UPDATE tilrettelegginger SET kommentar = ? WHERE elev_id = ?`; const result = db.prepare(query).run(kommentar, elevId); return { changes: result.changes }; } 
            catch (error) { console.error(`Feil i bulkUpdateKommentar:`, error); return { error: error.message }; }
        },
        updateElev(id, { navn, klasse }) {
            try { 
                const formatertNavn = navn.split(' ').map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' '); 
                const stmt = db.prepare('UPDATE elever SET navn = ?, klasse = ? WHERE elev_id = ?'); 
                const result = stmt.run(formatertNavn, klasse.toUpperCase(), id); 
                return { changes: result.changes }; 
            } catch (error) { console.error(`Feil i updateElev:`, error); return { error: error.message }; }
        },
        clearAllData() {
            try { 
                const clearTransaction = db.transaction(() => { 
                    db.prepare('DELETE FROM tilrettelegginger').run(); 
                    db.prepare('DELETE FROM elever').run(); 
                    try { db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('elever', 'tilrettelegginger')").run(); } catch (e) { /* Ignorer hvis tabell ikke finnes */ } 
                }); 
                clearTransaction(); 
                return { success: true, message: 'All elevdata er slettet.' }; 
            } catch (error) { console.error(`Feil i clearAllData:`, error); return { error: error.message }; }
        },
        importExcelData(filePath) {
            try {
                const workbook = xlsx.readFile(filePath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
                if (data.length < 2) { return { error: 'Excel-filen er tom eller har feil format.' }; }
                const dataRows = data.slice(1);
                const insertElev = db.prepare('INSERT INTO elever (navn, klasse) VALUES (?, ?)');
                const findElev = db.prepare('SELECT elev_id FROM elever WHERE navn = ? AND klasse = ?');
                const insertTilrettelegging = db.prepare('INSERT INTO tilrettelegginger (elev_id, faggruppe_navn, fagnavn, lærer) VALUES (?, ?, ?, ?)');
                const importTransaction = db.transaction(() => {
                    for (const row of dataRows) {
                        const navn = row[0];
                        const klasse = row[1];
                        const fagnavn = row[2];
                        const laerer = row[3];
                        const faggruppe = row[4];
                        if (!navn || !klasse || !faggruppe) { continue; }
                        let elev = findElev.get(navn, klasse);
                        if (!elev) {
                            const result = insertElev.run(navn, klasse);
                            elev = { elev_id: result.lastInsertRowid };
                        }
                        insertTilrettelegging.run(elev.elev_id, faggruppe, fagnavn, laerer);
                    }
                });
                importTransaction();
                return { success: true, message: `${dataRows.length} rader ble behandlet.` };
            } catch (error) {
                console.error('Feil under import fra Excel:', error);
                return { error: 'Kunne ikke importere filen. Sjekk at formatet er riktig og at filen ikke er åpen i Excel.' };
            }
        }
    };
};