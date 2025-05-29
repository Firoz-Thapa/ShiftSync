import React, { useState } from 'react';
import { Button } from '../../common';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { StudySessionFormData, SessionType, Priority } from '../../../types';
import { SESSION_TYPES, PRIORITIES } from '../../../constants';
import { validateRequired, validateDateRange } from '../../../utils/validators';

interface StudyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<StudySessionFormData>;
}

export const StudyForm: React.FC<StudyFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<StudySessionFormData>({
    title: initialData?.title || '',
    subject: initialData?.subject || '',
    startDatetime: initialData?.startDatetime || '',
    endDatetime: initialData?.endDatetime || '',
    location: initialData?.location || '',
    sessionType: initialData?.sessionType || 'other',
    priority: initialData?.priority || 'medium',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { createStudySession } = useStudySessions();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const titleError = validateRequired(formData.title, 'Title');
    if (titleError) newErrors.title = titleError;

    const startError = validateRequired(formData.startDatetime, 'Start time');
    if (startError) newErrors.startDatetime = startError;

    const endError = validateRequired(formData.endDatetime, 'End time');
    if (endError) newErrors.endDatetime = endError;

    if (formData.startDatetime && formData.endDatetime) {
      const dateRangeError = validateDateRange(formData.startDatetime, formData.endDatetime);
      if (dateRangeError) newErrors.endDatetime = dateRangeError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await createStudySession(formData);
      onSuccess();
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create study session' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="study-form">
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="title">Session Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={errors.title ? 'error' : ''}
          placeholder="e.g., Database Systems Lecture, Math Assignment"
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., Computer Science, Mathematics"
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Library, Room 205"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDatetime">Start Time *</label>
          <input
            type="datetime-local"
            id="startDatetime"
            name="startDatetime"
            value={formData.startDatetime}
            onChange={handleChange}
            className={errors.startDatetime ? 'error' : ''}
          />
          {errors.startDatetime && <span className="field-error">{errors.startDatetime}</span>}
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
          />
          {errors.endDatetime && <span className="field-error">{errors.endDatetime}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="sessionType">Session Type</label>
          <select
            id="sessionType"
            name="sessionType"
            value={formData.sessionType}
            onChange={handleChange}
          >
            {SESSION_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            {PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.icon} {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes about this study session..."
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Schedule Session
        </Button>
      </div>
    </form>
  );
};