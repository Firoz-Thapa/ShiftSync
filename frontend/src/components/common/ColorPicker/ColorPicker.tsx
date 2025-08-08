import React, { useState, useEffect } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  allowCustom?: boolean;
  label?: string;
  columns?: number;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  allowCustom = false,
  label,
  columns = 5
}) => {
  const [customColor, setCustomColor] = useState(selectedColor);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showColorName, setShowColorName] = useState<string | null>(null);

  useEffect(() => {
    // Load recent colors from localStorage
    const saved = localStorage.getItem('shiftsync_recent_colors');
    if (saved) {
      setRecentColors(JSON.parse(saved));
    }
  }, []);

  const handleColorSelect = (color: string) => {
    onColorSelect(color);
    
    // Add to recent colors if it's a custom color
    if (!colors.includes(color) && allowCustom) {
      const newRecent = [color, ...recentColors.filter(c => c !== color)].slice(0, 5);
      setRecentColors(newRecent);
      localStorage.setItem('shiftsync_recent_colors', JSON.stringify(newRecent));
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    handleColorSelect(color);
  };

  const getColorName = (color: string): string => {
    const colorNames: { [key: string]: string } = {
      '#e74c3c': 'Red',
      '#3498db': 'Blue',
      '#2ecc71': 'Green',
      '#f39c12': 'Orange',
      '#9b59b6': 'Purple',
      '#1abc9c': 'Turquoise',
      '#e67e22': 'Carrot',
      '#34495e': 'Asphalt',
      '#f1c40f': 'Yellow',
      '#e91e63': 'Pink',
    };
    return colorNames[color] || color.toUpperCase();
  };

  const getContrastColor = (hexColor: string): string => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <div className="color-picker">
      {label && <label className="color-picker__label">{label}</label>}
      
      <div 
        className="color-picker__grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-picker__option ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            onMouseEnter={() => setShowColorName(color)}
            onMouseLeave={() => setShowColorName(null)}
            aria-label={`Select ${getColorName(color)}`}
            title={getColorName(color)}
          >
            {selectedColor === color && (
              <span 
                className="color-picker__check"
                style={{ color: getContrastColor(color) }}
              >
                ✓
              </span>
            )}
            {showColorName === color && (
              <span className="color-picker__tooltip">
                {getColorName(color)}
              </span>
            )}
          </button>
        ))}
      </div>

      {recentColors.length > 0 && allowCustom && (
        <div className="color-picker__recent">
          <span className="color-picker__recent-label">Recent:</span>
          <div className="color-picker__recent-colors">
            {recentColors.map((color, index) => (
              <button
                key={`recent-${index}`}
                type="button"
                className={`color-picker__option color-picker__option--small ${
                  selectedColor === color ? 'selected' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`Recent color ${color}`}
                title={color}
              >
                {selectedColor === color && (
                  <span 
                    className="color-picker__check"
                    style={{ color: getContrastColor(color) }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {allowCustom && (
        <div className="color-picker__custom">
          <label htmlFor="custom-color" className="color-picker__custom-label">
            Custom Color:
          </label>
          <div className="color-picker__custom-input-wrapper">
            <input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="color-picker__custom-input"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                  setCustomColor(value);
                  handleColorSelect(value);
                }
              }}
              placeholder="#000000"
              className="color-picker__custom-text"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      )}

      {selectedColor && (
        <div className="color-picker__preview">
          <span className="color-picker__preview-label">Selected:</span>
          <div className="color-picker__preview-color-wrapper">
            <div 
              className="color-picker__preview-color"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="color-picker__preview-text">
              {getColorName(selectedColor)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};