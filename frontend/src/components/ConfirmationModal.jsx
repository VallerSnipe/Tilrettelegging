// frontend/src/components/ConfirmationModal.jsx

import React from 'react';
import './Modal.css'; // Bruker den nye, felles CSS-filen

function ConfirmationModal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>
                <p>{children}</p>
                <div className="modal-actions">
                    <button className="modal-button cancel" onClick={onClose}>
                        Avbryt
                    </button>
                    <button className="modal-button confirm" onClick={onConfirm}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;