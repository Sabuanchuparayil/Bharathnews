import React from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { InterestProvider } from './context/InterestContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPWA from './components/InstallPWA';

import Home from './pages/Home';
import India from './pages/India';
import GCC from './pages/GCC';
import Business from './pages/Business';
import Technology from './pages/Technology';
import Community from './pages/Community';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AITools from './pages/AITools';
import Article from './pages/Article';
import Videos from './pages/Videos';
import Search from './pages/Search';
import Bookmarks from './pages/Bookmarks';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <Theme appearance={isDark ? 'dark' : 'light'} radius="large" scaling="100%">
      <Router>
        <div className={`min-h-screen ${isDark ? 'dark' : ''}`}>
          <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0 text-gray-900 dark:text-gray-50 transition-colors duration-300">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/india" element={<India />} />
              <Route path="/gcc" element={<GCC />} />
              <Route path="/business" element={<Business />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/community" element={<Community />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/ai-tools" element={<AITools />} />
              <Route path="/article/:slug" element={<Article />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/search" element={<Search />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <InstallPWA />
            <ToastContainer
              position="bottom-center"
              autoClose={2500}
              newestOnTop
              closeOnClick
              pauseOnHover
              toastClassName="!rounded-xl !shadow-glass !font-body"
              className="!bottom-20 md:!bottom-4"
            />
          </div>
        </div>
      </Router>
    </Theme>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <InterestProvider>
              <AppContent />
            </InterestProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
