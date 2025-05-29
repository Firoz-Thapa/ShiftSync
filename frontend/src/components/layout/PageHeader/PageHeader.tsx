import React from 'react';
import { Button } from '../../common';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <div className="page-header">
      <div className="page-header__main">
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        
        {actions && (
          <div className="page-header__actions">
            {actions}
          </div>
        )}
      </div>
      
      {children && (
        <div className="page-header__content">
          {children}
        </div>
      )}
    </div>
  );
};