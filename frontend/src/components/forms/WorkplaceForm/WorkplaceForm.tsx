import React, { useState } from 'react';
import { WorkplaceFormData } from '../../../types';
import { Button } from '../../common';
import { useWorkplaces } from '../../../hooks/useWorkplaces';

interface WorkplaceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<WorkplaceFormData>;
}

export const WorkplaceForm: React.FC<WorkplaceFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const { createWorkplace } = useWorkplaces();
  
  const [formData, setFormData] = useState<WorkplaceFormData>({
    name: initialData?.name || '',
    color: initialData?.color || '#3498db',
    hourlyRate: initialData?.hourlyRate || 0,
    address: initialData?.address || '',
    contactInfo: initialData?.contactInfo || '',
    notes: initialData?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createWorkplace(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create workplace');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Workplace Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Campus Coffee"
        />
      </div>

      <div>
        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
          Hourly Rate ($) *
        </label>
        <input
          type="number"
          id="hourlyRate"
          name="hourlyRate"
          value={formData.hourlyRate}
          onChange={handleChange}
          required
          step="0.01"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="15.50"
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <input
          type="color"
          id="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          className="w-20 h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="123 University Ave"
        />
      </div>

      <div>
        <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Info
        </label>
        <input
          type="text"
          id="contactInfo"
          name="contactInfo"
          value={formData.contactInfo}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="manager@workplace.com or (555) 123-4567"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Workplace'}
        </Button>
      </div>
    </form>
  );
};