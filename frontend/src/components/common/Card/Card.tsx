import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card = ({
  children,
  className = '',
  padding = 'medium',
  hoverable = false,
  onClick,
}: CardProps) => {
  const classes = [
    'card',
    `card--padding-${padding}`,
    hoverable && 'card--hoverable',
    onClick && 'card--clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};
