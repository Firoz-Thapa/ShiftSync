import React, { useState } from 'react';
import { Button, Modal } from '../../common';
import { useWorkplaces } from '../../../hooks/useWorkplaces';
import { useShifts } from '../../../hooks/useShifts';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { ShiftFormData, StudySession } from '../../../types';
import { validateRequired, validateDateRange } from '../../../utils/validators';
import { findOverlappingTimeRanges, formatDate, formatTime } from '../../../utils/dateUtils';

interface ShiftFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ShiftFormData>;
  studySessions?: StudySession[];
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  studySessions = [],
}) => {
  const [formData, setFormData] = useState<ShiftFormData>({
    workplaceId: initialData?.workplaceId || 0,
    title: initialData?.title || '',
    startDatetime: initialData?.startDatetime || '',
    endDatetime: initialData?.endDatetime || '',
    breakDuration: initialData?.breakDuration || 0,
    notes: initialData?.notes || '',
    isConfirmed: initialData?.isConfirmed || false,
    reminderEnabled: initialData?.reminderEnabled || false,
    reminderMinutesBefore: initialData?.reminderMinutesBefore ?? 15,
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [overlappingStudySessions, setOverlappingStudySessions] = useState<StudySession[]>([]);
  const [showOverlapModal, setShowOverlapModal] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { workplaces } = useWorkplaces();
  const { createShift } = useShifts();
  const { studySessions: allStudySessions } = useStudySessions();
  const studySessionsToCheck = [
    ...studySessions,
    ...allStudySessions.filter(session => !studySessions.some(existing => existing.id === session.id)),
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    console.log(`Field changed: ${name} = ${value}, type: ${type}`);

    if (name === 'reminderEnabled' && checked && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? Number(value) : 
               name === 'workplaceId' ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (showOverlapModal || overlappingStudySessions.length > 0) {
      setShowOverlapModal(false);
      setOverlappingStudySessions([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    console.log('Validating form data:', formData);

    // Validate workplace
    if (!formData.workplaceId || formData.workplaceId === 0) {
      newErrors.workplaceId = 'Please select a workplace';
      console.error('Validation failed: No workplace selected');
    }

    // Validate title
    const titleError = validateRequired(formData.title, 'Shift title');
    if (titleError) {
      newErrors.title = titleError;
      console.error('Validation failed:', titleError);
    }

    // Validate start time
    const startError = validateRequired(formData.startDatetime, 'Start time');
    if (startError) {
      newErrors.startDatetime = startError;
      console.error('Validation failed:', startError);
    }

    // Validate end time
    const endError = validateRequired(formData.endDatetime, 'End time');
    if (endError) {
      newErrors.endDatetime = endError;
      console.error('Validation failed:', endError);
    }

    // Validate date range
    if (formData.startDatetime && formData.endDatetime) {
      const dateRangeError = validateDateRange(formData.startDatetime, formData.endDatetime);
      if (dateRangeError) {
        newErrors.endDatetime = dateRangeError;
        console.error('Validation failed:', dateRangeError);
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form validation result:', isValid ? 'PASSED' : 'FAILED', newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.error('❌ Form validation failed, aborting submission');
      return;
    }

    console.log('✅ Form validation passed, creating shift...');
    const overlaps = findOverlappingTimeRanges(formData, studySessionsToCheck);
    if (overlaps.length > 0) {
      setOverlappingStudySessions(overlaps);
      setShowOverlapModal(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const newShift = await createShift(formData);
      console.log('✅ Shift created successfully:', newShift);
      
      // Show success message in a modal dialog instead of a browser alert
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('❌ Failed to create shift:', error);
      setErrors({ general: error.message || 'Failed to create shift' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnyway = async () => {
    setShowOverlapModal(false);
    setIsLoading(true);

    try {
      const newShift = await createShift(formData);
      console.log('Shift created successfully after conflict override:', newShift);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Failed to create shift:', error);
      setErrors({ general: error.message || 'Failed to create shift' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have workplaces
  if (workplaces.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem' }}>⚠️ No Workplaces Found</h3>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          You need to add at least one workplace before creating a shift.
        </p>
        <Button variant="primary" onClick={onCancel}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="shift-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {errors.general && (
        <div style={{ 
          background: '#fed7d7', 
          color: '#c53030', 
          padding: '0.75rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          {errors.general}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="workplaceId">Workplace *</label>
        <select
          id="workplaceId"
          name="workplaceId"
          value={formData.workplaceId}
          onChange={handleChange}
          className={errors.workplaceId ? 'error' : ''}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: `2px solid ${errors.workplaceId ? '#e53e3e' : '#e2e8f0'}`,
            borderRadius: '8px',
            fontSize: '1rem',
            background: 'white'
          }}
        >
          <option value={0}>Select a workplace</option>
          {workplaces.map(workplace => (
            <option key={workplace.id} value={workplace.id}>
              {workplace.name}
            </option>
          ))}
        </select>
        {errors.workplaceId && (
          <span style={{ color: '#e53e3e', fontSize: '0.875rem' }}>
            {errors.workplaceId}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="title">Shift Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={errors.title ? 'error' : ''}
          placeholder="e.g., Morning Shift, Weekend Coverage"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: `2px solid ${errors.title ? '#e53e3e' : '#e2e8f0'}`,
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
        {errors.title && (
          <span style={{ color: '#e53e3e', fontSize: '0.875rem' }}>
            {errors.title}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="startDatetime">Start Time *</label>
          <input
            type="datetime-local"
            id="startDatetime"
            name="startDatetime"
            value={formData.startDatetime}
            onChange={handleChange}
            className={errors.startDatetime ? 'error' : ''}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${errors.startDatetime ? '#e53e3e' : '#e2e8f0'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          {errors.startDatetime && (
            <span style={{ color: '#e53e3e', fontSize: '0.875rem' }}>
              {errors.startDatetime}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="endDatetime">End Time *</label>
          <input
            type="datetime-local"
            id="endDatetime"
            name="endDatetime"
            value={formData.endDatetime}
            onChange={handleChange}
            className={errors.endDatetime ? 'error' : ''}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `2px solid ${errors.endDatetime ? '#e53e3e' : '#e2e8f0'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          {errors.endDatetime && (
            <span style={{ color: '#e53e3e', fontSize: '0.875rem' }}>
              {errors.endDatetime}
            </span>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="breakDuration">Break Duration (minutes)</label>
        <input
          type="number"
          id="breakDuration"
          name="breakDuration"
          value={formData.breakDuration}
          onChange={handleChange}
          min="0"
          max="480"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes about this shift..."
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="reminderEnabled"
            checked={formData.reminderEnabled || false}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span>Remind me before this shift</span>
        </label>
      </div>

      {formData.reminderEnabled && (
        <div className="form-group">
          <label htmlFor="reminderMinutesBefore">Reminder Time</label>
          <select
            id="reminderMinutesBefore"
            name="reminderMinutesBefore"
            value={formData.reminderMinutesBefore ?? 15}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1rem',
              background: 'white'
            }}
          >
            <option value={15}>15 minutes before</option>
            <option value={30}>30 minutes before</option>
            <option value={60}>1 hour before</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="isConfirmed"
            checked={formData.isConfirmed}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span>Mark as confirmed</span>
        </label>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        justifyContent: 'flex-end',
        paddingTop: '1rem',
        borderTop: '1px solid #e2e8f0'
      }}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Shift'}
        </Button>
      </div>
    </form>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onSuccess();
        }}
        title="✅ Shift created successfully!"
        size="small"
        actions={
          <Button variant="primary" onClick={() => {
            setShowSuccessModal(false);
            onSuccess();
          }}>
            OK
          </Button>
        }
      >
        <p>Your shift has been added to your schedule.</p>
      </Modal>

      <Modal
        isOpen={showOverlapModal}
        onClose={() => setShowOverlapModal(false)}
        title="Schedule conflict"
        size="small"
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowOverlapModal(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleSaveAnyway} loading={isLoading}>
              Save Anyway
            </Button>
          </>
        }
      >
        <p>This shift overlaps with {overlappingStudySessions.length === 1 ? 'a study session' : 'study sessions'}:</p>
        <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem' }}>
          {overlappingStudySessions.map(session => (
            <li key={session.id} style={{ marginBottom: '0.5rem' }}>
              <strong>{session.title}</strong> on {formatDate(session.startDatetime)} from {formatTime(session.startDatetime)} to {formatTime(session.endDatetime)}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
};
