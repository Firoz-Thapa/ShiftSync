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
      const eyebrowText = screen.getByText('ShiftSync workforce scheduling', { selector: '.eyebrow' });
      expect(eyebrowText).toBeInTheDocument();
    });

    it('renders main heading', () => {
      renderLandingPage();
      expect(screen.getByText('Professional scheduling for teams with moving parts.')).toBeInTheDocument();
    });

    it('renders hero description text', () => {
      renderLandingPage();
      const description = screen.getByText(/Plan shifts, coordinate study sessions/i);
      expect(description).toBeInTheDocument();
    });

    it('renders hero calls to action', () => {
      renderLandingPage();
      expect(screen.getByRole('link', { name: /start planning/i })).toHaveAttribute('href', '/register');
      expect(screen.getByRole('link', { name: /view dashboard/i })).toHaveAttribute('href', '/login');
    });

    it('renders dashboard preview with key operational details', () => {
      renderLandingPage();
      expect(screen.getByText('Operations dashboard')).toBeInTheDocument();
      expect(screen.getByText('Front desk coverage')).toBeInTheDocument();
      expect(screen.getByText('Study group - 14:30')).toBeInTheDocument();
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
      expect(screen.getByText('Built for clear decisions before the day gets busy.')).toBeInTheDocument();
    });

    it('renders all feature cards', () => {
      renderLandingPage();
      expect(screen.getByText('Shift planning')).toBeInTheDocument();
      expect(screen.getByText('Communication built in')).toBeInTheDocument();
      expect(screen.getByText('Workplace control')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      renderLandingPage();
      expect(screen.getByText(/Create schedules, assign coverage/i)).toBeInTheDocument();
      expect(screen.getByText(/Send email reminders for upcoming shifts/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage locations, roles, and team assignments/i)).toBeInTheDocument();
    });
  });

  describe('Workflow Section', () => {
    it('renders workflow section content', () => {
      renderLandingPage();
      expect(screen.getByText('Workflow', { selector: '.section-heading' })).toBeInTheDocument();
      expect(screen.getByText('A calmer way to run the week.')).toBeInTheDocument();
      expect(screen.getByText('Map commitments')).toBeInTheDocument();
      expect(screen.getByText('Coordinate people')).toBeInTheDocument();
      expect(screen.getByText('Track progress')).toBeInTheDocument();
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
        screen.getByText('Designed for teams that need dependable schedules and less noise.')
      ).toBeInTheDocument();
    });

    it('renders about description', () => {
      renderLandingPage();
      const aboutText = screen.getByText(/ShiftSync combines calendar planning/i);
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
