// frontend/src/pages/FaggruppeVisningPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AutocompleteSearch from '../components/AutocompleteSearch';
import './FaggruppeVisningPage.css';

function FaggruppeVisningPage() {
    const { faggruppe: faggruppeFraUrl } = useParams();
    const navigate = useNavigate();

    const [sokeTekst, setSokeTekst] = useState('');
    const [elever, setElever] = useState([]);
    const [rom, setRom] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const fetchEleverData = async (faggruppe) => {
        if (!faggruppe) { setLoading(false); return; }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const result = await window.api.sendRequest({
                method: 'GET',
                endpoint: `/api/faggruppe/${encodeURIComponent(faggruppe)}`
            });
            if (result && !result.error) {
                setElever(result.elever || []);
                setRom(result.rom || 'Ikke spesifisert');
                if (!result.elever || result.elever.length === 0) {
                    setMessage('Ingen elever funnet i denne faggruppen.');
                }
            } else {
                throw new Error(result?.error || 'Ukjent feil');
            }
        } catch (err) {
            setError('Feil ved henting av data. Sjekk faggruppenavnet og prøv igjen.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEleverData(faggruppeFraUrl);
    }, [faggruppeFraUrl]);

    const navigateToFaggruppe = (faggruppe) => {
        if (!faggruppe) return;
        const urlSafeFaggruppe = encodeURIComponent(faggruppe);
        navigate(`/faggruppe/${urlSafeFaggruppe}`);
        setSokeTekst('');
    };

    const handleSok = () => {
        navigateToFaggruppe(sokeTekst);
    };

    const handleSuggestionClick = (suggestion) => {
        navigateToFaggruppe(suggestion.faggruppe_navn);
    };
    
    const handleEksportExcel = () => {
        if (elever.length === 0) return alert('Ingen data å eksportere.');
    
        // 1. Forbered data
        const reportHeader = [
            ["ROM:", rom],
            ["FAG:", aktivFaggruppeNavn],
            [] // Tom rad
        ];
        const tableHeader = ['Navn', 'Klasse', 'Ekstra tid', 'Skjermet plass', 'Opplest oppgave', 'Kommentar'];
        const tableBody = elever.map(elev => [
            elev.navn, elev.klasse,
            elev.ekstra_tid === 1 ? 'Ja' : '',
            elev.skjermet_plass === 1 ? 'Ja' : '',
            elev.opplest_oppgave === 1 ? 'Ja' : '',
            elev.kommentar || ''
        ]);
        const finalData = [...reportHeader, tableHeader, ...tableBody];
    
        // 2. Lag regneark
        const worksheet = XLSX.utils.aoa_to_sheet(finalData);
    
        // 3. Definer stiler
        const greenFill = { fgColor: { rgb: "C6EFCE" } }; // Lys grønn farge
        const border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    
        // 4. Gå gjennom alle celler og bruk stiler
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
                if (!worksheet[cell_ref]) continue;
                if (!worksheet[cell_ref].s) worksheet[cell_ref].s = {};
    
                // Bruk ramme på alle celler unntatt den tomme raden
                if (R !== 2) {
                    worksheet[cell_ref].s.border = border;
                }
    
                // Bruk grønn fyllfarge på header-rader
                if (R === 0 || R === 1 || R === 3) {
                    worksheet[cell_ref].s.fill = greenFill;
                }
            }
        }
    
        // 5. Sett kolonnebredder
        worksheet['!cols'] = [
            { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
        ];
    
        // 6. Lag og last ned filen
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Elever");
        XLSX.writeFile(workbook, `${aktivFaggruppeNavn.replace(/[/\\]/g, '-')}_elever.xlsx`);
    };

    const handleEksportPDF = () => {
        if (elever.length === 0) return alert('Ingen data å eksportere.');
        const doc = new jsPDF();
        
        doc.text(`ROM: ${rom}`, 14, 20);
        doc.text(`FAG: ${aktivFaggruppeNavn}`, 14, 28);

        autoTable(doc, {
            startY: 35,
            head: [['Navn', 'Klasse', 'Ekstra tid', 'Skjermet plass', 'Opplest oppgave', 'Kommentar']],
            body: elever.map(elev => [
                elev.navn, 
                elev.klasse, 
                elev.ekstra_tid === 1 ? 'Ja' : '', 
                elev.skjermet_plass === 1 ? 'Ja' : '', 
                elev.opplest_oppgave === 1 ? 'Ja' : '', 
                elev.kommentar || ''
            ])
        });
        doc.save(`${aktivFaggruppeNavn.replace(/[/\\]/g, '-')}_elever.pdf`);
    };

    const handleElevClick = (elevId) => {
        if (elevId) {
            navigate(`/elev/${elevId}`);
        }
    };
    
    const aktivFaggruppeNavn = faggruppeFraUrl ? decodeURIComponent(faggruppeFraUrl) : '';

    return (
        <div className="faggruppe-container">
            <div className="faggruppe-search-section">
                <h1>Faggruppevisning</h1>
                <div className="search-input-group">
                    <AutocompleteSearch 
                        apiEndpoint="/api/faggrupper"
                        displayField="faggruppe_navn"
                        placeholder="Søk for å bytte faggruppe..."
                        value={sokeTekst}
                        onInputChange={setSokeTekst}
                        onSelect={handleSuggestionClick}
                    />
                    <button onClick={handleSok}>Søk</button>
                </div>
            </div>
            
            {loading && <p style={{textAlign: 'center'}}>Laster...</p>}
            
            {!loading && aktivFaggruppeNavn && (
                <div className="faggruppe-content-section glass-box">
                    <div className="faggruppe-header">
                        <div className="report-info">
                            <p><strong>ROM:</strong> {rom}</p>
                            <p><strong>FAG:</strong> {aktivFaggruppeNavn}</p>
                        </div>
                        <div className="button-group">
                            <button onClick={handleEksportExcel}>Eksporter til Excel</button>
                            <button onClick={handleEksportPDF}>Eksporter til PDF</button>
                            <button onClick={() => navigate('/')}>Tilbake</button>
                        </div>
                    </div>
                    {error ? <p className="error-message" style={{textAlign: 'center'}}>{error}</p> : elever.length > 0 ? (
                        <table className="faggruppe-table">
                            <thead><tr><th>Navn</th><th>Klasse</th><th>Ekstra tid</th><th>Skjermet plass</th><th>Opplest oppgave</th><th>Kommentar</th></tr></thead>
                            <tbody>
                                {elever.map((elev) => (
                                    <tr key={elev.elev_id}>
                                        <td className="elev-navn-clickable" onClick={() => handleElevClick(elev.elev_id)}>
                                            {elev.navn}
                                        </td>
                                        <td>{elev.klasse}</td>
                                        <td>{elev.ekstra_tid === 1 ? 'Ja' : ''}</td>
                                        <td>{elev.skjermet_plass === 1 ? 'Ja' : ''}</td>
                                        <td>{elev.opplest_oppgave === 1 ? 'Ja' : ''}</td>
                                        <td className="kommentar-faggruppe">{elev.kommentar || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (<p style={{textAlign: 'center', padding: '1rem'}}>{message}</p>)}
                </div>
            )}
        </div>
    );
}

export default FaggruppeVisningPage;