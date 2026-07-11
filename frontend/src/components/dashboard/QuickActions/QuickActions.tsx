import React, { useState } from 'react';
import { Card, Modal } from '../../common';
import { ShiftForm } from '../../forms/ShiftForm';
import { StudyForm } from '../../forms/StudyForm';
import { ClockInModal } from '../ClockInModal/ClockInModal';
import './QuickActions.css';

export const QuickActions: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'shift' | 'study' | 'clockin' | null>(null);

  const openShiftModal = () => setActiveModal('shift');
  const openStudyModal = () => setActiveModal('study');
  const openClockInModal = () => setActiveModal('clockin');
  const closeModal = () => setActiveModal(null);

  const actionItems = [
    {
      id: 'shift',
      title: 'Add Shift',
      icon: 'S',
      tone: 'blue',
      action: openShiftModal,
      description: 'Schedule a new work shift',
    },
    {
      id: 'study',
      title: 'Schedule Study',
      icon: 'B',
      tone: 'violet',
      action: openStudyModal,
      description: 'Plan a study session',
    },
    {
      id: 'clock-in',
      title: 'Clock In',
      icon: 'C',
      tone: 'green',
      action: openClockInModal,
      description: 'Start tracking time',
    },
    {
      id: 'analytics',
      title: 'View Stats',
      icon: 'A',
      tone: 'amber',
      action: () => {
        window.location.href = '/analytics';
      },
      description: 'Check your progress',
    },
  ];

  return (
    <>
      <Card>
        <div className="quick-actions">
          <div className="quick-actions__header">
            <span className="quick-actions__eyebrow">Shortcuts</span>
            <h3 className="quick-actions__title">Quick actions</h3>
          </div>

          <div className="quick-actions__grid">
            {actionItems.map((item) => (
              <button
                key={item.id}
                className={`action-card action-card--${item.tone}`}
                onClick={item.action}
              >
                <span className="action-card__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="action-card__text">
                  <span className="action-card__title">{item.title}</span>
                  <span className="action-card__description">{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Modal
        isOpen={activeModal === 'shift'}
        onClose={closeModal}
        title="Add New Shift"
        size="medium"
      >
        <ShiftForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>

      <Modal
        isOpen={activeModal === 'study'}
        onClose={closeModal}
        title="Schedule Study Session"
        size="medium"
      >
        <StudyForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>

      <ClockInModal
        isOpen={activeModal === 'clockin'}
        onClose={closeModal}
        onSuccess={closeModal}
      />
    </>
  );
};
