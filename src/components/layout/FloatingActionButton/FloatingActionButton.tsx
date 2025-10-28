import React, { useState } from 'react';
import { Modal } from '../../common/Modal/Modal';
import { ShiftForm } from '../../forms/ShiftForm';
import { StudyForm } from '../../forms/StudyForm';
import './FloatingActionButton.css';

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'shift' | 'study' | 'break' | 'note' | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  const quickActions = [
    { id: 'shift', icon: '💼', label: 'Quick Shift', color: '#3498db' },
    { id: 'study', icon: '📚', label: 'Study Session', color: '#9b59b6' },
    { id: 'break', icon: '☕', label: 'Break Timer', color: '#2ecc71' },
    { id: 'note', icon: '📝', label: 'Quick Note', color: '#f39c12' }
  ];

  const handleActionClick = (actionId: string) => {
    if (actionId === 'shift' || actionId === 'study') {
      setActiveModal(actionId as 'shift' | 'study');
    } else if (actionId === 'break') {
      if ('Notification' in window) {
        Notification.requestPermission().then(() => {
          new Notification('Break Timer Started! ☕', {
            body: '15 minutes of well-deserved rest time!',
            icon: '☕'
          });
        });
      }
      alert('Break timer started! ☕ Enjoy your 15-minute break!');
    } else if (actionId === 'note') {
      const note = prompt('📝 Quick note:');
      if (note && note.trim()) {
        const timestamp = new Date().toLocaleString();
        const existingNotes = localStorage.getItem('shiftsync_quick_notes');
        const notes = existingNotes ? JSON.parse(existingNotes) : [];
        notes.unshift({ text: note.trim(), timestamp });
        localStorage.setItem('shiftsync_quick_notes', JSON.stringify(notes.slice(0, 10))); // Keep last 10 notes
        alert('Note saved! 📝');
      }
    }
    setIsOpen(false);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      <div className="floating-action-container">
        {isOpen && (
          <div className="quick-actions-menu">
            {quickActions.map((action, index) => (
              <div
                key={action.id}
                className="quick-action-item"
                style={{ 
                  animationDelay: `${index * 100}ms`
                }}
              >
                <span className="quick-action-label">
                  {action.label}
                </span>
                <button
                  className="quick-action-btn"
                  style={{ backgroundColor: action.color }}
                  onClick={() => handleActionClick(action.id)}
                  title={action.label}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={toggleMenu}
          className={`main-fab ${isOpen ? 'main-fab--open' : ''}`}
          title={isOpen ? 'Close quick actions' : 'Quick actions'}
        >
          {isOpen ? '✕' : '⚡'}
        </button>
      </div>

      <Modal
        isOpen={activeModal === 'shift'}
        onClose={closeModal}
        title="⚡ Quick Shift"
        size="medium"
      >
        <ShiftForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>

      <Modal
        isOpen={activeModal === 'study'}
        onClose={closeModal}
        title="⚡ Quick Study Session"
        size="medium"
      >
        <StudyForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </>
  );
};