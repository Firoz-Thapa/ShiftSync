import React, { useState } from 'react';
import { Button } from '../../common';
import { useWorkplaces } from '../../../hooks/useWorkplaces';
import { useShifts } from '../../../hooks/useShifts';
import { ShiftFormData } from '../../../types';
import { validateRequired, validateDateRange } from '../../../utils/validators';

interface ShiftFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ShiftFormData>;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<ShiftFormData>({
    workplaceId: initialData?.workplaceId || 0,
    title: initialData?.title || '',
    startDatetime: initialData?.startDatetime || '',
    endDatetime: initialData?.endDatetime || '',
    breakDuration: initialData?.breakDuration || 0,
    notes: initialData?.notes || '',
    isConfirmed: initialData?.isConfirmed || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { workplaces } = useWorkplaces();
  const { createShift } = useShifts();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const workplaceError = validateRequired(formData.workplaceId, 'Workplace');
    if (workplaceError) newErrors.workplaceId = workplaceError;

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
      await createShift(formData);
      onSuccess();
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create shift' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shift-form">
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="workplaceId">Workplace *</label>
        <select
          id="workplaceId"
          name="workplaceId"
          value={formData.workplaceId}
          onChange={handleChange}
          className={errors.workplaceId ? 'error' : ''}
        >
          <option value={0}>Select a workplace</option>
          {workplaces.map(workplace => (
            <option key={workplace.id} value={workplace.id}>
              {workplace.name}
            </option>
          ))}
        </select>
        {errors.workplaceId && <span className="field-error">{errors.workplaceId}</span>}
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
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
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
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isConfirmed"
            checked={formData.isConfirmed}
            onChange={handleChange}
          />
          <span>Mark as confirmed</span>
        </label>
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Create Shift
        </Button>
      </div>
    </form>
  );
};