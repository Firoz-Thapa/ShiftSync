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

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__link ${
                location.pathname === item.path ? 'sidebar__link--active' : ''
              }`}
              onClick={onClose}
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