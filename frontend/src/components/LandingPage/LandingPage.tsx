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
            <span className="eyebrow">ShiftSync workforce scheduling</span>
            <h1>Professional scheduling for teams with moving parts.</h1>
            <p>
              Plan shifts, coordinate study sessions, and keep communication in sync
              from one focused workspace built for managers, students, and busy teams.
            </p>
            <div className="hero-actions">
              <Link className="cta-button primary" to={ROUTES.REGISTER}>
                Start planning
              </Link>
              <Link className="cta-button secondary" to={ROUTES.LOGIN}>
                View dashboard
              </Link>
            </div>
            <dl className="hero-stats" aria-label="ShiftSync highlights">
              <div>
                <dt>3</dt>
                <dd>core schedule views</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>reminders built in</dd>
              </div>
              <div>
                <dt>Live</dt>
                <dd>clock-in visibility</dd>
              </div>
            </dl>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview" aria-label="ShiftSync dashboard preview">
              <div className="preview-header">
                <div>
                  <span className="preview-kicker">Today</span>
                  <h2>Operations dashboard</h2>
                </div>
                <span className="preview-status">Synced</span>
              </div>
              <div className="preview-grid">
                <div className="preview-panel preview-panel--wide">
                  <span className="panel-label">Next shift</span>
                  <strong>Front desk coverage</strong>
                  <p>09:00 - 13:00 - Main campus</p>
                  <div className="progress-track">
                    <span style={{ width: '72%' }} />
                  </div>
                </div>
                <div className="preview-panel">
                  <span className="panel-label">Clocked in</span>
                  <strong>8</strong>
                  <p>active team members</p>
                </div>
                <div className="preview-panel">
                  <span className="panel-label">Reminders</span>
                  <strong>14</strong>
                  <p>sent this week</p>
                </div>
              </div>
              <div className="preview-schedule">
                <div>
                  <span className="schedule-dot schedule-dot--blue" />
                  <p>Study group - 14:30</p>
                </div>
                <div>
                  <span className="schedule-dot schedule-dot--green" />
                  <p>Evening shift - 17:00</p>
                </div>
                <div>
                  <span className="schedule-dot schedule-dot--orange" />
                  <p>Email summary - 18:15</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-header">
            <p className="section-heading">Features</p>
            <h2 className="section-title">Built for clear decisions before the day gets busy.</h2>
          </div>

          <div className="feature-list">
            <div className="feature-card-small">
              <h3>Shift planning</h3>
              <p>Create schedules, assign coverage, and review availability without switching tools.</p>
            </div>
            <div className="feature-card-small">
              <h3>Communication built in</h3>
              <p>Send email reminders for upcoming shifts and study sessions so handoffs stay visible.</p>
            </div>
            <div className="feature-card-small">
              <h3>Workplace control</h3>
              <p>Manage locations, roles, and team assignments with a structure that scales with you.</p>
            </div>
          </div>
        </section>

        <section className="workflow" id="workflow">
          <div className="section-header">
            <p className="section-heading">Workflow</p>
            <h2 className="section-title">A calmer way to run the week.</h2>
          </div>
          <div className="workflow-steps">
            <article>
              <span>01</span>
              <h3>Map commitments</h3>
              <p>Bring shifts, study sessions, and workplace details into one planning view.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Coordinate people</h3>
              <p>Assign responsibilities and keep everyone aligned with timely reminders.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Track progress</h3>
              <p>Use the dashboard to see today's schedule, active work, and upcoming priorities.</p>
            </article>
          </div>
        </section>

        <section className="about" id="about">
          <div className="section-header">
            <p className="section-heading">About</p>
            <h2 className="section-title">Designed for teams that need dependable schedules and less noise.</h2>
          </div>
          <p>
            ShiftSync combines calendar planning, email reminders, workplace setup, and
            study session coordination in a single experience. It gives teams a practical
            operating rhythm without burying the work in administration.
          </p>
        </section>

        <footer className="landing-footer">
          <p>
            Ready to simplify scheduling? <Link to={ROUTES.REGISTER}>Create your workspace</Link>
            {' '}or <Link to={ROUTES.LOGIN}>log in</Link>.
          </p>
        </footer>
      </div>
    </div>
  );
}
