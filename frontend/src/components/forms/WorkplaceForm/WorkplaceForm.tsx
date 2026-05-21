import React, { useState } from 'react';
import { PayType, RecurrencePattern } from '../../../types';

interface WorkplaceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const WorkplaceForm: React.FC<WorkplaceFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    payType: 'hourly' as PayType,
    hourlyRate: '',
    monthlySalary: '',
    color: '#667eea',
    address: '',
    contactInfo: '',
    notes: '',
    isRecurring: false,
    recurrencePattern: 'weekly' as RecurrencePattern,
    recurrenceEndDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedColors = [
    { color: '#667eea', name: 'Purple' },
    { color: '#3498db', name: 'Blue' },
    { color: '#2ecc71', name: 'Green' },
    { color: '#e74c3c', name: 'Red' },
    { color: '#f39c12', name: 'Orange' },
    { color: '#9b59b6', name: 'Violet' },
    { color: '#1abc9c', name: 'Turquoise' },
    { color: '#e91e63', name: 'Pink' },
    { color: '#ff5722', name: 'Deep Orange' },
    { color: '#00bcd4', name: 'Cyan' },
    { color: '#8bc34a', name: 'Light Green' },
    { color: '#ff9800', name: 'Amber' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Workplace name is required';
    }
    
    const payAmount = formData.payType === 'hourly' ? formData.hourlyRate : formData.monthlySalary;
    const payField = formData.payType === 'hourly' ? 'hourlyRate' : 'monthlySalary';
    const payLabel = formData.payType === 'hourly' ? 'hourly rate' : 'monthly salary';

    if (!payAmount) {
      newErrors[payField] = `${payLabel.charAt(0).toUpperCase() + payLabel.slice(1)} is required`;
    } else if (isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      newErrors[payField] = `Please enter a valid ${payLabel}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Save to localStorage
      const workplaces = JSON.parse(localStorage.getItem('shiftsync_workplaces') || '[]');
      const newWorkplace = {
        id: Date.now().toString(),
        ...formData,
        hourlyRate: formData.payType === 'hourly' ? parseFloat(formData.hourlyRate) : 0,
        monthlySalary: formData.payType === 'monthly' ? parseFloat(formData.monthlySalary) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      workplaces.push(newWorkplace);
      localStorage.setItem('shiftsync_workplaces', JSON.stringify(workplaces));
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error('Error saving workplace:', error);
      setErrors({ general: 'Failed to save workplace. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      payType: 'hourly',
      hourlyRate: '',
      monthlySalary: '',
      color: '#667eea',
      address: '',
      contactInfo: '',
      notes: '',
      isRecurring: false,
      recurrencePattern: 'weekly',
      recurrenceEndDate: ''
    });
    setErrors({});
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ 
        width: '100%',
        background: 'white',
        overflow: 'hidden'
      }}>
        {/* Header - Removed since Modal already has title */}

        {/* Form */}
        <div style={{ padding: '1.5rem 0' }}>
          {errors.general && (
            <div style={{ 
              background: '#fed7d7', 
              color: '#c53030', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              {errors.general}
            </div>
          )}
          {/* Workplace Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="name"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: '0.95rem'
              }}
            >
              <span>🏪</span> Workplace Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Campus Coffee Shop"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: errors.name ? '2px solid #e74c3c' : '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.name ? '#e74c3c' : '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.name && (
              <p style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.375rem', marginBottom: 0 }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Pay Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: '0.95rem'
              }}
            >
              <span>€</span> Pay Type *
            </label>
            <div
              role="radiogroup"
              aria-label="Pay type"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                padding: '0.25rem',
                background: '#f7fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px'
              }}
            >
              {[
                { value: 'hourly' as PayType, label: 'Hourly rate' },
                { value: 'monthly' as PayType, label: 'Monthly salary' }
              ].map((option) => {
                const isSelected = formData.payType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, payType: option.value }));
                      setErrors(prev => ({ ...prev, hourlyRate: '', monthlySalary: '' }));
                    }}
                    style={{
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '9px',
                      background: isSelected ? '#667eea' : 'transparent',
                      color: isSelected ? 'white' : '#4a5568',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay Amount */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor={formData.payType === 'hourly' ? 'hourlyRate' : 'monthlySalary'}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: '0.95rem'
              }}
            >
              <span>💰</span> {formData.payType === 'hourly' ? 'Hourly Rate' : 'Monthly Salary'} *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#718096',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                €
              </span>
              <input
                type="number"
                id={formData.payType === 'hourly' ? 'hourlyRate' : 'monthlySalary'}
                name={formData.payType === 'hourly' ? 'hourlyRate' : 'monthlySalary'}
                value={formData.payType === 'hourly' ? formData.hourlyRate : formData.monthlySalary}
                onChange={handleChange}
                placeholder={formData.payType === 'hourly' ? '15.00' : '2500.00'}
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2.25rem',
                  border: (formData.payType === 'hourly' ? errors.hourlyRate : errors.monthlySalary) ? '2px solid #e74c3c' : '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  if (!(formData.payType === 'hourly' ? errors.hourlyRate : errors.monthlySalary)) {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = (formData.payType === 'hourly' ? errors.hourlyRate : errors.monthlySalary) ? '#e74c3c' : '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            {(formData.payType === 'hourly' ? errors.hourlyRate : errors.monthlySalary) && (
              <p style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.375rem', marginBottom: 0 }}>
                {formData.payType === 'hourly' ? errors.hourlyRate : errors.monthlySalary}
              </p>
            )}
          </div>

          {/* Color Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '0.75rem',
                fontSize: '0.95rem'
              }}
            >
              <span>🎨</span> Color Tag
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(6, 1fr)', 
              gap: '0.75rem',
              padding: '1rem',
              background: '#f7fafc',
              borderRadius: '12px',
              border: '2px solid #e2e8f0'
            }}>
              {predefinedColors.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  onClick={() => handleColorSelect(item.color)}
                  title={item.name}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    border: formData.color === item.color ? '3px solid #2d3748' : '2px solid #e2e8f0',
                    background: item.color,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: formData.color === item.color ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
                    transform: formData.color === item.color ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseOver={(e) => {
                    if (formData.color !== item.color) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (formData.color !== item.color) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  {formData.color === item.color && (
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: '1.25rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="address"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: '0.95rem'
              }}
            >
              <span>📍</span> Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 University Ave"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Contact Info */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="contactInfo"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: '0.95rem'
              }}
            >
              <span>📞</span> Contact Info
            </label>
            <input
              type="text"
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="manager@workplace.com or (555) 123-4567"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <label 
              htmlFor="notes"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600', 
                color: '#2d3748',
                marginBottom: '0.5rem',
                fontSize: '0.95rem'
              }}
            >
              <span>📝</span> Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Recurring Workplace Section */}
          <div style={{ 
            marginBottom: '2rem',
            padding: '1rem',
            background: '#f0f4ff',
            borderRadius: '12px',
            border: '2px solid #e6efff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <label
                htmlFor="isRecurring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#2d3748',
                  margin: 0
                }}
              >
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleChange}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#667eea'
                  }}
                />
                <span>🔄 Recurring Workplace (e.g., daily/weekly shift)</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label
                    htmlFor="recurrencePattern"
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#2d3748',
                      marginBottom: '0.5rem',
                      fontSize: '0.95rem'
                    }}
                  >
                    Recurrence Pattern
                  </label>
                  <select
                    id="recurrencePattern"
                    name="recurrencePattern"
                    value={formData.recurrencePattern}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      outline: 'none',
                      background: 'white'
                    }}
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekly">Every Week</option>
                    <option value="monthly">Every Month</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="recurrenceEndDate"
                    style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#2d3748',
                      marginBottom: '0.5rem',
                      fontSize: '0.95rem'
                    }}
                  >
                    Recurrence End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#718096',
                    marginTop: '0.25rem',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Leave empty for indefinite recurrence
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '2px solid #f7fafc'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '0.875rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                background: 'white',
                color: '#4a5568',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#f7fafc';
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '0.875rem',
                border: 'none',
                borderRadius: '12px',
                background: isSubmitting ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Saving...
                </>
              ) : (
                <>
                
                  Save Workplace
                </>
              )}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </form>
  );
};

export default WorkplaceForm;
