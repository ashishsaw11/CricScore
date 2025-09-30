import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { WicketType, ExtraType, MatchStatus } from '../../types';
import * as client from '../../websocket-client';

const AddPlayerInput: React.FC<{
  team: 'teamA' | 'teamB';
  teamName: string;
}> = ({ team, teamName }) => {
  const [playerName, setPlayerName] = useState('');
  const [playerNickname, setPlayerNickname] = useState('');

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      client.addPlayer({ team, playerName: playerName.trim(), nickname: playerNickname.trim() });
      setPlayerName('');
      setPlayerNickname('');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-2">
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder={`New player for ${teamName}`}
        className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
      />
      <input
        type="text"
        value={playerNickname}
        onChange={(e) => setPlayerNickname(e.target.value)}
        placeholder="Nickname (optional)"
        className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
      />
      <button
        onClick={handleAddPlayer}
        className="px-4 py-2 bg-classic-blue text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
      >
        Add
      </button>
    </div>
  );
};


const ScoreUpdater: React.FC = () => {
    const { serverState } = useContext(AppContext);
    const { match, canUndo } = serverState;
    const { teamA, teamB, battingTeam, strikerId, nonStrikerId, bowlerId, currentOverHistory, isPaused, status } = match;

    const battingTeamKey = battingTeam;
    const bowlingTeamKey = battingTeam === 'teamA' ? 'teamB' : 'teamA';
    const battingTeamData = match[battingTeamKey];
    const bowlingTeamData = match[bowlingTeamKey];

    // Local state for dropdowns
    const [selectedStriker, setSelectedStriker] = useState<string>('');
    const [selectedNonStriker, setSelectedNonStriker] = useState<string>('');
    const [selectedBowler, setSelectedBowler] = useState<string>('');

    // New state for handling no-ball + runs
    const [isNoBallMode, setIsNoBallMode] = useState(false);
    const [isRunOutModalOpen, setIsRunOutModalOpen] = useState(false);
    const [runOutRuns, setRunOutRuns] = useState<number>(0);


    const handleSetInitialPlayers = () => {
        if (!selectedStriker || !selectedNonStriker || !selectedBowler) return;
        client.updatePlayerSelection({
            strikerId: Number(selectedStriker),
            nonStrikerId: Number(selectedNonStriker),
            bowlerId: Number(selectedBowler)
        });
    };
    
    const handleSetNewBatsman = () => {
        if (!selectedStriker) return;
        client.updatePlayerSelection({ 
            strikerId: Number(selectedStriker),
            nonStrikerId: nonStrikerId // Keep the existing non-striker
        });
        setSelectedStriker('');
    };

    const handleSetNewNonStriker = () => {
        if (!selectedNonStriker) return;
        client.updatePlayerSelection({ 
            nonStrikerId: Number(selectedNonStriker),
            strikerId: strikerId // Keep the existing striker
        });
        setSelectedNonStriker('');
    };

    const handleSetNewBowler = () => {
        if (!selectedBowler) return;
        client.updatePlayerSelection({ bowlerId: Number(selectedBowler) });
        setSelectedBowler('');
    };

    const handleRecordBall = (runs: number, extra?: ExtraType, wicketType?: WicketType) => {
        if (wicketType === 'run out') {
            setIsRunOutModalOpen(true);
            return;
        }
        client.recordBall({ runs, extra, wicketType });
        setIsNoBallMode(false); // Reset mode after any ball is recorded
    };

    const handleConfirmRunOut = (batsmanId: number | null, runs: number) => {
        if (batsmanId) {
            client.recordBall({
                runs,
                wicketType: 'run out',
                batsmanOutId: batsmanId,
            });
        }
        setIsRunOutModalOpen(false);
        setRunOutRuns(0);
    };

    const handleNoBallClick = () => {
        setIsNoBallMode(!isNoBallMode);
    };

    const handleUndoLastBall = () => {
        if (window.confirm('Are you sure you want to undo the last recorded ball? This cannot be reversed.')) {
            client.undoLastBall();
        }
    };

    const striker = battingTeamData.players.find(p => p.id === strikerId);
    const nonStriker = battingTeamData.players.find(p => p.id === nonStrikerId);
    const bowler = bowlingTeamData.players.find(p => p.id === bowlerId);

    const RunOutModal = () => (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Run Out Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Runs Completed</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(runs => (
                                <button
                                    key={runs}
                                    onClick={() => setRunOutRuns(runs)}
                                    className={`p-3 rounded font-semibold transition-colors ${runOutRuns === runs ? 'bg-classic-green text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                                >
                                    {runs}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Who was out?</label>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleConfirmRunOut(strikerId, runOutRuns)}
                                className="w-full p-3 bg-classic-blue text-white rounded hover:bg-blue-700 font-semibold"
                            >
                                {striker?.name} (Striker)
                            </button>
                            <button
                                onClick={() => handleConfirmRunOut(nonStrikerId, runOutRuns)}
                                className="w-full p-3 bg-classic-blue text-white rounded hover:bg-blue-700 font-semibold"
                            >
                                {nonStriker?.name} (Non-Striker)
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRunOutModalOpen(false)}
                        className="text-gray-600 dark:text-gray-400 hover:underline"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
    
    
    const isOverlayVisible = isPaused || status === MatchStatus.SUSPENDED;
    const overlayText = status === MatchStatus.SUSPENDED ? "Match Suspended" : "Match Paused";

    // FIX: Changed type from JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const wrapWithOverlay = (content: React.ReactElement) => (
        <div className="relative mt-8">
            {isOverlayVisible && (
                <div className="absolute inset-0 bg-gray-500/50 dark:bg-gray-900/70 flex items-center justify-center z-10 rounded-lg">
                    <p className="text-white text-2xl font-bold bg-black/50 px-6 py-3 rounded-md">{overlayText}</p>
                </div>
            )}
            <div className={isOverlayVisible ? 'blur-sm pointer-events-none' : ''}>
                {content}
            </div>
        </div>
    );

    // Check if the first innings is over
    const isFirstInningOver =
        match.status === MatchStatus.IN_PROGRESS &&
        match.currentInning === 1 &&
        (battingTeamData.wickets >= 10 || (battingTeamData.overs >= match.totalOvers && match.totalOvers > 0));

    if (isFirstInningOver) {
        return (
            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700 text-center">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-2">First Innings Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {battingTeamData.name} scored {battingTeamData.score} for {battingTeamData.wickets} wickets.
                </p>
                <button
                    onClick={() => client.switchSides()}
                    className="w-full max-w-xs mx-auto bg-classic-blue text-white font-bold py-3 rounded-md hover:bg-blue-700 transition-colors duration-300"
                >
                    Start Second Innings
                </button>
            </div>
        );
    }

    // Initial player selection for the innings
    if (strikerId === null && nonStrikerId === null) {
        const tossWinnerName = match.tossWinner === 'teamA' ? teamA.name : teamB.name;
        
        const content = (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-2 text-center">
                    {match.currentInning === 1 ? "Select Opening Players" : "Select Next Innings Players"}
                </h3>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    {match.currentInning === 1 ? 
                        `${tossWinnerName} won the toss and chose to ${match.choseTo}.` :
                        `Target to win is ${match.targetScore}.`
                    }
                    <br/>
                    <strong>{battingTeamData.name}</strong> will be batting.
                </p>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Striker</label>
                        <select value={selectedStriker} onChange={e => setSelectedStriker(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 border border-medium-gray rounded-md">
                            <option value="">Select Batsman</option>
                            {battingTeamData.players.filter(p => !p.isOut && p.id !== Number(selectedNonStriker)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <AddPlayerInput team={battingTeamKey} teamName={battingTeamData.name} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Non-Striker</label>
                        <select value={selectedNonStriker} onChange={e => setSelectedNonStriker(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 border border-medium-gray rounded-md">
                            <option value="">Select Batsman</option>
                            {battingTeamData.players.filter(p => !p.isOut && p.id !== Number(selectedStriker)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Bowler</label>
                        <select value={selectedBowler} onChange={e => setSelectedBowler(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 border border-medium-gray rounded-md">
                             <option value="">Select Bowler</option>
                            {bowlingTeamData.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <AddPlayerInput team={bowlingTeamKey} teamName={bowlingTeamData.name} />
                    </div>
                    <button onClick={handleSetInitialPlayers} className="w-full bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green">Confirm Players</button>
                 </div>
            </div>
        );
        return wrapWithOverlay(content);
    }
    
    // UI for selecting new batsman after wicket
    if (strikerId === null && nonStrikerId !== null) {
         const availableBatsmen = battingTeamData.players.filter(p => !p.isOut && p.id !== nonStrikerId);
         const content = (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                 <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Select New Batsman</h3>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Batsman</label>
                      <select value={selectedStriker} onChange={e => setSelectedStriker(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 border border-medium-gray rounded-md">
                          <option value="">Select Batsman</option>
                          {availableBatsmen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <AddPlayerInput team={battingTeamKey} teamName={battingTeamData.name} />
                  </div>
                  <button onClick={handleSetNewBatsman} className="mt-4 w-full bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green">Confirm Batsman</button>
             </div>
         );
         return wrapWithOverlay(content);
    }

    // UI for selecting new batsman after wicket (non-striker)
    if (nonStrikerId === null && strikerId !== null) {
        const availableBatsmen = battingTeamData.players.filter(p => !p.isOut && p.id !== strikerId);

        if (availableBatsmen.length === 1) {
            client.updatePlayerSelection({ nonStrikerId: availableBatsmen[0].id });
            return (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                    <p className="text-center">Automatically selected {availableBatsmen[0].name} as the new batsman.</p>
                </div>
            );
        }

        const content = (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                 <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Select New Batsman</h3>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Batsman</label>
                      <select value={selectedNonStriker} onChange={e => setSelectedNonStriker(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 border border-medium-gray rounded-md">
                          <option value="">Select Batsman</option>
                          {availableBatsmen.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <AddPlayerInput team={battingTeamKey} teamName={battingTeamData.name} />
                  </div>
                  <button onClick={handleSetNewNonStriker} className="mt-4 w-full bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green">Confirm Batsman</button>
             </div>
         );
         return wrapWithOverlay(content);
    }

    // UI for selecting new bowler after over
    if (bowlerId === null) {
        const content = (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                 <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Select New Bowler</h3>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Bowler</label>
                      <select value={selectedBowler} onChange={e => setSelectedBowler(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 border border-medium-gray rounded-md">
                          <option value="">Select Bowler</option>
                          {bowlingTeamData.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <AddPlayerInput team={bowlingTeamKey} teamName={bowlingTeamData.name} />
                  </div>
                  <button onClick={handleSetNewBowler} className="mt-4 w-full bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green">Confirm Bowler</button>
             </div>
        );
        return wrapWithOverlay(content);
    }

    // Main scoring panel
    const content = (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
             <div className="mb-4">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-2 text-center">Live Scoring</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 text-center gap-2">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Striker</p>
                        <p className="font-bold">{striker?.name}*</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Non-Striker</p>
                        <p className="font-bold">{nonStriker?.name}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bowler</p>
                        <p className="font-bold">{bowler?.name}</p>
                    </div>
                </div>
             </div>

            <div className="mb-4 p-3 bg-light-gray dark:bg-gray-700 rounded-md">
                <h4 className="font-bold mb-1">This Over:</h4>
                <div className="flex flex-wrap gap-2">
                    {currentOverHistory.map((event, i) => <span key={i} className="bg-white dark:bg-gray-800 border text-sm px-2 py-1 rounded-full">{event}</span>)}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-center mb-2 text-gray-600 dark:text-gray-400">
                        {isNoBallMode ? 'Runs off bat (+1 for No-Ball penalty)' : 'Runs'}
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map(run => (
                            <button 
                                key={run} 
                                onClick={() => handleRecordBall(run, isNoBallMode ? 'noball' : undefined)} 
                                className={`p-3 rounded font-semibold transition-colors ${
                                    isNoBallMode 
                                    ? 'bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200' 
                                    : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                                }`}
                            >
                                {run}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-center mb-2 text-gray-600 dark:text-gray-400">Extras</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => handleRecordBall(0, 'wide')} className="p-3 bg-classic-blue text-white rounded hover:bg-blue-700 font-semibold">Wide</button>
                        <button 
                            onClick={handleNoBallClick} 
                            className={`p-3 bg-classic-blue text-white rounded hover:bg-blue-700 font-semibold transition-all ${isNoBallMode ? 'ring-2 ring-offset-2 ring-yellow-400 dark:ring-yellow-500' : ''}`}
                        >
                            No-ball
                        </button>
                        <button onClick={() => handleRecordBall(0, 'deadball')} className="p-3 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold">Dead-ball</button>
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-center mb-2 text-gray-600 dark:text-gray-400">Wicket</h4>
                     <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => handleRecordBall(0, isNoBallMode ? 'noball' : undefined, 'bowled')} 
                            className="p-3 bg-classic-red text-white rounded hover:bg-red-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={isNoBallMode}
                            title={isNoBallMode ? 'Cannot be out bowled on a no-ball' : ''}
                        >
                            W (bowled)
                        </button>
                        <button 
                            onClick={() => handleRecordBall(0, isNoBallMode ? 'noball' : undefined, 'caught')} 
                            className="p-3 bg-classic-red text-white rounded hover:bg-red-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={isNoBallMode}
                            title={isNoBallMode ? 'Cannot be out caught on a no-ball' : ''}
                        >
                            C (catch)
                        </button>
                        <button 
                            onClick={() => handleRecordBall(0, isNoBallMode ? 'noball' : undefined, 'run out')} 
                            className="p-3 bg-classic-red text-white rounded hover:bg-red-700 font-semibold"
                        >
                            R (run out)
                        </button>
                    </div>
                </div>
            </div>
             <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                    onClick={handleUndoLastBall}
                    disabled={!canUndo}
                    className="w-full p-3 bg-gray-500 text-white rounded font-semibold transition-colors hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    title={!canUndo ? "No delivery has been recorded to undo" : "Revert the last delivery"}
                >
                    Undo Last Ball
                </button>
            </div>
         </div>
    );
    const finalContent = wrapWithOverlay(content);

    return (
        <>
            {isRunOutModalOpen && <RunOutModal />}
            {finalContent}
        </>
    );
};

export default ScoreUpdater;