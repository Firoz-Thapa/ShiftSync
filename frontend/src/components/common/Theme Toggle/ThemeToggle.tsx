import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'dropdown';
}

export const ThemeToggle = ({ 
  showLabel = false, 
  size = 'medium',
  variant = 'button'
}: ThemeToggleProps) => {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (effectiveTheme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '💻';
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Theme';
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`theme-dropdown theme-dropdown--${size}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="theme-dropdown__select"
          aria-label="Select theme"
        >
          <option value="system">🖥️ System</option>
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
        </select>
      </div>
    );
  }

  return (
    <button
      className={`theme-toggle theme-toggle--${size}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current: ${getLabel()}`}
    >
      <span className="theme-toggle__icon">{getIcon()}</span>
      {showLabel && (
        <span className="theme-toggle__label">{getLabel()}</span>
      )}
    </button>
  );
};