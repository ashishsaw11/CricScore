import React, { useContext } from 'react';
import { AppContext } from '../App';
import { UsersIcon } from './icons/UsersIcon';
import * as client from '../websocket-client';
import { HistoryIcon } from './icons/HistoryIcon';
import { useLanguage } from './LanguageContext';

interface HeaderProps {
    showLogout: boolean;
}

const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.06-1.06l1.59-1.59a.75.75 0 011.06 0zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM17.803 17.803a.75.75 0 01-1.06 0l-1.59-1.591a.75.75 0 111.06-1.06l1.59 1.59a.75.75 0 010 1.06zM12 21a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75-.75zM5.197 17.803a.75.75 0 010-1.06l1.59-1.591a.75.75 0 011.06 1.06l-1.59 1.59a.75.75 0 01-1.06 0zM3 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3.75A.75.75 0 013 12zM6.106 5.197a.75.75 0 011.06 0l1.59 1.591a.75.75 0 01-1.06 1.06l-1.59-1.59a.75.75 0 010-1.06z" />
    </svg>
);

const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-3.864 2.09-7.247 5.282-9.042a.75.75 0 01.818.162z" clipRule="evenodd" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ showLogout }) => {
  const { serverState, logout, userRole, toggleHistoryModal } = useContext(AppContext);
  const { viewerCount, theme } = serverState;
  const { language, setLanguage } = useLanguage();

  const handleLogout = () => {
    logout();
  };

  const handleToggleTheme = () => {
    client.toggleTheme();
  };

  return (
    <header className="bg-classic-green shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-wider">
          CricScore
        </h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2 text-white">
            <UsersIcon className="w-6 h-6 text-white" />
            <span className="font-semibold text-lg">{viewerCount}</span>
          </div>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
              className="bg-white text-gray-800 rounded-md p-2 h-10"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
           <button
            onClick={handleToggleTheme}
            className="text-white p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>

          {userRole === 'viewer' && (
              <button
                  onClick={toggleHistoryModal}
                  className="text-white p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                  aria-label="View match history"
                  title="View match history"
              >
                  <HistoryIcon className="w-6 h-6" />
              </button>
          )}

          {showLogout && (
             <button
             onClick={handleLogout}
             className="bg-classic-red text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-300"
           >
             Logout
           </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;