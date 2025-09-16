// frontend/src/components/CommentModal.jsx

import React, { useState, useEffect } from 'react';
import './Modal.css'; // Bruker den nye, felles CSS-filen

function CommentModal({ isOpen, onClose, onSave, initialComment }) {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            setComment(initialComment || '');
        }
    }, [isOpen, initialComment]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(comment);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Rediger kommentar</h2>
                <textarea
                    className="comment-textarea"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="6"
                    autoFocus
                />
                <div className="modal-actions">
                    <button className="modal-button cancel" onClick={onClose}>
                        Avbryt
                    </button>
                    <button className="modal-button confirm" onClick={handleSave}>
                        Lagre
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CommentModal;