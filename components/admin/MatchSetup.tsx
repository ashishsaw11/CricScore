import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../App';
import { MatchStatus, Player } from '../../types';
import * as client from '../../websocket-client';
import Modal from '../common/Modal';
import { ADMIN_ACTION_PASSWORD } from '../../constants';

type ModalAction = 'delete';

const MatchSetup: React.FC = () => {
  const { serverState } = useContext(AppContext);
  const { match } = serverState;

  // Form state for scheduling/editing
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [teamAPlayersStr, setTeamAPlayersStr] = useState('');
  const [teamBPlayersStr, setTeamBPlayersStr] = useState('');
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [showTossSetup, setShowTossSetup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Form state for toss and overs
  const [tossWinner, setTossWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [choseTo, setChoseTo] = useState<'bat' | 'bowl'>('bat');
  const [totalOvers, setTotalOvers] = useState(20);

  // Computed match states
  const isMatchScheduled = match.status === MatchStatus.NOT_STARTED && !!match.scheduledTime;
  const isMatchInProgress = match.status === MatchStatus.IN_PROGRESS;
  const isMatchFinished = match.status === MatchStatus.FINISHED;
  const isMatchSuspended = match.status === MatchStatus.SUSPENDED;
  const isFormVisible = (!isMatchScheduled && !isMatchInProgress && !isMatchFinished && !isMatchSuspended) || isEditing;
  
  useEffect(() => {
    if (match.teamA.name) setTeamAName(match.teamA.name);
    if (match.teamB.name) setTeamBName(match.teamB.name);
  }, [match.teamA.name, match.teamB.name]);

  const handleEditClick = () => {
    setTeamAName(match.teamA.name);
    setTeamBName(match.teamB.name);
    
    const fullDate = new Date(match.scheduledTime);
    const dateStr = fullDate.toISOString().split('T')[0];
    const timeStr = fullDate.toTimeString().split(' ')[0].substring(0, 5);
    setScheduledDate(dateStr);
    setScheduledTime(timeStr);

    setTeamAPlayersStr(match.teamA.players.map(p => p.name).join(', '));
    setTeamBPlayersStr(match.teamB.players.map(p => p.name).join(', '));
    setIsEditing(true);
  };

  const handleScheduleOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime) {
      alert('Please select a valid date and time.');
      return;
    }

    const parsePlayers = (str: string): Player[] =>
      str
        .split(',')
        .map((name, index) => ({ id: index + 1, name: name.trim() }))
        .filter((p) => p.name);

    client.setupMatch({
      teamAName,
      teamBName,
      scheduledTime: `${scheduledDate}T${scheduledTime}`,
      teamAPlayers: parsePlayers(teamAPlayersStr),
      teamBPlayers: parsePlayers(teamBPlayersStr),
    });
    setIsEditing(false);
  };

  const handleFinalizeAndStart = () => {
      client.startMatch({ tossWinner, choseTo, totalOvers });
      setShowTossSetup(false);
  };

  const openConfirmationModal = (action: ModalAction) => {
    setModalAction(action);
    setIsModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setPassword('');
    setPasswordError('');
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_ACTION_PASSWORD) {
        switch(modalAction) {
            case 'delete': client.resetMatch(); break;
        }
        closeConfirmationModal();
    } else {
        setPasswordError('Incorrect password.');
    }
  };

  const getModalConfig = () => {
    switch(modalAction) {
      case 'delete': {
        const title = isMatchFinished ? 'Confirm Clear Scoreboard' : 'Confirm Delete Match';
        const buttonText = isMatchFinished ? 'Clear' : 'Confirm Deletion';
        return { title, buttonText, color: 'classic-red' };
      }
      default: return { title: '', buttonText: '', color: 'gray-500' };
    }
  };
  const modalConfig = getModalConfig();

  const isMatchToday = useMemo(() => {
    if (!match.scheduledTime) return false;
    const today = new Date();
    const matchDate = new Date(match.scheduledTime);
    return (
      today.getFullYear() === matchDate.getFullYear() &&
      today.getMonth() === matchDate.getMonth() &&
      today.getDate() === matchDate.getDate()
    );
  }, [match.scheduledTime]);

  const oversOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  if (showTossSetup) {
      return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
             <div className="space-y-4">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-2">Toss & Overs</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Toss Winner</label>
                    <select
                        value={tossWinner}
                        onChange={(e) => setTossWinner(e.target.value as 'teamA' | 'teamB')}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                    >
                        <option value="teamA">{teamAName}</option>
                        <option value="teamB">{teamBName}</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chose To</label>
                    <select
                        value={choseTo}
                        onChange={(e) => setChoseTo(e.target.value as 'bat' | 'bowl')}
                         className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                    >
                        <option value="bat">Bat</option>
                        <option value="bowl">Bowl</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Match Overs</label>
                    <select
                        value={totalOvers}
                        onChange={(e) => setTotalOvers(Number(e.target.value))}
                         className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                    >
                       {oversOptions.map(o => <option key={o} value={o}>{o} Overs</option>)}
                    </select>
                </div>
             </div>
             <button
                onClick={handleFinalizeAndStart}
                className="w-full mt-6 bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green transition-all duration-300"
             >
                 Finalize & Start Match
             </button>
        </div>
      )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
      
       <Modal
            isOpen={isModalOpen}
            onClose={closeConfirmationModal}
            title={modalConfig.title}
        >
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action requires confirmation. Please enter the admin action password to proceed.
                </p>
                <div>
                    <label htmlFor="adminPassword"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Password
                    </label>
                    <input
                        id="adminPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:outline-none focus:ring-${modalConfig.color}`}
                        autoFocus
                    />
                </div>
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                <button
                    type="submit"
                    className={`w-full font-bold py-2 rounded-md transition-colors duration-300 bg-${modalConfig.color} ${modalConfig.color === 'paused-yellow' ? 'text-black' : 'text-white'} hover:brightness-90`}
                >
                    {modalConfig.buttonText}
                </button>
            </form>
        </Modal>

      {(isMatchFinished || isMatchSuspended) && (
        <div className="text-center mb-6">
          <p className="font-semibold text-dark-gray dark:text-gray-200 mb-2">
            {isMatchFinished ? 'This match has concluded.' : 'This match has been suspended.'}
          </p>
          <button
            onClick={() => openConfirmationModal('delete')}
            className="w-full bg-classic-red text-white font-bold py-2 rounded-md hover:bg-red-700 transition-colors duration-300"
          >
            {isMatchFinished ? 'Clear Board & Schedule New Match' : 'Delete Suspended Match'}
          </button>
        </div>
      )}

      {isFormVisible && (
        <form onSubmit={handleScheduleOrUpdate} className="space-y-4">
          <fieldset>
            <legend className="text-lg font-bold text-dark-gray dark:text-gray-200 mb-2">
              {isEditing ? 'Edit Match Details' : 'Schedule a Match'}
            </legend>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team A Name</label>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team B Name</label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team A Players (Optional, comma-separated)</label>
                <textarea
                  value={teamAPlayersStr}
                  onChange={(e) => setTeamAPlayersStr(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                  placeholder="Player 1, Player 2, ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team B Players (Optional, comma-separated)</label>
                <textarea
                  value={teamBPlayersStr}
                  onChange={(e) => setTeamBPlayersStr(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                  placeholder="Player 1, Player 2, ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:ring-classic-green focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </fieldset>
          <div className="mt-4">
            {!isEditing ? (
              <button
                type="submit"
                className="w-full bg-classic-blue text-white font-bold py-2 rounded-md hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!scheduledDate || !scheduledTime}
              >
                Schedule Match
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green transition-colors duration-300"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-500 text-white font-bold py-2 rounded-md hover:bg-gray-600 transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {isMatchScheduled && !isEditing && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 rounded-lg">
             <h3 className="text-lg font-bold text-dark-green dark:text-green-300 mb-2">Match Scheduled</h3>
             <p className="text-dark-gray dark:text-gray-200"><span className="font-semibold">Teams:</span> {match.teamA.name} vs {match.teamB.name}</p>
             <p className="text-dark-gray dark:text-gray-200"><span className="font-semibold">Date & Time:</span> {new Date(match.scheduledTime).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="flex-1 bg-yellow-500 text-white font-bold py-2 rounded-md hover:bg-yellow-600 transition-colors duration-300"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => openConfirmationModal('delete')}
              className="flex-1 bg-classic-red text-white font-bold py-2 rounded-md hover:bg-red-700 transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={() => setShowTossSetup(true)}
            className="w-full bg-classic-green text-white font-bold py-2 rounded-md hover:bg-dark-green transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!isMatchToday}
            title={!isMatchToday ? 'Can only start match on the scheduled date' : 'Start the match now!'}
          >
            Start Match
          </button>
        </div>
      )}

    </div>
  );
};

export default MatchSetup;