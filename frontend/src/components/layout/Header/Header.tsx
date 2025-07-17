import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../common';
import { ThemeToggle } from '../../common/Theme Toggle/ThemeToggle';
import './Header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__left">
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