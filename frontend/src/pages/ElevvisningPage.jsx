// frontend/src/pages/ElevvisningPage.jsx (Utdrag med endringer)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AutocompleteSearch from '../components/AutocompleteSearch';
import ConfirmationModal from '../components/ConfirmationModal';
import CommentModal from '../components/CommentModal'; // <-- 1. Importer ny komponent
import './ElevvisningPage.css';

function ElevvisningPage() {
    // ... (alle eksisterende states forblir de samme)
    const { id } = useParams();
    const navigate = useNavigate();
    const [elevSearchTerm, setElevSearchTerm] = useState('');
    const [elev, setElev] = useState(null);
    const [tilrettelegginger, setTilrettelegginger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [globalKommentar, setGlobalKommentar] = useState('');
    const [nyttFagData, setNyttFagData] = useState({ faggruppe_navn: '', fagnavn: '', lærer: '' });
    const [selectedFagForDeletion, setSelectedFagForDeletion] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ navn: '', klasse: '' });

    // --- 2. Ny state for kommentar-modal ---
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [currentEditingComment, setCurrentEditingComment] = useState(null); // { id, kommentar }

    const klasseliste = ['1STA', '1STB', '1STC', '1STD', '1STE', '1STF', '1STG', '2STA', '2STB', '2STC', '2STD', '2STE', '2STF', '2STG', '3STA', '3STB', '3STC', '3STD', '3STE', '3STF', '3STG'];

    // ... (fetchElevData og andre funksjoner forblir de samme)
    const fetchElevData = useCallback(async (elevId) => {
        if (!elevId) { setLoading(false); return; }
        setLoading(true);
        setMessage('');
        setError('');
        const result = await window.api.sendRequest({ method: 'GET', endpoint: `/api/elever/${elevId}` });
        if (result && !result.error) {
            setElev(result);
            setTilrettelegginger(result.tilrettelegginger || []);
            setEditData({ navn: result.navn, klasse: result.klasse });
        } else {
            setError('Kunne ikke laste elevdata.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchElevData(id);
        setGlobalKommentar('');
        setIsEditing(false);
    }, [id, fetchElevData]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!editData.navn || !editData.klasse) {
            setError("Navn og klasse kan ikke være tomme.");
            return;
        }
        const result = await window.api.sendRequest({
            method: 'PUT',
            endpoint: `/api/elever/${id}`,
            body: editData
        });

        if (result && !result.error) {
            setMessage('Elevdata oppdatert!');
            await fetchElevData(id);
            setIsEditing(false);
        } else {
            setError('Kunne ikke oppdatere elevdata.');
        }
    };
    
    // --- 3. Nye funksjoner for å håndtere modalen ---
    const openCommentModal = (tilrettelegging) => {
        setCurrentEditingComment({ 
            id: tilrettelegging.tilrettelegging_id, 
            kommentar: tilrettelegging.kommentar 
        });
        setIsCommentModalOpen(true);
    };

    const closeCommentModal = () => {
        setIsCommentModalOpen(false);
        setCurrentEditingComment(null);
    };

    const handleSaveComment = (newComment) => {
        if (currentEditingComment) {
            // Bruker den eksisterende funksjonen for å oppdatere backend og state
            handleUpdateTilrettelegging(currentEditingComment.id, 'kommentar', newComment);
        }
        closeCommentModal();
    };


    const handleUpdateTilrettelegging = async (tilretteleggingId, field, value) => {
        // For checkboxes, konverter boolean til tall
        const finalValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;

        const optimisticUpdate = tilrettelegginger.map(t =>
            t.tilrettelegging_id === tilretteleggingId ? { ...t, [field]: finalValue } : t
        );
        setTilrettelegginger(optimisticUpdate);
        
        const updatedFag = optimisticUpdate.find(t => t.tilrettelegging_id === tilretteleggingId);

        await window.api.sendRequest({
            method: 'PUT',
            endpoint: `/api/tilrettelegging/${tilretteleggingId}`,
            body: updatedFag
        });
    };
    // ... (resten av de eksisterende funksjonene forblir de samme)
    const handleGlobalTilretteleggingChange = async (field, value) => {
        if (!elev) return;
        const oppdaterteTilrettelegginger = tilrettelegginger.map(t => ({ ...t, [field]: value ? 1 : 0 }));
        setTilrettelegginger(oppdaterteTilrettelegginger);
        await window.api.sendRequest({
            method: 'POST',
            endpoint: `/api/elever/${elev.elev_id}/bulk-update-tilrettelegginger`,
            body: { field, value }
        });
    };
    const handleElevSearchSelect = (selectedElev) => {
        if (selectedElev && selectedElev.elev_id) {
            navigate(`/elev/${selectedElev.elev_id}`);
            setElevSearchTerm('');
        }
    };
    const handleFaggruppeSelectForNewFag = async (selectedFaggruppe) => {
        const faggruppeNavn = selectedFaggruppe.faggruppe_navn;
        setNyttFagData(prev => ({ ...prev, faggruppe_navn: faggruppeNavn, fagnavn: '', lærer: '' }));
        const result = await window.api.sendRequest({ method: 'GET', endpoint: `/api/faggrupper/${faggruppeNavn}` });
        if (result && !result.error) {
            setNyttFagData(prev => ({ ...prev, faggruppe_navn: faggruppeNavn, fagnavn: result.fagnavn || '', lærer: result.lærer || '' }));
        }
    };
    const handleGlobalKommentarSubmit = async () => {
        if (!elev) return;
        const oppdaterteTilrettelegginger = tilrettelegginger.map(t => ({ ...t, kommentar: globalKommentar }));
        setTilrettelegginger(oppdaterteTilrettelegginger);
        await window.api.sendRequest({
            method: 'POST',
            endpoint: `/api/elever/${elev.elev_id}/bulk-update-kommentar`,
            body: { kommentar: globalKommentar }
        });
    };
    const handleAddFagChange = (e) => {
        const { name, value } = e.target;
        setNyttFagData(prev => ({ ...prev, [name]: value }));
    };
    const handleAddFagSubmit = async (e) => {
        e.preventDefault();
        if (!elev || !nyttFagData.faggruppe_navn) { setError('Faggruppe-navn er påkrevd.'); return; }
        const result = await window.api.sendRequest({
            method: 'POST',
            endpoint: '/api/tilrettelegging',
            body: { elev_id: elev.elev_id, ...nyttFagData }
        });
        if (result && !result.error) {
            setMessage('Fag lagt til!');
            setNyttFagData({ faggruppe_navn: '', fagnavn: '', lærer: '' });
            fetchElevData(id);
        } else {
            setError('Kunne ikke legge til fag.');
        }
    };
    const handleSelectFagForDeletion = (fagId) => {
        setSelectedFagForDeletion(prev => prev.includes(fagId) ? prev.filter(id => id !== fagId) : [...prev, fagId]);
    };
    const handleDeleteClick = () => {
        if (selectedFagForDeletion.length > 0) { setIsDeleteModalOpen(true); }
    };
    const confirmDeletion = async () => {
        for (const fagId of selectedFagForDeletion) {
            await window.api.sendRequest({ method: 'DELETE', endpoint: `/api/tilrettelegging/${fagId}` });
        }
        setMessage('Valgte fag er slettet!');
        setSelectedFagForDeletion([]);
        setIsDeleteModalOpen(false);
        fetchElevData(id);
    };

    if (loading) return <p style={{textAlign: 'center'}}>Laster elevdata...</p>;
    if (!elev && error) return <p className="error-message">{error}</p>;
    if (!elev) return <p style={{textAlign: 'center'}}>Ingen elev valgt eller funnet. Søk i feltet over.</p>;

    return (
        <div className="elevvisning-container">
            {/* ... (Header og elev-info-boks forblir uendret) ... */}
            <div className="elevvisning-header">
                <h1>Elevvisning</h1>
                <AutocompleteSearch apiEndpoint="/api/elever" onSelect={handleElevSearchSelect} displayField="navn" placeholder="Søk for å bytte elev..." value={elevSearchTerm} onInputChange={setElevSearchTerm}/>
                <button onClick={() => navigate('/')} className="back-button">Tilbake</button>
            </div>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="elev-info-box">
                {isEditing ? (
                    <div className="elev-edit-form">
                        <input
                            className="edit-input-name"
                            type="text"
                            name="navn"
                            value={editData.navn}
                            onChange={handleEditChange}
                        />
                        <AutocompleteSearch
                            suggestionsList={klasseliste.map(k => ({ klasse: k }))}
                            displayField="klasse"
                            placeholder="Klasse"
                            value={editData.klasse}
                            onInputChange={(val) => setEditData(prev => ({ ...prev, klasse: val }))}
                            onSelect={(item) => setEditData(prev => ({ ...prev, klasse: item.klasse }))}
                        />
                        <div className="edit-buttons">
                            <button onClick={handleSaveChanges}>Lagre</button>
                            <button onClick={() => setIsEditing(false)} className="cancel-button">Avbryt</button>
                        </div>
                    </div>
                ) : (
                    <div className="elev-display">
                        <h2>Elev: {elev.navn} ({elev.klasse})</h2>
                        <button onClick={() => setIsEditing(true)}>Endre</button>
                    </div>
                )}
                
                <div className="global-tilrettelegging-checkboxes">
                    <label><input type="checkbox" checked={tilrettelegginger.every(t => t.ekstra_tid === 1)} onChange={(e) => handleGlobalTilretteleggingChange('ekstra_tid', e.target.checked)} /> Ekstra tid (for alle fag)</label>
                    <label><input type="checkbox" checked={tilrettelegginger.every(t => t.skjermet_plass === 1)} onChange={(e) => handleGlobalTilretteleggingChange('skjermet_plass', e.target.checked)} /> Skjermet plass (for alle fag)</label>
                    <label><input type="checkbox" checked={tilrettelegginger.every(t => t.opplest_oppgave === 1)} onChange={(e) => handleGlobalTilretteleggingChange('opplest_oppgave', e.target.checked)} /> Opplest oppgave (for alle fag)</label>
                </div>
                <div className="global-comment-section">
                    <input type="text" placeholder="Skriv felles kommentar for alle fag her..." value={globalKommentar} onChange={(e) => setGlobalKommentar(e.target.value)} />
                    <button onClick={handleGlobalKommentarSubmit}>Bruk for alle</button>
                </div>
            </div>

            <div className="glass-box">
                <h3>Tilrettelegginger per fag</h3>
                <table className="tilrettelegging-table">
                    <thead><tr><th>Faggruppe</th><th>Fagnavn</th><th>Lærer</th><th>Ekstra tid</th><th>Skjermet plass</th><th>Opplest oppgave</th><th>Kommentar</th></tr></thead>
                    <tbody>
                        {tilrettelegginger.map((t) => (
                            <tr key={t.tilrettelegging_id}>
                                <td>{t.faggruppe_navn}</td>
                                <td>{t.fagnavn || '-'}</td>
                                <td>{t.lærer || '-'}</td>
                                <td><input type="checkbox" checked={t.ekstra_tid === 1} onChange={(e) => handleUpdateTilrettelegging(t.tilrettelegging_id, 'ekstra_tid', e.target.checked)} /></td>
                                <td><input type="checkbox" checked={t.skjermet_plass === 1} onChange={(e) => handleUpdateTilrettelegging(t.tilrettelegging_id, 'skjermet_plass', e.target.checked)} /></td>
                                <td><input type="checkbox" checked={t.opplest_oppgave === 1} onChange={(e) => handleUpdateTilrettelegging(t.tilrettelegging_id, 'opplest_oppgave', e.target.checked)} /></td>
                                
                                {/* --- 4. Oppdatert kommentarcelle --- */}
                                <td className="kommentar-celle clickable" onClick={() => openCommentModal(t)}>
                                    <span>{t.kommentar || '...'}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ... (seksjoner for å legge til/slette fag forblir uendret) ... */}
            <div className="add-fag-section">
                <h3>Legg til nytt fag</h3>
                <form onSubmit={handleAddFagSubmit} className="add-fag-form"><AutocompleteSearch apiEndpoint="/api/faggrupper" displayField="faggruppe_navn" placeholder="Faggruppe (f.eks. B/REA3058)" value={nyttFagData.faggruppe_navn} onInputChange={(val) => handleAddFagChange({ target: { name: 'faggruppe_navn', value: val } })} onSelect={handleFaggruppeSelectForNewFag} /><input type="text" name="fagnavn" placeholder="Fagnavn (valgfritt)" value={nyttFagData.fagnavn} onChange={handleAddFagChange} /><input type="text" name="lærer" placeholder="Lærer (valgfritt)" value={nyttFagData.lærer} onChange={handleAddFagChange} /><button type="submit" className="add-fag-button">Legg til fag</button></form>
            </div>
            <div className="delete-fag-section">
                <h3>Slett fag</h3>
                {tilrettelegginger.length > 0 ? (<><ul className="fag-deletion-list">{tilrettelegginger.map((t) => (<li key={t.tilrettelegging_id}><label><input type="checkbox" checked={selectedFagForDeletion.includes(t.tilrettelegging_id)} onChange={() => handleSelectFagForDeletion(t.tilrettelegging_id)} />{t.faggruppe_navn} {t.fagnavn && `(${t.fagnavn})`}</label></li>))}</ul><button onClick={handleDeleteClick} className="delete-selected-fag-button" disabled={selectedFagForDeletion.length === 0}>Slett valgte fag</button></>) : <p>Ingen fag å slette.</p>}
            </div>

            {/* Render modal-komponentene */}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeletion} title="Bekreft sletting">Er du sikker på at du vil slette {selectedFagForDeletion.length} fag? Handlingen kan ikke angres.</ConfirmationModal>
            
            <CommentModal 
                isOpen={isCommentModalOpen}
                onClose={closeCommentModal}
                onSave={handleSaveComment}
                initialComment={currentEditingComment ? currentEditingComment.kommentar : ''}
            />
        </div>
    );
}

export default ElevvisningPage;