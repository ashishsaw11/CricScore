import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { MatchStatus } from '../../types';
import Header from '../Header';
import Scoreboard from '../Scoreboard';
import MatchSetup from './MatchSetup';
import ScoreUpdater from './ScoreUpdater';
import PlayerStatsView from '../common/PlayerStatsView';
import MatchHistory from './MatchHistory';
import ActionHistory from './ActionHistory';
import MatchControls from './MatchControls';
import { HistoryIcon } from '../icons/HistoryIcon';

// --- New Icons for the Navigation Panel ---

const ScoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

const SetupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.554-.221a.75.75 0 011.002 0l.553.221c.55.219 1.02.684 1.11 1.226l.099.608a.75.75 0 00.584.585l.608.1a1.125 1.125 0 011.226 1.11l.221.554a.75.75 0 010 1.002l-.221.553a1.125 1.125 0 01-1.226 1.11l-.608.1a.75.75 0 00-.584.585l-.1.608a1.125 1.125 0 01-1.11 1.226l-.554.221a.75.75 0 01-1.002 0l-.553-.221a1.125 1.125 0 01-1.11-1.226l-.1-.608a.75.75 0 00-.584-.585l-.608-.1a1.125 1.125 0 01-1.226-1.11l-.221-.554a.75.75 0 010-1.002l.221-.553a1.125 1.125 0 011.226-1.11l.608-.1a.75.75 0 00.584-.585l.1-.608z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ControlsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5a3.375 3.375 0 00-3.375-3.375L18 13.5m0 0L19.5 12l-1.5-1.5m0 3l-1.5 1.5L18 13.5m0 0L16.5 15l1.5 1.5m0-3l1.5-1.5L18 13.5" />
    </svg>
);

const ActionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);

const EmailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
);


type AdminView = 'scoring' | 'setup' | 'controls' | 'history' | 'actions';

const AdminDashboard: React.FC = () => {
    const { serverState } = useContext(AppContext);
    const { match } = serverState;
    const isMatchInProgress = match.status === MatchStatus.IN_PROGRESS;
    const [activeView, setActiveView] = useState<AdminView>('scoring');

    const NavButton: React.FC<{ viewName: AdminView; label: string; icon: React.ReactNode }> = ({ viewName, label, icon }) => (
        <button
            onClick={() => setActiveView(viewName)}
            className={`flex-shrink-0 w-full flex items-center space-x-2 p-3 rounded-lg text-left transition-colors duration-200 ${
                activeView === viewName
                    ? 'bg-classic-green text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            role="tab"
            aria-selected={activeView === viewName}
        >
            <span className="w-6 h-6">{icon}</span>
            <span className="font-semibold hidden sm:inline">{label}</span>
        </button>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'scoring':
                return isMatchInProgress ? (
                    <>
                        <PlayerStatsView match={match} />
                        <ScoreUpdater />
                    </>
                ) : (
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                        <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-2">Live Scoring</h3>
                        <p className="text-gray-600 dark:text-gray-400">Match is not currently in progress. Start the match from the 'Match Setup' tab to begin scoring.</p>
                    </div>
                );
            case 'setup':
                return <MatchSetup />;
            case 'controls':
                return <MatchControls />;
            case 'history':
                return <MatchHistory />;
            case 'actions':
                return <ActionHistory />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header showLogout={true} />
            <main className="container mx-auto p-4 md:p-8 flex-grow">
                <h2 className="text-2xl sm:text-3xl font-bold text-dark-gray dark:text-gray-200 mb-6">Admin Dashboard</h2>
                <Scoreboard match={match} />

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Navigation Panel */}
                    <aside className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                            <nav className="flex flex-row lg:flex-col lg:space-y-2 overflow-x-auto -mx-4 px-4 pb-2 lg:pb-0">
                                <NavButton viewName="scoring" label="Live Scoring" icon={<ScoreIcon />} />
                                <NavButton viewName="setup" label="Match Setup" icon={<SetupIcon />} />
                                <NavButton viewName="controls" label="Match Controls" icon={<ControlsIcon />} />
                                <NavButton viewName="history" label="Match History" icon={<HistoryIcon />} />
                                <NavButton viewName="actions" label="Action Log" icon={<ActionsIcon />} />
                            </nav>
                        </div>
                    </aside>

                    {/* Right Content Panel */}
                    <div className="lg:col-span-3">
                        {renderContent()}
                    </div>
                </div>
            </main>
             <a
                href="mailto:admisure215@gmail.com?subject=Feedback for CricScore Scoreboard"
                className="fixed bottom-5 right-5 bg-classic-blue text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
                title="Send Feedback"
            >
                <EmailIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Send Feedback</span>
            </a>
        </div>
    );
};

export default AdminDashboard;