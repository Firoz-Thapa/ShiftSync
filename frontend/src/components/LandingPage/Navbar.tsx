import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export const LandingPageNavbar = () => {
  return (
    <header className="landing-navbar">
      <div className="brand">
        <Link to={ROUTES.HOME}>ShiftSync</Link>
      </div>

      <nav className="landing-nav">
        <a href="#features">Features</a>
        <a href="#about">About</a>
      </nav>

      <div className="landing-actions">
        <Link className="nav-link" to={ROUTES.LOGIN}>
          Log In
        </Link>
        <Link className="nav-link" to={ROUTES.REGISTER}>
          Sign Up
        </Link>
      </div>
    </header>
  );
};