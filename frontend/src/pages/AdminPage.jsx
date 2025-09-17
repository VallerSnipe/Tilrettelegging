// frontend/src/pages/AdminPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutocompleteSearch from '../components/AutocompleteSearch';
import ConfirmationModal from '../components/ConfirmationModal';
import './AdminPage.css';

function AdminPage() {
    const navigate = useNavigate();
    const [elevNavn, setElevNavn] = useState('');
    const [elevKlasse, setElevKlasse] = useState('');
    const [deleteSearchTerm, setDeleteSearchTerm] = useState('');
    const [addMessage, setAddMessage] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');
    const [importFile, setImportFile] = useState(null);
    const [importMessage, setImportMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [elevToDelete, setElevToDelete] = useState(null);
    const [isClearDbModalOpen, setIsClearDbModalOpen] = useState(false);
    const [clearDbMessage, setClearDbMessage] = useState('');
    
    const klasseliste = ['1STA', '1STB', '1STC', '1STD', '1STE', '1STF', '1STG', '2STA', '2STB', '2STC', '2STD', '2STE', '2STF', '2STG', '3STA', '3STB', '3STC', '3STD', '3STE', '3STF', '3STG'];

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const result = await window.api.sendRequest({
            method: 'POST',
            endpoint: '/api/elever',
            body: { navn: elevNavn, klasse: elevKlasse }
        });
        if (result && result.id) {
            navigate(`/elev/${result.id}`);
        } else {
            setAddMessage(`Feil: Kunne ikke legge til elev.`);
        }
    };
    
    const handleDeleteElev = (elev) => {
        if (elev && elev.elev_id) {
            setElevToDelete(elev);
            setIsModalOpen(true);
        }
    };

    const confirmDeletion = async () => {
        if (!elevToDelete) return;
        await window.api.sendRequest({ method: 'DELETE', endpoint: `/api/elever/${elevToDelete.elev_id}` });
        setDeleteMessage(`Elev '${elevToDelete.navn}' er slettet!`);
        setDeleteSearchTerm('');
        setIsModalOpen(false);
        setElevToDelete(null);
    };

    const handleFileChange = (e) => {
        setImportFile(e.target.files[0]);
    };
    const handleImportSubmit = async () => {
        alert("Import-funksjonalitet er ikke implementert ennå.");
    };

    const handleClearDatabase = async () => {
        setIsClearDbModalOpen(false);
        setClearDbMessage('Sletter data...');
        const result = await window.api.sendRequest({
            method: 'DELETE',
            endpoint: '/api/database/all-data'
        });
        if (result && result.success) {
            setClearDbMessage('All elevdata ble slettet!');
        } else {
            setClearDbMessage(`Feil: Kunne ikke slette data. ${result?.error || ''}`);
        }
    };

    return (
        <div className="admin-container">
            <h1>Elevadministrasjon</h1>
            {addMessage && <p className="success-message">{addMessage}</p>}
            {deleteMessage && <p className="error-message">{deleteMessage}</p>}
            {importMessage && <p className="success-message">{importMessage}</p>}
            {clearDbMessage && <p className={clearDbMessage.startsWith('Feil') ? 'error-message' : 'success-message'}>{clearDbMessage}</p>}
            
            <section className="admin-section glass-box">
                <h2>Legg til ny elev</h2>
                <form onSubmit={handleAddSubmit}>
                    <div className="form-group">
                        <input type="text" placeholder="Navn" value={elevNavn} onChange={(e) => setElevNavn(e.target.value)} required />
                        <AutocompleteSearch
                            suggestionsList={klasseliste.map(k => ({ klasse: k }))}
                            displayField="klasse"
                            placeholder="Klasse"
                            value={elevKlasse}
                            onInputChange={setElevKlasse}
                            onSelect={(item) => setElevKlasse(item.klasse)}
                        />
                    </div>
                    <button type="submit">Legg til elev</button>
                </form>
            </section>

            <section className="admin-section glass-box">
                <h2>Slett elev</h2>
                <p>Søk etter eleven du vil slette...</p>
                <AutocompleteSearch apiEndpoint="/api/elever" onSelect={handleDeleteElev} displayField="navn" placeholder="Søk etter elev for å slette..." value={deleteSearchTerm} onInputChange={setDeleteSearchTerm} />
            </section>

            <section className="admin-section glass-box">
                <h2>Importer elever fra Excel</h2>
                <div className="import-group">
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                    <button onClick={handleImportSubmit}>Importer elever</button>
                </div>
                <p>Merk: For en ren import, må du først tømme databasen i seksjonen under.</p>
            </section>
            
            <section className="admin-section glass-box danger-zone">
                <h2>Nullstill Database</h2>
                <p><strong>ADVARSEL:</strong> Denne handlingen vil permanent slette absolutt all elev- og tilretteleggingsdata fra programmet. Dette kan ikke angres.</p>
                <button 
                    className="danger-button" 
                    onClick={() => setIsClearDbModalOpen(true)}
                >
                    Slett all data
                </button>
            </section>
            
            <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={confirmDeletion} title="Bekreft sletting av elev">
                {elevToDelete && `Er du sikker på at du vil slette ${elevToDelete.navn}?`}
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isClearDbModalOpen}
                onClose={() => setIsClearDbModalOpen(false)}
                onConfirm={handleClearDatabase}
                title="Bekreft total sletting"
            >
                Er du helt sikker på at du vil slette ALL elev- og tilretteleggingsdata? Denne handlingen kan ikke angres.
            </ConfirmationModal>
        </div>
    );
}

export default AdminPage;