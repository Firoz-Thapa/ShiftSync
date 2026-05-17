import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPageNavbar } from './Navbar';

describe('LandingPageNavbar Component', () => {
  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <LandingPageNavbar />
      </BrowserRouter>
    );
  };

  it('renders the ShiftSync brand/logo', () => {
    renderNavbar();
    expect(screen.getByText('ShiftSync')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderNavbar();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders Log In link', () => {
    renderNavbar();
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
  });

  it('renders Sign Up link', () => {
    renderNavbar();
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
  });

  it('has correct href for Features section link', () => {
    renderNavbar();
    const featuresLink = screen.getByText('Features');
    expect(featuresLink).toHaveAttribute('href', '#features');
  });

  it('has correct href for About section link', () => {
    renderNavbar();
    const aboutLink = screen.getByText('About');
    expect(aboutLink).toHaveAttribute('href', '#about');
  });

  it('has correct href for Workflow section link', () => {
    renderNavbar();
    const workflowLink = screen.getByText('Workflow');
    expect(workflowLink).toHaveAttribute('href', '#workflow');
  });

  it('Log In link navigates to /login', () => {
    renderNavbar();
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('Sign Up link navigates to /register', () => {
    renderNavbar();
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/register');
  });
});
