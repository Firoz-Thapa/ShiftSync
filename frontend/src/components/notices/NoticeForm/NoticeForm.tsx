import React, { useState } from 'react';
import { CreateNoticeData, Notice } from '../../../types';
import './NoticeForm.css';

interface NoticeFormProps {
  workplaceId: number;
  notice?: Notice;
  onSuccess: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  onSubmit: (data: CreateNoticeData) => Promise<void>;
}

const CATEGORIES = ['general', 'announcement', 'maintenance', 'event', 'urgent'];
const TAG_SUGGESTIONS = ['important', 'urgent', 'meeting', 'closed', 'holiday', 'update'];

export const NoticeForm: React.FC<NoticeFormProps> = ({
  workplaceId,
  notice,
  onSuccess,
  onCancel,
  isSubmitting = false,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CreateNoticeData>({
    title: notice?.title || '',
    content: notice?.content || '',
    category: notice?.category || 'general',
    tags: notice?.tags || [],
    isPinned: notice?.isPinned || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

  const addTag = (tag: string) => {
    const cleanTag = tag.toLowerCase().trim();
    if (cleanTag && !formData.tags.includes(cleanTag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > 5000) {
      newErrors.content = 'Content cannot exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onSuccess();
    } catch (error) {
      console.error('Error submitting notice:', error);
      setErrors({ general: 'Failed to save notice. Please try again.' });
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      tags: [],
      isPinned: false
    });
    setErrors({});
    setTagInput('');
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="notice-form">
      {errors.general && (
        <div className="notice-form__error-alert">
          {errors.general}
        </div>
      )}

      <div className="notice-form__group">
        <label htmlFor="title" className="notice-form__label">
          Title *
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter notice title"
          className={`notice-form__input ${errors.title ? 'notice-form__input--error' : ''}`}
          disabled={isSubmitting}
        />
        {errors.title && (
          <span className="notice-form__error-text">{errors.title}</span>
        )}
        <span className="notice-form__char-count">
          {formData.title.length}/200
        </span>
      </div>

      <div className="notice-form__group">
        <label htmlFor="content" className="notice-form__label">
          Content *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Enter notice content"
          rows={8}
          className={`notice-form__textarea ${errors.content ? 'notice-form__textarea--error' : ''}`}
          disabled={isSubmitting}
        />
        {errors.content && (
          <span className="notice-form__error-text">{errors.content}</span>
        )}
        <span className="notice-form__char-count">
          {formData.content.length}/5000
        </span>
      </div>

      <div className="notice-form__row">
        <div className="notice-form__group">
          <label htmlFor="category" className="notice-form__label">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="notice-form__select"
            disabled={isSubmitting}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="notice-form__group">
          <label htmlFor="isPinned" className="notice-form__checkbox-label">
            <input
              id="isPinned"
              type="checkbox"
              name="isPinned"
              checked={formData.isPinned}
              onChange={handleChange}
              className="notice-form__checkbox"
              disabled={isSubmitting}
            />
            <span>Pin this notice</span>
          </label>
        </div>
      </div>

      <div className="notice-form__group">
        <label htmlFor="tags" className="notice-form__label">
          Tags (max 10)
        </label>
        <div className="notice-form__tags-input">
          {formData.tags.map((tag, index) => (
            <span key={index} className="notice-form__tag">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="notice-form__tag-remove"
                disabled={isSubmitting}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder={formData.tags.length < 10 ? 'Add tags (press Enter)' : 'Max tags reached'}
            className="notice-form__tags-input-field"
            disabled={isSubmitting || formData.tags.length >= 10}
          />
        </div>
        <div className="notice-form__tag-suggestions">
          {TAG_SUGGESTIONS
            .filter(tag => !formData.tags.includes(tag))
            .slice(0, 3)
            .map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="notice-form__tag-suggestion"
                disabled={isSubmitting}
              >
                + {tag}
              </button>
            ))}
        </div>
      </div>

      <div className="notice-form__actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="notice-form__submit-btn"
        >
          {isSubmitting ? 'Saving...' : 'Save Notice'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="notice-form__cancel-btn"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
