import React, { useState } from 'react';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

// Mock data for demonstration
const mockShifts = [
  {
    id: 1,
    title: 'Morning Shift',
    startDatetime: '2025-06-10T09:00:00',
    endDatetime: '2025-06-10T17:00:00',
    workplace: { name: 'Campus Coffee', color: '#3498db' },
    isConfirmed: true
  },
  {
    id: 2,
    title: 'Evening Shift',
    startDatetime: '2025-06-10T18:00:00',
    endDatetime: '2025-06-10T22:00:00',
    workplace: { name: 'Local Bookstore', color: '#2ecc71' },
    isConfirmed: false
  }
];

const mockStudySessions = [
  {
    id: 1,
    title: 'Database Systems Review',
    startDatetime: '2025-06-10T14:00:00',
    endDatetime: '2025-06-10T16:00:00',
    subject: 'Computer Science',
    priority: 'high',
    isCompleted: false
  },
  {
    id: 2,
    title: 'Math Assignment',
    startDatetime: '2025-06-10T19:00:00',
    endDatetime: '2025-06-10T21:00:00',
    subject: 'Mathematics',
    priority: 'medium',
    isCompleted: true
  }
];

// Utility functions
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatHours = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
};

// Styled components
const cardStyles = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  padding: '24px'
};

const buttonStyles = {
  base: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  primary: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white'
  },
  secondary: {
    background: '#6b7280',
    color: 'white'
  },
  success: {
    background: '#10b981',
    color: 'white'
  },
  warning: {
    background: '#f59e0b',
    color: 'white'
  },
  error: {
    background: '#ef4444',
    color: 'white'
  }
};

const inputStyles = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '16px',
  marginBottom: '16px'
};

// Components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div style={cardStyles} className={className}>
    {children}
  </div>
);

const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: keyof typeof buttonStyles;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, variant = 'primary', className = '', type = 'button' }) => {
  const combinedStyles = {
    ...buttonStyles.base,
    ...(variant !== 'base' ? buttonStyles[variant] : {})
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      style={combinedStyles}
      className={className}
    >
      {children}
    </button>
  );
};

const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '28rem',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{title}</h2>
          <button 
            onClick={onClose} 
            style={{
              color: '#6b7280',
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Main Components
const Header: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <header style={{
      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>ShiftSync</h1>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>Your personal time wizard</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: '500', margin: 0 }}>Hey, {user?.firstName}! 👋</p>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>{user?.email}</p>
          </div>
          <Button variant="error" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

const Navigation: React.FC = () => {
  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: '🏠' },
    { path: ROUTES.SCHEDULE, label: 'Schedule', icon: '📅' },
    { path: ROUTES.WORKPLACES, label: 'Workplaces', icon: '🏢' },
    { path: ROUTES.ANALYTICS, label: 'Analytics', icon: '📊' },
    { path: ROUTES.PROFILE, label: 'Profile', icon: '👤' },
  ];
  
  return (
    <nav style={{
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                color: '#4b5563',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#2563eb';
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{item.icon}</span>
              <span style={{ fontWeight: '500' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

const TodaySchedule: React.FC = () => {
  const allItems = [
    ...mockShifts.map(shift => ({
      id: `shift-${shift.id}`,
      type: 'work' as const,
      title: shift.title,
      subtitle: shift.workplace?.name || 'Work',
      startTime: shift.startDatetime,
      endTime: shift.endDatetime,
      color: shift.workplace?.color || '#3498db',
      isConfirmed: shift.isConfirmed,
    })),
    ...mockStudySessions.map(session => ({
      id: `study-${session.id}`,
      type: 'study' as const,
      title: session.title,
      subtitle: session.subject || 'Study',
      startTime: session.startDatetime,
      endTime: session.endDatetime,
      color: '#2ecc71',
      priority: session.priority,
    })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>📅 Today's Schedule</h2>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>Tuesday, June 10, 2025</span>
      </div>

      {allItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '18px', margin: '8px 0' }}>🎉 No scheduled items for today!</p>
          <p style={{ color: '#6b7280', margin: 0 }}>Time for some spontaneous productivity?</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {allItems.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <div style={{
                width: '4px',
                borderRadius: '2px',
                backgroundColor: item.color,
                flexShrink: 0
              }} />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: '600', margin: 0 }}>{item.title}</h3>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.subtitle}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: item.type === 'work' ? '#dbeafe' : '#dcfce7',
                      color: item.type === 'work' ? '#1e40af' : '#166534'
                    }}>
                      {item.type === 'work' ? '💼 Work' : '📚 Study'}
                    </span>
                    
                    {item.type === 'work' && !item.isConfirmed && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e'
                      }}>
                        ⏳ Pending
                      </span>
                    )}
                    
                    {item.type === 'study' && item.priority === 'high' && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        🔥 High Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const QuickActions: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'shift' | 'study' | null>(null);

  return (
    <>
      <Card>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>⚡ Quick Actions</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Button onClick={() => setActiveModal('shift')}>
            📋 Add Shift
          </Button>
          <Button variant="secondary" onClick={() => setActiveModal('study')}>
            📚 Schedule Study
          </Button>
          <Button variant="success" onClick={() => alert('Clock in feature coming soon!')}>
            🕐 Clock In
          </Button>
          <Button variant="warning" onClick={() => alert('Analytics coming soon!')}>
            📊 View Stats
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={activeModal === 'shift'}
        onClose={() => setActiveModal(null)}
        title="Add New Shift"
      >
        <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); }}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="shift-title" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Shift Title
            </label>
            <input 
              id="shift-title"
              type="text" 
              placeholder="Enter shift title" 
              style={inputStyles}
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="workplace-select" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Workplace
            </label>
            <select id="workplace-select" style={inputStyles} required>
              <option value="">Select workplace</option>
              <option value="campus-coffee">Campus Coffee</option>
              <option value="local-bookstore">Local Bookstore</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="start-time" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Start Time
            </label>
            <input 
              id="start-time"
              type="datetime-local" 
              style={inputStyles}
              required
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="end-time" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              End Time
            </label>
            <input 
              id="end-time"
              type="datetime-local" 
              style={inputStyles}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="button" onClick={() => setActiveModal(null)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit">
              Create Shift
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'study'}
        onClose={() => setActiveModal(null)}
        title="Schedule Study Session"
      >
        <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); }}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="study-title" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Study Session Title
            </label>
            <input 
              id="study-title"
              type="text" 
              placeholder="Enter study session title" 
              style={inputStyles}
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="subject" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Subject
            </label>
            <input 
              id="subject"
              type="text" 
              placeholder="Enter subject" 
              style={inputStyles}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="study-start-time" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Start Time
            </label>
            <input 
              id="study-start-time"
              type="datetime-local" 
              style={inputStyles}
              required
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="study-end-time" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              End Time
            </label>
            <input 
              id="study-end-time"
              type="datetime-local" 
              style={inputStyles}
              required
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="priority-select" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Priority
            </label>
            <select id="priority-select" style={inputStyles}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="button" onClick={() => setActiveModal(null)} variant="secondary">
              Cancel
            </Button>
            <Button type="submit">
              Schedule Session
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

const StatsOverview: React.FC = () => {
  // Calculate mock stats
  const weeklyWorkHours = mockShifts.reduce((total, shift) => {
    return total + calculateDuration(shift.startDatetime, shift.endDatetime);
  }, 0);

  const weeklyStudyHours = mockStudySessions.reduce((total, session) => {
    return total + calculateDuration(session.startDatetime, session.endDatetime);
  }, 0);

  const weeklyEarnings = mockShifts.reduce((total, shift) => {
    const hours = calculateDuration(shift.startDatetime, shift.endDatetime);
    return total + (hours * 15.50); // Mock hourly rate
  }, 0);

  const completedSessions = mockStudySessions.filter(session => session.isCompleted).length;
  const totalSessions = mockStudySessions.length;

  return (
    <Card>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>📊 This Week</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💼</div>
          <div>
            <p style={{ fontWeight: '600', margin: 0 }}>{formatHours(weeklyWorkHours)}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Work Hours</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📚</div>
          <div>
            <p style={{ fontWeight: '600', margin: 0 }}>{formatHours(weeklyStudyHours)}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Study Hours</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
          <div>
            <p style={{ fontWeight: '600', margin: 0 }}>{formatCurrency(weeklyEarnings)}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Earnings</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#e9d5ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
          <div>
            <p style={{ fontWeight: '600', margin: 0 }}>{completedSessions}/{totalSessions}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Study Goals</p>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Weekly Progress</span>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{Math.round((completedSessions / Math.max(totalSessions, 1)) * 100)}%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            height: '8px',
            borderRadius: '9999px',
            transition: 'all 0.3s ease',
            width: `${(completedSessions / Math.max(totalSessions, 1)) * 100}%`
          }} />
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%)' }}>
      <Header />
      <Navigation />
      
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 16px 32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Welcome back, {user?.firstName}! 🎯
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Ready to conquer your day? Here's what's coming up...</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div>
            <TodaySchedule />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <QuickActions />
            <StatsOverview />
          </div>
        </div>
      </div>
    </div>
  );
};