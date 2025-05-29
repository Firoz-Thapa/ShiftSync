import React, { useState } from 'react';
import { Card, Button, Modal } from '../../common';
import { ShiftForm } from '../../forms/ShiftForm';
import { StudyForm } from '../../forms/StudyForm';
import './QuickActions.css';

export const QuickActions: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'shift' | 'study' | null>(null);

  const openShiftModal = () => setActiveModal('shift');
  const openStudyModal = () => setActiveModal('study');
  const closeModal = () => setActiveModal(null);

  return (
    <>
      <Card>
        <div className="quick-actions">
          <h3 className="quick-actions__title">⚡ Quick Actions</h3>
          
          <div className="quick-actions__grid">
            <Button
              variant="primary"
              size="small"
              fullWidth
              onClick={openShiftModal}
            >
              📋 Add Shift
            </Button>
            
            <Button
              variant="secondary"
              size="small"
              fullWidth
              onClick={openStudyModal}
            >
              📚 Schedule Study
            </Button>
            
            <Button
              variant="success"
              size="small"
              fullWidth
              onClick={() => {/* Clock in logic */}}
            >
              🕐 Clock In
            </Button>
            
            <Button
              variant="warning"
              size="small"
              fullWidth
              onClick={() => {/* View analytics */}}
            >
              📊 View Stats
            </Button>
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
