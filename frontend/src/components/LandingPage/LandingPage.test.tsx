import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

describe('LandingPage Component', () => {
  const renderLandingPage = () => {
    return render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  };

  describe('Hero Section', () => {
    it('renders ShiftSync brand name in eyebrow', () => {
      renderLandingPage();
      const eyebrowText = screen.getByText('ShiftSync', { selector: '.eyebrow' });
      expect(eyebrowText).toBeInTheDocument();
    });

    it('renders main heading', () => {
      renderLandingPage();
      expect(screen.getByText('Schedule smarter, work together better.')).toBeInTheDocument();
    });

    it('renders hero description text', () => {
      renderLandingPage();
      const description = screen.getByText(/ShiftSync helps teams, managers, and students synchronize schedules/i);
      expect(description).toBeInTheDocument();
    });

    it('renders feature pills', () => {
      renderLandingPage();
      expect(screen.getByText('Live shifts')).toBeInTheDocument();
      expect(screen.getByText('Team email reminders')).toBeInTheDocument();
    });

    it('renders hero card with key value proposition', () => {
      renderLandingPage();
      expect(screen.getByText('One place for every schedule.')).toBeInTheDocument();
      const heroCardText = screen.getByText(/Track workplace shifts, study sessions, and email communications/i);
      expect(heroCardText).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('renders features section heading', () => {
      renderLandingPage();
      const featuresHeading = screen.getByText('Features', { selector: '.section-heading' });
      expect(featuresHeading).toBeInTheDocument();
    });

    it('renders features section title', () => {
      renderLandingPage();
      expect(screen.getByText('Everything your team needs to stay aligned.')).toBeInTheDocument();
    });

    it('renders all feature cards', () => {
      renderLandingPage();
      expect(screen.getByText('Shift planning')).toBeInTheDocument();
      expect(screen.getByText('Automated reminders')).toBeInTheDocument();
      expect(screen.getByText('Workplace management')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      renderLandingPage();
      expect(screen.getByText(/Build schedules quickly, assign shifts/i)).toBeInTheDocument();
      expect(screen.getByText(/Send email reminders for upcoming shifts/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage locations, roles, and team assignments/i)).toBeInTheDocument();
    });
  });

  describe('About Section', () => {
    it('renders about section heading', () => {
      renderLandingPage();
      const aboutHeading = screen.getByText('About', { selector: '.section-heading' });
      expect(aboutHeading).toBeInTheDocument();
    });

    it('renders about section title', () => {
      renderLandingPage();
      expect(
        screen.getByText('Designed for teams that need clear schedules and better collaboration.')
      ).toBeInTheDocument();
    });

    it('renders about description', () => {
      renderLandingPage();
      const aboutText = screen.getByText(/ShiftSync removes the stress from scheduling/i);
      expect(aboutText).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('renders footer with call-to-action', () => {
      renderLandingPage();
      expect(screen.getByText(/Ready to simplify scheduling/i)).toBeInTheDocument();
    });

    it('renders Log in link in footer', () => {
      renderLandingPage();
      const loginLinks = screen.getAllByRole('link', { name: /log in/i });
      expect(loginLinks.length).toBeGreaterThan(0);
    });

    it('Log in link in footer navigates to /login', () => {
      renderLandingPage();
      const loginLinks = screen.getAllByRole('link', { name: /log in/i });
      const footerLoginLink = loginLinks[loginLinks.length - 1]; // Get the footer one
      expect(footerLoginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Navbar Integration', () => {
    it('renders navbar as part of landing page', () => {
      renderLandingPage();
      const navLinks = screen.getAllByRole('link', { name: /log in/i });
      expect(navLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('renders all sections with proper heading hierarchy', () => {
      renderLandingPage();
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
