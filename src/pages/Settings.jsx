import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import ChatbotWidget from '../components/ChatbotWidget';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';

const Settings = () => {
  const { user, userProfile, loginWithGoogle, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { permission, requestPermission } = useNotifications();

  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-24 md:pb-12">
        <div className="flex items-center space-x-2 mb-8">
          <SettingsIcon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Settings</h1>
        </div>

        <div className="glass-card-solid rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-brand-700' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">Status: {permission}</p>
            </div>
            <button
              onClick={requestPermission}
              className="btn-primary text-sm"
            >
              Enable
            </button>
          </div>

          <div className="p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Account</h3>
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {user.photoURL && <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />}
                  <div>
                    <p className="font-medium">{userProfile?.displayName || user.displayName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button onClick={logout} className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="btn-primary"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
};

export default Settings;
