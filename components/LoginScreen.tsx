import React, { useState } from 'react';
import { DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD } from '../constants';

interface LoginScreenProps {
  onAdminLogin: () => void;
  onViewerLogin: (name: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAdminLogin, onViewerLogin }) => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Admin state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Viewer state
  const [viewerName, setViewerName] = useState('');
  const [viewerError, setViewerError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
      setAdminError('');
      onAdminLogin();
    } else {
      setAdminError('Invalid username or password.');
    }
  };

  const handleViewerJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerName.trim()) {
      setViewerError('');
      onViewerLogin(viewerName.trim());
    } else {
      setViewerError('Please enter your name.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="absolute top-6 right-6">
            <button
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="font-semibold text-classic-blue hover:underline dark:text-blue-400 transition-colors duration-300 py-2 px-4"
            aria-label={showAdminLogin ? 'Switch to viewer join form' : 'Switch to admin login form'}
            >
            {showAdminLogin ? 'Join as Viewer' : 'Admin Login'}
            </button>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-classic-green mb-2">Welcome to VilBuzz!</h1>
            <p className="text-gray-600 dark:text-gray-400">
                This app simplifies cricket tournament management and delivers real-time live match updates.
            </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-medium-gray dark:border-gray-700">
          <div className="p-8">
            {!showAdminLogin ? (
              <form onSubmit={handleViewerJoin} className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-dark-gray dark:text-gray-200">Join Scoreboard</h2>
                <div>
                  <label htmlFor="viewerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                  <input
                    id="viewerName"
                    type="text"
                    value={viewerName}
                    onChange={(e) => setViewerName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                {viewerError && <p className="text-red-500 text-sm text-center">{viewerError}</p>}
                <button type="submit" className="w-full bg-classic-green text-white font-bold py-3 rounded-md hover:bg-dark-green transition-all duration-300">
                  Watch Live
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-6">
                 <h2 className="text-2xl font-bold text-center text-dark-gray dark:text-gray-200">Admin Login</h2>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                {adminError && <p className="text-red-500 text-sm text-center">{adminError}</p>}
                <button type="submit" className="w-full bg-classic-green text-white font-bold py-3 rounded-md hover:bg-dark-green transition-all duration-300">
                  Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

       <div className="absolute bottom-4 left-0 right-0 text-center px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                This app is created by Ashish Kumar Shaw. It is an open-source project, and developers can contribute to and improve it.
            </p>
        </div>
    </div>
  );
};

export default LoginScreen;