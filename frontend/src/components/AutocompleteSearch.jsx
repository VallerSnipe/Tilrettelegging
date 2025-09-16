// frontend/src/components/AutocompleteSearch.jsx (Oppdatert)

import React, { useState, useEffect, useCallback } from 'react';
import './AutocompleteSearch.css';

function AutocompleteSearch({ apiEndpoint, suggestionsList, onSelect, displayField, placeholder, value, onInputChange }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const currentSearchTerm = value || '';

    const fetchOrFilterSuggestions = useCallback(async (term) => {
        if (term.length < 1) { setSuggestions([]); return; }
        setLoading(true);
        let result = [];
        try {
            if (suggestionsList) {
                result = suggestionsList.filter(item => item[displayField].toLowerCase().startsWith(term.toLowerCase()));
            } else if (apiEndpoint) {
                const ipcResult = await window.api.sendRequest({
                    method: 'GET',
                    endpoint: apiEndpoint,
                    params: { sok: term }
                });
                if (ipcResult && !ipcResult.error) { result = ipcResult; }
            }
            setSuggestions(result);
        } catch (error) {
            console.error("Feil ved henting av forslag:", error);
            setSuggestions([]);
        }
        setLoading(false);
    }, [apiEndpoint, suggestionsList, displayField]);

    useEffect(() => {
        const timeoutId = setTimeout(() => { fetchOrFilterSuggestions(currentSearchTerm); }, 200);
        return () => clearTimeout(timeoutId);
    }, [currentSearchTerm, fetchOrFilterSuggestions]);

    const handleSelectSuggestion = (suggestion) => {
        setSuggestions([]);
        if (onSelect) { onSelect(suggestion); }
    };
    
    const handleChange = (e) => { if (onInputChange) { onInputChange(e.target.value); } };

    return (
        <div className="autocomplete-container">
            <input type="text" value={currentSearchTerm} onChange={handleChange} placeholder={placeholder} />
            {loading && <div className="loading-indicator">Laster...</div>}
            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((item, index) => (
                        // ----- ENDRINGEN ER HER: onClick er byttet til onMouseDown -----
                        <li key={item.id || item[displayField] || index} onMouseDown={() => handleSelectSuggestion(item)}>
                            {item[displayField]} {item.klasse && item[displayField] !== item.klasse && `(${item.klasse})`}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AutocompleteSearch;