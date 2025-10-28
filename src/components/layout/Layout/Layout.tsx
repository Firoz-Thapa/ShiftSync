import React, { useState } from 'react';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
// import { Button } from '../../common';
import { FloatingActionButton } from '../FloatingActionButton/FloatingActionButton';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      <Header onMenuClick={toggleSidebar} isMenuOpen={sidebarOpen} />
      
      <div className="layout__container">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <main className={`layout__main ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="layout__content">
            <div className="layout__content-wrapper">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <FloatingActionButton />
    </div>
  );
};