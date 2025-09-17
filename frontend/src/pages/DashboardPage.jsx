// frontend/src/pages/DashboardPage.jsx (Endelig og komplett)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AutocompleteSearch from '../components/AutocompleteSearch';
import './DashboardPage.css';

function DashboardPage() {
    const navigate = useNavigate();
    const [elevSearchTerm, setElevSearchTerm] = useState('');
    const [faggruppeSearchTerm, setFaggruppeSearchTerm] = useState('');

    const handleElevSelect = (elev) => {
        if (elev && elev.elev_id) {
            // Navigerer direkte med IDen
            navigate(`/elev/${elev.elev_id}`);
            // Tømmer søkefeltet
            setElevSearchTerm('');
        }
    };

    const handleFaggruppeSelect = (faggruppe) => {
        if (faggruppe && faggruppe.faggruppe_navn) {
            // Koder faggruppenavnet for å håndtere spesialtegn i URLen
            const faggruppeUrl = encodeURIComponent(faggruppe.faggruppe_navn); 
            navigate(`/faggruppe/${faggruppeUrl}`);
            // Tømmer søkefeltet
            setFaggruppeSearchTerm('');
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Tilrettelegging Valler VGS</h1>
            <p>Søk etter en elev eller en faggruppe for å se detaljer og tilrettelegginger.</p>
            <div className="search-widgets">
                <div className="search-widget">
                    <h2>Søk Elev</h2>
                    <AutocompleteSearch
                        apiEndpoint="/api/elever"
                        onSelect={handleElevSelect}
                        displayField="navn"
                        placeholder="Skriv inn elevnavn..."
                        value={elevSearchTerm}
                        onInputChange={setElevSearchTerm}
                    />
                </div>
                <div className="search-widget">
                    <h2>Søk Faggruppe</h2>
                    <AutocompleteSearch
                        apiEndpoint="/api/faggrupper"
                        onSelect={handleFaggruppeSelect}
                        displayField="faggruppe_navn"
                        placeholder="Skriv inn faggruppenavn..."
                        value={faggruppeSearchTerm}
                        onInputChange={setFaggruppeSearchTerm}
                    />
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;