import React, { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, Button, ThemeToggle, Modal } from '../../components/common';
import { ToastContainer, useToast } from '../../components/common/Toast/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, effectiveTheme } = useTheme();
  const { toasts, success, error, removeToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string>(user?.avatarUrl || '');
  const [reduceMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [highContrast] = useState(
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

  const handleEditClick = () => {
    setEditFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    });
    setPreviewAvatar(user?.avatarUrl || '');
    setUpdateError(null);
    setIsEditModalOpen(true);
  };

  const downloadJsonFile = (fileName: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewAvatar(result);
      setEditFormData(prev => ({
        ...prev,
        avatarUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = {
        ...user,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        avatarUrl: editFormData.avatarUrl || user?.avatarUrl || '',
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('shiftsync_user', JSON.stringify(updatedUser));

      setIsEditModalOpen(false);

      success(
        'Profile Updated!',
        'Your profile information has been successfully updated.',
        4000
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update profile');
      error(
        'Update Failed',
        err.message || 'Failed to update profile. Please try again.',
        5000
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePasswordClick = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordFormData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      localStorage.setItem('shiftsync_password_updated_at', new Date().toISOString());
      setIsPasswordModalOpen(false);
      success(
        'Password Updated',
        'Your password has been changed successfully.',
        4000
      );
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
      error(
        'Password Change Failed',
        err.message || 'Failed to change password. Please try again.',
        5000
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportData = () => {
    const exportedAt = new Date().toISOString();
    const appData = Object.keys(localStorage)
      .filter(key => key.startsWith('shiftsync_') && key !== 'shiftsync_token')
      .sort()
      .reduce<Record<string, unknown>>((data, key) => {
        const value = localStorage.getItem(key);

        try {
          data[key] = value ? JSON.parse(value) : value;
        } catch {
          data[key] = value;
        }

        return data;
      }, {});

    downloadJsonFile(`shiftsync-data-${exportedAt.slice(0, 10)}.json`, {
      exportedAt,
      userId: user?.id,
      appData,
    });

    success('Data Exported', 'Your ShiftSync data download has started.', 3000);
  };

  const handleDownloadThemeSettings = () => {
    const exportedAt = new Date().toISOString();

    downloadJsonFile(`shiftsync-theme-settings-${exportedAt.slice(0, 10)}.json`, {
      exportedAt,
      theme,
      effectiveTheme,
      reduceMotion,
      highContrast,
      recentColors: JSON.parse(localStorage.getItem('shiftsync_recent_colors') || '[]'),
    });

    success('Theme Settings Downloaded', 'Your theme settings download has started.', 3000);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'grid', placeItems: 'center', width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(102, 126, 234, 0.15)' }}>
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                      {user?.firstName?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Full Name
                  </label>
                  <p style={{ color: 'var(--text-primary)', margin: 0 }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
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
              Appearance
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

              {/* Theme preview removed per issue #76 */}
            </div>
          </Card>

          {/* Account Actions */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Account Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant="secondary" fullWidth onClick={handleChangePasswordClick}>
                Change Password
              </Button>

              <Button variant="secondary" fullWidth onClick={handleExportData}>
                Export Data
              </Button>

              <Button variant="warning" fullWidth onClick={handleDownloadThemeSettings}>
                Download Theme Settings
              </Button>

              <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <Button variant="error" fullWidth onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Notifications
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
            <label htmlFor="avatar" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Profile Photo
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(102, 126, 234, 0.1)', display: 'grid', placeItems: 'center' }}>
                {previewAvatar ? (
                  <img
                    src={previewAvatar}
                    alt="Avatar preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    {editFormData.firstName?.charAt(0).toUpperCase() || editFormData.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                type="file"
                id="avatar"
                accept="image/png, image/jpeg"
                onChange={handleAvatarChange}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '2px solid var(--border-primary)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

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

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="medium"
      >
        <form onSubmit={handlePasswordFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {passwordError && (
            <div style={{
              background: '#fed7d7',
              color: '#c53030',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {passwordError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="currentPassword" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Current Password *
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordFormData.currentPassword}
              onChange={handlePasswordFormChange}
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
            <label htmlFor="newPassword" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              New Password *
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordFormData.newPassword}
              onChange={handlePasswordFormChange}
              required
              minLength={8}
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
            <label htmlFor="confirmPassword" style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Confirm New Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordFormData.confirmPassword}
              onChange={handlePasswordFormChange}
              required
              minLength={8}
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
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUpdating}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};
