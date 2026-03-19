import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import './NotepadModal.css';

interface Note {
  id: string;
  title: string;
  text: string;
  timestamp: string;
}

interface NotepadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'shiftsync_quick_notes';

export const NotepadModal: React.FC<NotepadModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'write' | 'list'>('write');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
      setView('write');
      resetForm();
    }
  }, [isOpen]);

  const loadNotes = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setNotes(stored ? JSON.parse(stored) : []);
  };

  const resetForm = () => {
    setTitle('');
    setText('');
    setSelectedNote(null);
  };

  const handleSave = () => {
    if (!text.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Note',
      text: text.trim(),
      timestamp: new Date().toLocaleString(),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: Note[] = stored ? JSON.parse(stored) : [];
    const updated = [note, ...existing].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNotes(updated);
    resetForm();
    setView('list');
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNotes(updated);
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  const handleClose = () => {
    resetForm();
    setView('write');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📝 Notepad"
      size="medium"
      showCloseButton={true}
      closeOnOverlayClick={false}
      actions={
        view === 'write' ? (
          <>
            <Button variant="secondary" onClick={() => { setView('list'); resetForm(); }}>
              My Notes {notes.length > 0 && `(${notes.length})`}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!text.trim()}>
              Save Note
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => { setView('write'); resetForm(); }}>
            + New Note
          </Button>
        )
      }
    >
      {view === 'write' ? (
        <div className="notepad-write-view">
          <input
            className="notepad-title-input"
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
          />
          <textarea
            className="notepad-textarea"
            placeholder="Write your note here..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={1000}
            rows={9}
            autoFocus
          />
          <div className={`notepad-char-count ${text.length > 900 ? 'notepad-char-count--warning' : ''}`}>
            {text.length} / 1000
          </div>
        </div>
      ) : (
        <div className="notepad-list-view">
          {notes.length === 0 ? (
            <div className="notepad-empty">No saved notes yet.</div>
          ) : selectedNote ? (
            <div className="notepad-detail">
              <button className="notepad-back-btn" onClick={() => setSelectedNote(null)}>← Back</button>
              <h3 className="notepad-detail-title">{selectedNote.title}</h3>
              <p className="notepad-detail-timestamp">{selectedNote.timestamp}</p>
              <p className="notepad-detail-text">{selectedNote.text}</p>
              <Button variant="secondary" onClick={() => handleDelete(selectedNote.id)}>
                🗑 Delete
              </Button>
            </div>
          ) : (
            <ul className="notepad-list">
              {notes.map(note => (
                <li key={note.id} className="notepad-list-item" onClick={() => setSelectedNote(note)}>
                  <div className="notepad-list-item-header">
                    <span className="notepad-list-item-title">{note.title}</span>
                    <button
                      className="notepad-list-item-delete"
                      onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                      title="Delete"
                    >✕</button>
                  </div>
                  <span className="notepad-list-item-preview">{note.text.slice(0, 60)}{note.text.length > 60 ? '…' : ''}</span>
                  <span className="notepad-list-item-time">{note.timestamp}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
};