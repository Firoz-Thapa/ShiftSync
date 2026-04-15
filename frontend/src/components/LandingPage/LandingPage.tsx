import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { LandingPageNavbar } from './Navbar';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <LandingPageNavbar />

        <section className="hero" id="home">
          <div className="hero-copy">
            <span className="eyebrow">ShiftSync</span>
            <h1>Schedule smarter, work together better.</h1>
            <p>
              ShiftSync helps teams, managers, and students synchronize schedules,
              coordinate study sessions, and stay on track with effortless shift planning.
            </p>
          </div>

          <div className="hero-visual">
            <div className="feature-pill">Live shifts</div>
            <div className="feature-pill">Team email reminders</div>
            <div className="hero-card">
              <h2>One place for every schedule.</h2>
              <p>
                Track workplace shifts, study sessions, and email communications with a
                single dashboard built for high-performing teams.
              </p>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-header">
            <p className="section-heading">Features</p>
            <h2 className="section-title">Everything your team needs to stay aligned.</h2>
          </div>

          <div className="feature-list">
            <div className="feature-card-small">
              <h3>Shift planning</h3>
              <p>Build schedules quickly, assign shifts, and view availability in one place.</p>
            </div>
            <div className="feature-card-small">
              <h3>Automated reminders</h3>
              <p>Send email reminders for upcoming shifts and study sessions so nothing slips through.</p>
            </div>
            <div className="feature-card-small">
              <h3>Workplace management</h3>
              <p>Manage locations, roles, and team assignments with flexible workplace controls.</p>
            </div>
          </div>
        </section>

        <section className="about" id="about">
          <div className="section-header">
            <p className="section-heading">About</p>
            <h2 className="section-title">Designed for teams that need clear schedules and better collaboration.</h2>
          </div>
          <p>
            ShiftSync removes the stress from scheduling by combining calendar, email,
            workplace, and study session tools in a single experience. Log in to explore
            your dashboard, customize schedules, and coordinate with confidence.
          </p>
        </section>

        <footer className="landing-footer">
          <p>
            Ready to simplify scheduling? <Link to={ROUTES.LOGIN}>Log in now</Link> and start
            syncing your team today.
          </p>
        </footer>
      </div>
    </div>
  );
}