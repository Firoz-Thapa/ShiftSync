import React, { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, Button, ThemeToggle, Modal } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, effectiveTheme } = useTheme();
  
  // State for edit profile modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // State for accessibility preferences
  const [reduceMotion, setReduceMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [highContrast, setHighContrast] = useState(
    window.matchMedia('(prefers-contrast: high)').matches
  );

  const getThemeDescription = () => {
    switch (theme) {
      case 'system':
        return `Following system preference (currently ${effectiveTheme})`;
      case 'light':
        return 'Always use light mode';
      case 'dark':
        return 'Always use dark mode';
      default:
        return 'Theme preference';
    }
  };

  const handleReduceMotionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReduceMotion(e.target.checked);
    // Apply the preference to the document
    if (e.target.checked) {
      document.documentElement.style.setProperty('--animation-duration', '0ms');
      document.documentElement.style.setProperty('--transition-duration', '0ms');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('--transition-duration');
    }
  };

  const handleHighContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHighContrast(e.target.checked);
    // Apply high contrast mode
    if (e.target.checked) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  };

  const handleEditClick = () => {
    // Reset form data to current user data
    setEditFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    });
    setUpdateError(null);
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local storage with new data
      const updatedUser = {
        ...user,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem('shiftsync_user', JSON.stringify(updatedUser));
      
      // Show success message
      alert('Profile updated successfully! 🎉');
      
      // Close modal and reload page to reflect changes
      setIsEditModalOpen(false);
      window.location.reload();
    } catch (error: any) {
      setUpdateError(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="👤 Profile"
        subtitle="Manage your account settings and preferences"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Account Information */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Account Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Full Name
                </label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Email
                </label>
                <p style={{ color: 'var(--text-primary)', margin: 0 }}>{user?.email}</p>
              </div>
              
              <div style={{ paddingTop: '1rem' }}>
                <Button variant="primary" size="small" onClick={handleEditClick}>
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>

          {/* Theme Preferences */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              🎨 Appearance
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Theme Preference
                </label>
                <ThemeToggle variant="dropdown" size="medium" />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                  {getThemeDescription()}
                </p>
              </div>
              
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Theme Preview
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Sample card with {effectiveTheme} theme
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Account Actions */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Account Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant="secondary" fullWidth>
                Change Password
              </Button>
              
              <Button variant="secondary" fullWidth>
                Export Data
              </Button>
              
              <Button variant="warning" fullWidth>
                Download Theme Settings
              </Button>
              
              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <Button variant="error" fullWidth onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>

          {/* Accessibility Settings */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              ♿ Accessibility
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label 
                    htmlFor="reduce-motion-toggle"
                    style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)', 
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  >
                    Reduce Motion
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0 0' }}>
                    Minimize animations and transitions
                  </p>
                </div>
                <input 
                  id="reduce-motion-toggle"
                  type="checkbox" 
                  checked={reduceMotion}
                  onChange={handleReduceMotionChange}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    marginLeft: '1rem',
                    cursor: 'pointer'
                  }}
                  aria-describedby="reduce-motion-description"
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label 
                    htmlFor="high-contrast-toggle"
                    style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)', 
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  >
                    High Contrast
                  </label>
                  <p 
                    id="high-contrast-description"
                    style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0 0' }}
                  >
                    Increase color contrast for better readability
                  </p>
                </div>
                <input 
                  id="high-contrast-toggle"
                  type="checkbox" 
                  checked={highContrast}
                  onChange={handleHighContrastChange}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    marginLeft: '1rem',
                    cursor: 'pointer'
                  }}
                  aria-describedby="high-contrast-description"
                />
              </div>

              {/* Additional Accessibility Options */}
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px dashed var(--border-primary)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Browser Accessibility Settings
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                  For more accessibility options, check your browser settings or operating system preferences. 
                  These include text size, zoom level, and screen reader compatibility.
                </p>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              🔔 Notifications
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label 
                    htmlFor="shift-reminders"
                    style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)', 
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  >
                    Shift Reminders
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0 0' }}>
                    Get notified 30 minutes before your shifts
                  </p>
                </div>
                <input 
                  id="shift-reminders"
                  type="checkbox" 
                  defaultChecked={true}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    marginLeft: '1rem',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label 
                    htmlFor="study-reminders"
                    style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)', 
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  >
                    Study Session Reminders
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0 0' }}>
                    Get notified 15 minutes before study sessions
                  </p>
                </div>
                <input 
                  id="study-reminders"
                  type="checkbox" 
                  defaultChecked={true}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    marginLeft: '1rem',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label 
                    htmlFor="weekly-summary"
                    style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)', 
                      display: 'block',
                      cursor: 'pointer'
                    }}
                  >
                    Weekly Summary
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0 0' }}>
                    Receive weekly productivity and earnings reports
                  </p>
                </div>
                <input 
                  id="weekly-summary"
                  type="checkbox" 
                  defaultChecked={false}
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    marginLeft: '1rem',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="✏️ Edit Profile"
        size="medium"
      >
        <form onSubmit={handleEditFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {updateError && (
            <div style={{ 
              background: '#fed7d7', 
              color: '#c53030', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.875rem',
              textAlign: 'center' 
            }}>
              {updateError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="firstName" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={editFormData.firstName}
              onChange={handleEditFormChange}
              required
              style={{
                padding: '0.75rem',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="lastName" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={editFormData.lastName}
              onChange={handleEditFormChange}
              required
              style={{
                padding: '0.75rem',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={editFormData.email}
              onChange={handleEditFormChange}
              required
              style={{
                padding: '0.75rem',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            justifyContent: 'flex-end', 
            paddingTop: '1rem', 
            borderTop: '1px solid var(--border-primary)' 
          }}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};