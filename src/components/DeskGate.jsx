'use client';

import React from 'react';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';

const DeskGate = ({ children }) => {
  const { user, loading, isContentWriter } = useAuth();

  if (loading) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isContentWriter) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt nextPath="/desk" showAdminHint />
        </div>
      </Layout>
    );
  }

  return children;
};

export default DeskGate;
