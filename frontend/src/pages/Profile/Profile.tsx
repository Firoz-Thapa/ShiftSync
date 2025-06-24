import React from 'react';
import { PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <PageHeader
        title="👤 Profile"
        subtitle="Manage your account settings and preferences"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Account Information
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.25rem' }}>
                  Full Name
                </label>
                <p style={{ color: '#2d3748', margin: 0 }}>
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#4a5568', marginBottom: '0.25rem' }}>
                  Email
                </label>
                <p style={{ color: '#2d3748', margin: 0 }}>{user?.email}</p>
              </div>
              
              <div style={{ paddingTop: '1rem' }}>
                <Button variant="primary" size="small">
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Account Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button variant="secondary" fullWidth>
                Change Password
              </Button>
              
              <Button variant="secondary" fullWidth>
                Export Data
              </Button>
              
              <Button variant="error" fullWidth onClick={logout}>
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};