import React, { useState } from 'react';
import { Button } from '../../common';
import { useWorkplaces } from '../../../hooks/useWorkplaces';
import { WorkplaceFormData } from '../../../types';
import { WORKPLACE_COLORS } from '../../../constants/colors';
import { validateRequired, validateHourlyRate } from '../../../utils/validators';

interface WorkplaceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<WorkplaceFormData>;
}

export const WorkplaceForm: React.FC<WorkplaceFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<WorkplaceFormData>({
    name: initialData?.name || '',
    color: initialData?.color || WORKPLACE_COLORS[0],
    hourlyRate: initialData?.hourlyRate || 0,
    address: initialData?.address || '',
    contactInfo: initialData?.contactInfo || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { createWorkplace } = useWorkplaces();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameError = validateRequired(formData.name, 'Workplace name');
    if (nameError) newErrors.name = nameError;

    const rateError = validateHourlyRate(formData.hourlyRate);
    if (rateError) newErrors.hourlyRate = rateError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await createWorkplace(formData);
      onSuccess();
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create workplace' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="workplace-form">
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="name">Workplace Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="e.g., Campus Coffee Shop, Local Bookstore"
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>Color Theme</label>
        <div className="color-picker">
          {WORKPLACE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-option ${formData.color === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="hourlyRate">Hourly Rate ($)</label>
        <input
          type="number"
          id="hourlyRate"
          name="hourlyRate"
          value={formData.hourlyRate}
          onChange={handleChange}
          className={errors.hourlyRate ? 'error' : ''}
          min="0"
          step="0.01"
          placeholder="15.50"
        />
        {errors.hourlyRate && <span className="field-error">{errors.hourlyRate}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main Street, City, State"
        />
      </div>

      <div className="form-group">
        <label htmlFor="contactInfo">Contact Information</label>
        <input
          type="text"
          id="contactInfo"
          name="contactInfo"
          value={formData.contactInfo}
          onChange={handleChange}
          placeholder="Phone, email, or manager name"
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
          placeholder="Any additional notes about this workplace..."
        />
      </div>

      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          Create Workplace
        </Button>
      </div>
    </form>
  );
};
