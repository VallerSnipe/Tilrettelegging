// frontend/src/components/ExportRoomModal.jsx

import React, { useState, useEffect } from 'react';
import './Modal.css';

function ExportRoomModal({ isOpen, onClose, onConfirm, initialRoom, format }) {
    const [roomInput, setRoomInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            const cleanInitial = initialRoom && initialRoom !== 'Ikke spesifisert' ? initialRoom : '';
            setRoomInput(cleanInitial);
        }
    }, [isOpen, initialRoom]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const formatLabel = format === 'pdf' ? 'PDF' : 'Excel';

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(roomInput.trim());
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Eksporter til {formatLabel}</h2>
                <form onSubmit={handleSubmit}>
                    <label className="modal-label" htmlFor="export-room-input">
                        Spesifiser rom (valgfritt):
                    </label>
                    <input
                        id="export-room-input"
                        type="text"
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        placeholder="F.eks. 204 eller Auditorium..."
                        autoFocus
                    />
                    <div className="modal-actions">
                        <button type="button" className="modal-button cancel" onClick={onClose}>
                            Avbryt
                        </button>
                        <button type="submit" className="modal-button confirm">
                            Eksporter {formatLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ExportRoomModal;
