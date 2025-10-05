import React, { useContext } from 'react';
import { AppContext } from '../../App';
import Header from '../Header';
import Scoreboard from '../Scoreboard';
import { MatchStatus } from '../../types';
import PlayerStatsView from '../common/PlayerStatsView';
import ConfettiOverlay from '../common/ConfettiOverlay';
import { useLanguage } from '../LanguageContext';

const EmailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
);

const ViewerScoreboard: React.FC = () => {
  const { serverState } = useContext(AppContext);
  const { match } = serverState;
  const { t } = useLanguage();
  const battingTeamData = match.battingTeam === 'teamA' ? match.teamA : match.teamB;

  const runsNeeded = match.targetScore - battingTeamData.score;
  const ballsRemaining = (match.totalOvers * 6) - (battingTeamData.overs * 6 + battingTeamData.balls);

  return (
    <div className="min-h-screen flex flex-col">
            <ConfettiOverlay match={match} />
      <Header showLogout={true} />
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
                <Scoreboard match={match} />
            </div>

            {match.status === MatchStatus.IN_PROGRESS && (
                <div className="lg:col-span-3">
                    {match.currentInning === 2 && match.targetScore > 0 && (
                        <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-medium-gray dark:border-gray-700 text-center">
                            <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200">
                                {t('viewerScoreboard.target')} <span className="text-classic-blue">{match.targetScore}</span>
                            </h3>
                            <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">
                                {t('viewerScoreboard.need')} <span className="font-bold">{runsNeeded > 0 ? runsNeeded : 0}</span> {t('viewerScoreboard.runsToWinFrom')}
                                from <span
                                className="font-bold">{ballsRemaining > 0 ? ballsRemaining : 0}</span> {t('viewerScoreboard.balls')}
                            </p>
                        </div>
                    )}
                    <PlayerStatsView match={match}/>
                </div>
            )}
        </div>
      </main>
        <a
            href="mailto:admisure215@gmail.com?subject=Feedback for CricScore Scoreboard"
            className="fixed bottom-5 right-5 bg-classic-blue text-white font-bold py-3 px-5 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
            title={t('viewerScoreboard.sendFeedback')}
        >
            <EmailIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('viewerScoreboard.sendFeedback')}</span>
        </a>
    </div>
  );
};

export default ViewerScoreboard;