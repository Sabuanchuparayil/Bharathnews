import React, { Suspense, lazy, useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { InterestProvider } from './context/InterestContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPWA from './components/InstallPWA';

import Home from './pages/Home';

const India = lazy(() => import('./pages/India'));
const GCC = lazy(() => import('./pages/GCC'));
const Business = lazy(() => import('./pages/Business'));
const Technology = lazy(() => import('./pages/Technology'));
const Sports = lazy(() => import('./pages/Sports'));
const Entertainment = lazy(() => import('./pages/Entertainment'));
const Health = lazy(() => import('./pages/Health'));
const Education = lazy(() => import('./pages/Education'));
const Jobs = lazy(() => import('./pages/Jobs'));
const RealEstate = lazy(() => import('./pages/RealEstate'));
const Lifestyle = lazy(() => import('./pages/Lifestyle'));
const Opinion = lazy(() => import('./pages/Opinion'));
const Explore = lazy(() => import('./pages/Explore'));
const Community = lazy(() => import('./pages/Community'));
const Article = lazy(() => import('./pages/Article'));
const Videos = lazy(() => import('./pages/Videos'));
const Search = lazy(() => import('./pages/Search'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const Settings = lazy(() => import('./pages/Settings'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminModeration = lazy(() => import('./pages/AdminModeration'));
const AITools = lazy(() => import('./pages/AITools'));
const CreatorApply = lazy(() => import('./pages/CreatorApply'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const CreatorSpace = lazy(() => import('./pages/CreatorSpace'));
const CreatorProfile = lazy(() => import('./pages/CreatorProfile'));
const CreatorPost = lazy(() => import('./pages/CreatorPost'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function AppContent() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'user'}>
      <Router>
        <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0 text-gray-900 dark:text-gray-50 transition-colors duration-300">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/india" element={<India />} />
              <Route path="/gcc" element={<GCC />} />
              <Route path="/business" element={<Business />} />
              <Route path="/technology" element={<Technology />} />
              <Route path="/sports" element={<Sports />} />
              <Route path="/entertainment" element={<Entertainment />} />
              <Route path="/health" element={<Health />} />
              <Route path="/education" element={<Education />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/real-estate" element={<RealEstate />} />
              <Route path="/lifestyle" element={<Lifestyle />} />
              <Route path="/opinion" element={<Opinion />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/community" element={<Community />} />
              <Route path="/creator/apply" element={<CreatorApply />} />
              <Route path="/creator/new" element={<CreatePost />} />
              <Route path="/creator/space" element={<CreatorSpace />} />
              <Route path="/creator/post/:postId" element={<CreatorPost />} />
              <Route path="/@:username" element={<CreatorProfile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
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
          </Suspense>
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
      </Router>
    </MotionConfig>
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
