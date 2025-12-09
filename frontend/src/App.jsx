// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage.jsx';
import ElevvisningPage from './pages/ElevvisningPage.jsx';
import FaggruppeVisningPage from './pages/FaggruppeVisningPage.jsx';
import './App.css';

function App() {
    // Funksjon som kaller den nye metoden i preload.js
    const handleQuitApp = () => {
        window.api.quitApp();
    };

    return (
        <div className="app-container">
            {/* NY KNAPP FOR Å LUKKE APPLIKASJONEN */}
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
        </div>
    );
}

export default App;