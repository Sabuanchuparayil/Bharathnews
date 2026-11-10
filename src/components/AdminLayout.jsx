'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Layout from './Layout';
import LoginPrompt from './LoginPrompt';
import WorkspaceShell from './WorkspaceShell';
import { useAuth } from '../context/AuthContext';
import { ADMIN_NAV } from '../config/workspace-nav';

const AdminLayout = ({ children, title, description, actions, maxWidth }) => {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <Layout showHeader={false} showFooter={false} showBottomNav={false} showChatbot={false} mainClassName="!pb-0">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt
            title={!user ? 'Sign In Required' : 'Access Denied'}
            description={!user ? 'Sign in with an admin account to access this page.' : 'Admin role required.'}
            nextPath={pathname}
            showAdminHint
          />
        </div>
      </Layout>
    );
  }

  return (
    <WorkspaceShell
      workspace="admin"
      sections={ADMIN_NAV}
      title={title}
      description={description}
      actions={actions}
      maxWidth={maxWidth}
    >
      {children}
    </WorkspaceShell>
  );
};

export default AdminLayout;
