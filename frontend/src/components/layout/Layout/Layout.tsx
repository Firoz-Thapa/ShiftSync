import React, { useState } from 'react';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
import { Button } from '../../common';
import { FloatingActionButton } from '../../common/FloatingActionButton/FloatingActionButton';
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
      <Header />
      
      <div className="layout__container">
        <Button
          className="layout__menu-button"
          variant="ghost"
          size="small"
          onClick={toggleSidebar}
        >
          ☰
        </Button>

        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        <main className="layout__main">
          <div className="layout__content">
            {children}
          </div>
        </main>
      </div>
      
      <FloatingActionButton />
    </div>
  );
};