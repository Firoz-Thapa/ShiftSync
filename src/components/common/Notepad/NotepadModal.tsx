import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ header: [1, 2, 3, false] }],
    ['blockquote', 'code-block'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'header',
  'blockquote', 'code-block',
];

export const NotepadModal: React.FC<NotepadModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'write' | 'list'>('write');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    setEditingId(null);
  };

  const handleEdit = (note: Note) => {
    setTitle(note.title === 'Untitled Note' ? '' : note.title);
    setText(note.text);
    setEditingId(note.id);
    setSelectedNote(null);
    setView('write');
  };

  // Strip HTML tags to get plain text length
  const getPlainTextLength = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length ?? 0;
  };

  const isTextEmpty = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent ?? '').trim().length === 0;
  };

  const handleSave = () => {
    if (isTextEmpty(text)) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: Note[] = stored ? JSON.parse(stored) : [];
    let updated: Note[];

    if (editingId) {
      updated = existing.map(n =>
        n.id === editingId
          ? {
              ...n,
              title: title.trim() || 'Untitled Note',
              text,
              timestamp: new Date().toLocaleString() + ' (edited)',
            }
          : n
      );
    } else {
      const note: Note = {
        id: Date.now().toString(),
        title: title.trim() || 'Untitled Note',
        text,
        timestamp: new Date().toLocaleString(),
      };
      updated = [note, ...existing].slice(0, 20);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNotes(updated);
    setEditingId(null);
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

  const charCount = getPlainTextLength(text);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingId ? '📝 Edit Note' : '📝 Notepad'}
      size="medium"
      showCloseButton={true}
      closeOnOverlayClick={false}
      actions={
        view === 'write' ? (
          <>
            <Button
              variant="secondary"
              onClick={() => { setView('list'); resetForm(); }}
            >
              My Notes {notes.length > 0 && `(${notes.length})`}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isTextEmpty(text)}
            >
              {editingId ? 'Update Note' : 'Save Note'}
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
          <div className="notepad-quill-wrapper">
            <ReactQuill
              theme="snow"
              value={text}
              onChange={setText}
              modules={QUILL_MODULES}
              formats={QUILL_FORMATS}
              placeholder="Write your note here..."
            />
          </div>
          <div className={`notepad-char-count ${charCount > 900 ? 'notepad-char-count--warning' : ''}`}>
            {charCount} / 1000
          </div>
        </div>
      ) : (
        <div className="notepad-list-view">
          {notes.length === 0 ? (
            <div className="notepad-empty">No saved notes yet.</div>
          ) : selectedNote ? (
            <div className="notepad-detail">
              <button className="notepad-back-btn" onClick={() => setSelectedNote(null)}>
                ← Back
              </button>
              <h3 className="notepad-detail-title">{selectedNote.title}</h3>
              <p className="notepad-detail-timestamp">{selectedNote.timestamp}</p>
              {/* Render rich text safely */}
              <div
                className="notepad-detail-text ql-editor"
                dangerouslySetInnerHTML={{ __html: selectedNote.text }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => handleEdit(selectedNote)}>
                  ✏️ Edit
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(selectedNote.id)}>
                  🗑 Delete
                </Button>
              </div>
            </div>
          ) : (
            <ul className="notepad-list">
              {notes.map(note => (
                <li
                  key={note.id}
                  className="notepad-list-item"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="notepad-list-item-header">
                    <span className="notepad-list-item-title">{note.title}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="notepad-list-item-edit"
                        onClick={e => { e.stopPropagation(); handleEdit(note); }}
                        title="Edit"
                      >✏️</button>
                      <button
                        className="notepad-list-item-delete"
                        onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                        title="Delete"
                      >✕</button>
                    </div>
                  </div>
                  {/* Strip HTML for preview */}
                  <span className="notepad-list-item-preview">
                    {(() => {
                      const div = document.createElement('div');
                      div.innerHTML = note.text;
                      const plain = div.textContent ?? '';
                      return plain.slice(0, 60) + (plain.length > 60 ? '…' : '');
                    })()}
                  </span>
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