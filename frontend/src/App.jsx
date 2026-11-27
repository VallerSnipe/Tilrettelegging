// frontend/src/App.jsx

import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage.jsx';
import ElevvisningPage from './pages/ElevvisningPage.jsx';
import FaggruppeVisningPage from './pages/FaggruppeVisningPage.jsx';
import './App.css';

function App() {
    const [appVersion, setAppVersion] = useState('');

    useEffect(() => {
        let active = true;
        if (window?.api?.sendRequest) {
            window.api
                .sendRequest({ method: 'GET', endpoint: '/app/version' })
                .then((version) => {
                    if (active && typeof version === 'string' && version.length > 0) {
                        setAppVersion(version);
                    }
                })
                .catch(() => {});
        }
        return () => { active = false; };
    }, []);

    // Funksjon som kaller metoden i preload.js
    const handleQuitApp = () => {
        window.api.quitApp();
    };

    return (
        <div className="app-container">
            <button onClick={handleQuitApp} className="quit-button">
                Avslutt program
            </button>

            <nav className="main-nav">
                <Link to="/">Hjem</Link>
                <Link to="/administrasjon">Elevadministrasjon</Link>
            </nav>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/administrasjon" element={<AdminPage />} />
                    <Route path="/elev/:id" element={<ElevvisningPage />} />
                    <Route path="/faggruppe/:faggruppe" element={<FaggruppeVisningPage />} />
                </Routes>
            </main>
            {appVersion && (
                <div className="version-badge" aria-label="Appversjon">
                    v{appVersion}
                </div>
            )}
        </div>
    );
}

export default App;