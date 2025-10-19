// frontend/src/components/layout/Header/Header.tsx
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../common';
import { ThemeToggle } from '../../common/Theme Toggle/ThemeToggle';
import { LiveClock } from '../../common/LiveClock/LiveClock';
import { WeatherInfo } from '../../common/WeatherInfo/WeatherInfo';
import './Header.css';

interface HeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isMenuOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__left">
          {onMenuClick && (
            <button 
              className="header__menu-button"
              onClick={onMenuClick}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          )}
          
          <div className="header__logo">
            <span className="header__logo-icon">⚡</span>
            <div className="header__logo-text">
              <h1 className="header__title">ShiftSync</h1>
              <p className="header__subtitle">Your personal time wizard</p>
            </div>
          </div>
        </div>

        <div className="header__right">
          {user && (
            <div className="header__user">
              <LiveClock />
              <WeatherInfo />
              
              <div className="header__user-info">
                <span className="header__welcome">
                  Hey, {user.firstName}! 👋
                </span>
                <span className="header__user-email">{user.email}</span>
              </div>
              
              <div className="header__actions">
                <ThemeToggle size="small" />
                <Button variant="ghost" size="small" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};