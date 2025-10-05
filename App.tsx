import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AppState, UserRole, MatchState } from './types';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import ViewerScoreboard from './components/viewer/ViewerScoreboard';
import * as client from './websocket-client';
import ErrorBoundary from './components/ErrorBoundary';
import { getInitialState } from './initialState';
import ConnectionStatusBanner from './components/ConnectionStatusBanner';
import Modal from './components/common/Modal';
import { openMatchStateInNewTab } from './components/common/csvExporter';
import { LanguageProvider } from './components/LanguageContext';


export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export const AppContext = React.createContext<{
  serverState: AppState;
  connectionStatus: ConnectionStatus;
  userRole: UserRole;
  viewerDetails: { name: string } | null;
  logout: () => void;
  isHistoryModalOpen: boolean;
  toggleHistoryModal: () => void;
}>({
  serverState: getInitialState(),
  connectionStatus: 'connecting',
  userRole: null,
  viewerDetails: null,
  logout: () => {},
  isHistoryModalOpen: false,
  toggleHistoryModal: () => {},
});

// --- New Component for Viewer Match History ---
const MatchHistoryModal: React.FC = () => {
    const { serverState, isHistoryModalOpen, toggleHistoryModal } = useContext(AppContext);
    const { matchHistory } = serverState;

    const handleViewScorecard = (match: MatchState) => {
        openMatchStateInNewTab(match);
    };

    const sortedHistory = matchHistory ? [...matchHistory].sort((a, b) => {
        const dateA = a.completedAt || a.scheduledTime;
        const dateB = b.completedAt || b.scheduledTime;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    }) : [];

    return (
        <Modal
            isOpen={isHistoryModalOpen}
            onClose={toggleHistoryModal}
            title="Completed Match History"
        >
            {(!sortedHistory || sortedHistory.length === 0) ? (
                 <div className="text-center p-4">
                    <p className="text-gray-600 dark:text-gray-400">No completed matches found in history.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {sortedHistory.map((match) => (
                        <div key={match._id || match.scheduledTime} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-light-gray dark:bg-gray-900/50">
                            <div>
                                <p className="font-bold text-dark-gray dark:text-gray-200">{match.teamA.name} vs {match.teamB.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {match.status} - {match.completedAt ? new Date(match.completedAt).toLocaleString() : new Date(match.scheduledTime).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{match.resultMessage}</p>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => handleViewScorecard(match)}
                                    className="w-full bg-classic-green text-white font-semibold py-2 px-4 rounded-md hover:bg-dark-green transition-colors duration-300"
                                >
                                    View Scorecard
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};


const App: React.FC = () => {
  const [serverState, setServerState] = useState<AppState>(getInitialState());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [viewerDetails, setViewerDetails] = useState<{ name: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);


  useEffect(() => {
    client.connect({
      onUpdate: (newState) => {
        setServerState(newState);
        setConnectionStatus('connected');
      },
      onError: () => {
        setConnectionStatus('error');
      },
      onConnect: () => {
        setConnectionStatus('connecting');
      }
    });
  }, []); 


  useEffect(() => {
    if (serverState?.theme) {
      const root = window.document.documentElement;
      if (serverState.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', serverState.theme);
    }
  }, [serverState?.theme]);

  const handleAdminLogin = () => {
    setIsLoggedIn(true);
    setUserRole('admin');
    client.login({ role: 'admin' });
  };

  const handleViewerLogin = (name: string) => {
    setIsLoggedIn(true);
    setUserRole('viewer');
    setViewerDetails({ name });
    try { localStorage.setItem('viewerName', name); } catch {}
    client.login({ role: 'viewer', details: { name } });
  };
  
  const handleLogout = useCallback(() => {
    // Notify the server if a viewer is logging out so the count can be updated.
    if (userRole === 'viewer') {
        client.logout();
    }
    // Reset client-side state to return to the login screen.
    setIsLoggedIn(false);
    setUserRole(null);
    setViewerDetails(null);
  }, [userRole]);

  const toggleHistoryModal = useCallback(() => {
    setIsHistoryModalOpen(prev => !prev);
  }, []);


  useEffect(()=>{
    if(!isLoggedIn){
      try {
        const saved = localStorage.getItem('viewerName');
        if(saved){
          // auto login silently as viewer
          handleViewerLogin(saved);
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const renderAppContent = () => {
    if (!isLoggedIn) {
      return <LoginScreen onAdminLogin={handleAdminLogin} onViewerLogin={handleViewerLogin} />;
    }
    if (userRole === 'admin') {
      return <AdminDashboard />;
    }
    if (userRole === 'viewer') {
      return <ViewerScoreboard />;
    }
    return <LoginScreen onAdminLogin={handleAdminLogin} onViewerLogin={handleViewerLogin} />;
  };

  const isBannerVisible = connectionStatus !== 'connected';

  return (
    <LanguageProvider>
      <AppContext.Provider value={{ serverState, connectionStatus, userRole, viewerDetails, logout: handleLogout, isHistoryModalOpen, toggleHistoryModal }}>
          <div className={`min-h-screen transition-all duration-300 ${isBannerVisible ? 'pt-9' : ''}`}>
              <ConnectionStatusBanner />
              <ErrorBoundary>
                {renderAppContent()}
              </ErrorBoundary>
              {userRole === 'viewer' && <MatchHistoryModal />}
          </div>
      </AppContext.Provider>
    </LanguageProvider>
  );
};

export default App;