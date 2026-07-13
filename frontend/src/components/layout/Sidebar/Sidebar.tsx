import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: '🏠' },
  { path: ROUTES.SCHEDULE, label: 'Schedule', icon: '📅' },
  { path: ROUTES.WORKPLACES, label: 'Workplaces', icon: '🏢' },
  { path: ROUTES.ANALYTICS, label: 'Analytics', icon: '📊' },
  { path: ROUTES.EMAIL, label: 'Email', icon: '📧' },
  { path: ROUTES.PROFILE, label: 'Profile', icon: '👤' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const handleNavigation = () => {
    // On smaller screens this is an off-canvas drawer. On desktop it is a
    // layout column, so keep it open while navigating.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onClose} aria-hidden="true" />}
      <aside id="primary-navigation" className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <nav className="sidebar__nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__link ${
                location.pathname === item.path ? 'sidebar__link--active' : ''
              }`}
              onClick={handleNavigation}
              title={item.label}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
