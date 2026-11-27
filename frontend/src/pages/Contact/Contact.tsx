import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { LandingPageNavbar } from '../../components/LandingPage/Navbar';
import './Contact.css';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`ShiftSync contact from ${name}`);
    const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`);
    window.location.href = `mailto:support@shiftsync.app?subject=${subject}&body=${body}`;
  };

  return (
    <div className="landing-page contact-page">
      <div className="landing-content">
        <LandingPageNavbar />
        <main className="contact-content">
          <section className="contact-intro">
            <p className="section-heading">Contact</p>
            <h1 className="section-title">We’re here to help.</h1>
            <p>Have a question about ShiftSync? Send our team a message and we’ll be glad to help.</p>
          </section>
          <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="contact-name">Your name</label>
            <input id="contact-name" name="name" autoComplete="name" required value={name} onChange={event => setName(event.target.value)} />
            <label htmlFor="contact-email">Email address</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
            <label htmlFor="contact-message">How can we help?</label>
            <textarea id="contact-message" name="message" rows={6} required value={message} onChange={event => setMessage(event.target.value)} />
            <button className="cta-button primary" type="submit">Send message</button>
            <p className="contact-note">Your email app will open with your message ready to send.</p>
          </form>
          <p className="contact-back"><Link to={ROUTES.HOME}>Back to ShiftSync</Link></p>
        </main>
      </div>
    </div>
  );
};
