import React from 'react';
import { MatchState, PlayerStats } from '../../types';

const calculateSR = (runs: number, balls: number) => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(2);
};

const calculateEcon = (runs: number, overs: number, balls: number) => {
    const totalBalls = overs * 6 + balls;
    if (totalBalls === 0) return '0.00';
    return ((runs / totalBalls) * 6).toFixed(2);
};

const PlayerStatsView: React.FC<{ match: MatchState }> = ({ match }) => {
    const { teamA, teamB, battingTeam, strikerId, nonStrikerId, bowlerId, currentOverHistory } = match;

    const battingTeamData = battingTeam === 'teamA' ? teamA : teamB;
    const bowlingTeamData = battingTeam === 'teamA' ? teamB : teamA;

    const BattingRow: React.FC<{ player: PlayerStats }> = ({ player }) => {
        const isStriker = player.id === strikerId;
        const isNonStriker = player.id === nonStrikerId;
        const isActive = isStriker || isNonStriker;
        
        let status = "Yet to Bat";
        if (player.isOut) {
            status = "Out";
        } else if (isActive) {
            status = "Not Out";
        } else if (player.ballsFaced > 0 || player.runs > 0) {
             status = "Not Out";
        }

        const shouldDisplay = isActive || player.isOut || player.ballsFaced > 0;
        if (!shouldDisplay) return null;

        return (
            <tr className={`border-b border-gray-200 dark:border-gray-700 ${isActive ? 'bg-green-50 dark:bg-gray-700/50' : ''}`}>
                <td className="py-3 px-4 text-dark-gray dark:text-gray-200 font-medium">
                    {player.name}{isStriker ? '*' : ''}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-left">{status}</td>
                <td className="py-3 px-4 text-center font-bold text-dark-gray dark:text-white">{player.runs}</td>
                <td className="py-3 px-4 text-center">{player.ballsFaced}</td>
                <td className="py-3 px-4 text-center">{calculateSR(player.runs, player.ballsFaced)}</td>
            </tr>
        );
    };

    const bowlers = bowlingTeamData.players.filter(p => p.ballsBowled > 0 || p.oversBowled > 0);

    return (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Scorecards */}
            <div className="lg:col-span-2 space-y-8">
                {/* Batting Scorecard */}
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                    <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">{battingTeamData.name} - Batting</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                           <thead>
                                <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <th className="py-2 px-4 text-left font-semibold">Batsman</th>
                                    <th className="py-2 px-4 text-left font-semibold">Status</th>
                                    <th className="py-2 px-4 text-center font-semibold">R</th>
                                    <th className="py-2 px-4 text-center font-semibold">B</th>
                                    <th className="py-2 px-4 text-center font-semibold">SR</th>
                                </tr>
                           </thead>
                            <tbody>
                                {battingTeamData.players.map(p => <BattingRow key={p.id} player={p} />)}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bowling Scorecard */}
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                    <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">{bowlingTeamData.name} - Bowling</h3>
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                             <thead>
                                <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <th className="py-2 px-4 text-left font-semibold">Bowler</th>
                                    <th className="py-2 px-4 text-center font-semibold">O</th>
                                    <th className="py-2 px-4 text-center font-semibold">R</th>
                                    <th className="py-2 px-4 text-center font-semibold">W</th>
                                    <th className="py-2 px-4 text-center font-semibold">Econ</th>
                                </tr>
                           </thead>
                            <tbody>
                            {bowlers.length > 0 ? bowlers.map(p => (
                                    <tr key={p.id} className={`border-b border-gray-200 dark:border-gray-700 ${p.id === bowlerId ? 'bg-green-50 dark:bg-gray-700/50' : ''}`}>
                                        <td className="py-3 px-4 text-dark-gray dark:text-gray-200 font-medium">
                                            {p.name}{p.id === bowlerId ? '*' : ''}
                                        </td>
                                        <td className="text-center">{p.oversBowled}.{p.ballsBowled}</td>
                                        <td className="text-center">{p.runsConceded}</td>
                                        <td className="text-center font-bold text-dark-gray dark:text-white">{p.wicketsTaken}</td>
                                        <td className="text-center">{calculateEcon(p.runsConceded, p.oversBowled, p.ballsBowled)}</td>
                                    </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">No bowlers yet.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right Column: Over History */}
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700 self-start">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">This Over</h3>
                {currentOverHistory.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {currentOverHistory.map((event, i) => {
                      const isWicket = event.startsWith('W');
                      const isFour = event.includes('4');
                      const isSix = event.includes('6');
                      let bgColor = 'bg-gray-200 dark:bg-gray-600 text-dark-gray dark:text-gray-200';
                      if (isWicket) bgColor = 'bg-classic-red text-white';
                      else if (isFour) bgColor = 'bg-classic-blue text-white';
                      else if (isSix) bgColor = 'bg-dark-green text-white';

                      return (
                        <span 
                          key={i} 
                          className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm shadow-sm ${bgColor}`}
                        >
                          {event}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Waiting for the first ball...</p>
                )}
              </div>
        </div>
    );
};

export default PlayerStatsView;