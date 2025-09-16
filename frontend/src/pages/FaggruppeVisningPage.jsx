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
                endpoint: `/api/faggruppe/${faggruppe}`
            });
            if (result && !result.error) {
                setElever(result);
                if (result.length === 0) {
                    setMessage('Ingen elever funnet i denne faggruppen.');
                }
            } else {
                throw new Error(result?.error || 'Ukjent feil');
            }
        } catch (err) {
            setError('Feil ved søk. Sjekk faggruppenavnet og prøv igjen.');
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
        const dataForEksport = elever.map(elev => ({
            'Navn': elev.navn, 
            'Klasse': elev.klasse, 
            'Ekstra tid': elev.ekstra_tid === 1 ? 'Ja' : '', 
            'Skjermet plass': elev.skjermet_plass === 1 ? 'Ja' : '', 
            'Opplest oppgave': elev.opplest_oppgave === 1 ? 'Ja' : '', 
            'Kommentar': elev.kommentar || ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataForEksport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Elever");
        XLSX.writeFile(workbook, `${aktivFaggruppeNavn.replace(/[/\\]/g, '-')}_elever.xlsx`);
    };

    const handleEksportPDF = () => {
        if (elever.length === 0) return alert('Ingen data å eksportere.');
        const doc = new jsPDF();
        doc.text(`Elever for faggruppe: ${aktivFaggruppeNavn}`, 14, 20);
        autoTable(doc, {
            startY: 30,
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
                        <h2>Faggruppe: {aktivFaggruppeNavn}</h2>
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