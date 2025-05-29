import React from 'react';
import { Layout, PageHeader } from '../../components/layout';
import { Card, Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <PageHeader
        title="👤 Profile"
        subtitle="Manage your account settings and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <p className="text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            
            <div className="pt-4">
              <Button variant="primary" size="small">
                Edit Profile
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
          
          <div className="space-y-4">
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
    </Layout>
  );
};
