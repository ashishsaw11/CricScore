import React from 'react';
import { MatchState, MatchStatus, PlayerStats } from '../types';
import { useLanguage } from './LanguageContext';

interface ScoreboardProps {
  match: MatchState;
}

const formatPlayerName = (player: PlayerStats) => {
    if (player.nickname) {
        return `${player.name} (${player.nickname})`;
    }
    return player.name;
};

const Scoreboard: React.FC<ScoreboardProps> = ({ match }) => {
  const { t } = useLanguage();
  const { teamA, teamB, battingTeam, status, scheduledTime, tossWinner, choseTo, totalOvers, strikerId, nonStrikerId, bowlerId, targetScore, currentInning, resultMessage, isPaused } = match;

  const battingTeamData = battingTeam === 'teamA' ? teamA : teamB;
  const bowlingTeamData = battingTeam === 'teamA' ? teamB : teamA;

  const striker = battingTeamData.players.find(p => p.id === strikerId);
  const nonStriker = battingTeamData.players.find(p => p.id === nonStrikerId);
  const bowler = bowlingTeamData.players.find(p => p.id === bowlerId);


  const formatOvers = (overs: number, balls: number) => `${overs}.${balls}`;

  const calculateRunRate = (score: number, overs: number, balls: number) => {
    const totalBalls = overs * 6 + balls;
    if (totalBalls === 0) return '0.00';
    return ((score / totalBalls) * 6).toFixed(2);
  };
  
  const getMatchStatus = () => {
    if (isPaused) {
        return { message: t('scoreboard.matchPaused'), color: "text-paused-yellow" };
    }
    if (status === MatchStatus.SUSPENDED) {
      return { message: t('scoreboard.matchSuspended'), color: "text-suspended-orange" };
    }
    if (status === MatchStatus.FINISHED) {
        return { message: resultMessage || t('scoreboard.matchFinished'), color: "text-classic-blue" };
    }
    if (status === MatchStatus.NOT_STARTED) {
        const date = new Date(scheduledTime);
        if(!scheduledTime) return { message: t('scoreboard.matchNotScheduled'), color: "text-gray-600 dark:text-gray-400" };
        return { message: `${t('scoreboard.matchStartsAt')} ${date.toLocaleTimeString()} ${t('scoreboard.on')} ${date.toLocaleDateString()}`, color: "text-gray-600 dark:text-gray-400" };
    }
    
    if (currentInning === 2) {
        const runsNeeded = targetScore - battingTeamData.score;
        const totalBallsRemaining = (totalOvers * 6) - (battingTeamData.overs * 6 + battingTeamData.balls);
        if (runsNeeded > 0 && totalBallsRemaining > 0) {
          return { message: `${battingTeamData.name} ${t('scoreboard.needRunsInBalls', { runsNeeded, totalBallsRemaining })}`, color: "text-dark-green dark:text-green-400" };
        }
    }

    if (tossWinner && status !== 'In Progress') {
        const winnerName = tossWinner === 'teamA' ? teamA.name : teamB.name;
        return { message: t('scoreboard.wonTossChoseTo', { winnerName, choseTo }), color: "text-gray-600 dark:text-gray-400" };
    }

    return { message: t('scoreboard.isBatting', { battingTeamName: battingTeamData.name }), color: "text-dark-green dark:text-green-400" };
  }

  const { message, color } = getMatchStatus();
  const isTeamHighlightActive = status === MatchStatus.IN_PROGRESS && !isPaused;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-medium-gray dark:border-gray-700">
      <div className="text-center mb-4">
        <p className={`font-bold text-base sm:text-lg ${color}`}>{message}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
        {/* Team A */}
        <div className={`p-2 sm:p-4 rounded-lg transition-colors ${battingTeam === 'teamA' && isTeamHighlightActive ? 'bg-green-100 dark:bg-gray-700 border border-green-200 dark:border-gray-600' : ''}`}>
          <h2 className="text-xl sm:text-2xl font-bold text-dark-gray dark:text-gray-200">{teamA.name}</h2>
          <p className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white my-1 sm:my-2">
            {teamA.score} - {teamA.wickets}
          </p>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            ({formatOvers(teamA.overs, teamA.balls)} / {totalOvers > 0 ? totalOvers : 'N/A'})
          </p>
        </div>
        
        {/* VS */}
        <div className="text-2xl sm:text-4xl font-bold text-gray-400 dark:text-gray-500 my-2 sm:my-0">
          {t('scoreboard.vs')}
        </div>

        {/* Team B */}
        <div className={`p-2 sm:p-4 rounded-lg transition-colors ${battingTeam === 'teamB' && isTeamHighlightActive ? 'bg-green-100 dark:bg-gray-700 border border-green-200 dark:border-gray-600' : ''}`}>
          <h2 className="text-xl sm:text-2xl font-bold text-dark-gray dark:text-gray-200">{teamB.name}</h2>
           <p className="text-2xl sm:text-4xl font-extrabold text-black dark:text-white my-1 sm:my-2">
            {teamB.score} - {teamB.wickets}
          </p>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            ({formatOvers(teamB.overs, teamB.balls)} / {totalOvers > 0 ? totalOvers : 'N/A'})
          </p>
        </div>
      </div>
      
       {status === 'In Progress' && (
        <>
            <div className="mt-4 sm:mt-6 pt-4 border-t border-medium-gray dark:border-gray-700 flex flex-col sm:flex-row justify-around text-center gap-4 sm:gap-0">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoreboard.batting')}</p>
                    <p className="font-bold text-lg text-dark-gray dark:text-gray-200">{battingTeamData.name}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoreboard.runRate')}</p>
                    <p className="font-bold text-lg text-classic-green">{calculateRunRate(battingTeamData.score, battingTeamData.overs, battingTeamData.balls)}</p>
                </div>
                {targetScore > 0 && <div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoreboard.target')}</p>
                    <p className="font-bold text-lg text-classic-blue">{targetScore}</p>
                </div>}
            </div>
             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-around text-center gap-4 sm:gap-0">
                 <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoreboard.striker')}</p>
                    <p className="font-bold text-md text-dark-gray dark:text-gray-200">{striker ? formatPlayerName(striker) : 'N/A'}*</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoreboard.nonStriker')}</p>
                    <p className="font-bold text-md text-dark-gray dark:text-gray-200">{nonStriker ? formatPlayerName(nonStriker) : 'N/A'}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoreboard.bowler')}</p>
                    <p className="font-bold text-md text-dark-gray dark:text-gray-200">{bowler ? formatPlayerName(bowler) : 'N/A'}</p>
                </div>
            </div>
        </>
       )}
    </div>
  );
};

export default Scoreboard;