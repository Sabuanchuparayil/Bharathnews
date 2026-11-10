'use client';

import React from 'react';
import DeskGate from './DeskGate';
import WorkspaceShell from './WorkspaceShell';
import { useAuth } from '../context/AuthContext';
import { getDeskNav } from '../config/workspace-nav';

const DeskShell = ({ children, ...pageProps }) => {
  const { isAdmin } = useAuth();
  return (
    <WorkspaceShell workspace="desk" sections={getDeskNav({ isAdmin })} {...pageProps}>
      {children}
    </WorkspaceShell>
  );
};

const DeskLayout = ({ children, title, description, actions, maxWidth = 'max-w-5xl' }) => (
  <DeskGate>
    <DeskShell title={title} description={description} actions={actions} maxWidth={maxWidth}>
      {children}
    </DeskShell>
  </DeskGate>
);

export default DeskLayout;
