import React, { useState } from 'react';
import { Card, Modal } from '../../common';
import { ShiftForm } from '../../forms/ShiftForm';
import { StudyForm } from '../../forms/StudyForm';
import './QuickActions.css';

export const QuickActions: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'shift' | 'study' | null>(null);

  const openShiftModal = () => setActiveModal('shift');
  const openStudyModal = () => setActiveModal('study');
  const closeModal = () => setActiveModal(null);

  const actionItems = [
    {
      id: 'shift',
      title: 'Add Shift',
      icon: '💼',
      gradient: 'from-blue-500 to-blue-600',
      action: openShiftModal,
      description: 'Schedule a new work shift'
    },
    {
      id: 'study',
      title: 'Schedule Study',
      icon: '📚',
      gradient: 'from-purple-500 to-purple-600',
      action: openStudyModal,
      description: 'Plan a study session'
    },
    {
      id: 'clock-in',
      title: 'Clock In',
      icon: '🕐',
      gradient: 'from-green-500 to-green-600',
      action: () => {/* Clock in logic */},
      description: 'Start tracking time'
    },
    {
      id: 'analytics',
      title: 'View Stats',
      icon: '📊',
      gradient: 'from-orange-500 to-orange-600',
      action: () => {/* View analytics */},
      description: 'Check your progress'
    }
  ];

  return (
    <>
      <Card className="ml-auto w-fit">

        <div className="quick-actions">
          <h3 className="quick-actions__title">⚡ Quick Actions</h3>
          
          <div className="quick-actions__grid">
            {actionItems.map((item) => (
              <button
                key={item.id}
                className={`action-card bg-gradient-to-r ${item.gradient} text-white hover:scale-105 transition-all duration-200 cursor-pointer border-none rounded-lg p-4 text-left`}
                onClick={item.action}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs opacity-90">{item.description}</div>
                  </div>
                </div>
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
    </>
  );
};
