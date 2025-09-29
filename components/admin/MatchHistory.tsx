import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import * as client from '../../websocket-client';
import { MatchState } from '../../types';
import Modal from '../common/Modal';
import { ADMIN_ACTION_PASSWORD } from '../../constants';
import { exportMatchStateToCsv } from '../common/csvExporter';

const MatchHistory: React.FC = () => {
    const { serverState } = useContext(AppContext);
    const { matchHistory } = serverState;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleLoadMatch = (match: MatchState) => {
        if (window.confirm('Are you sure you want to load this historic match? Any unsaved progress in the current match will be lost.')) {
            client.loadMatch(match);
        }
    };

    const handleDownloadScorecard = (match: MatchState) => {
        exportMatchStateToCsv(match);
    };

    const handleOpenClearHistoryModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setPassword('');
        setPasswordError('');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_ACTION_PASSWORD) {
            client.clearMatchHistory();
            handleCloseModal();
        } else {
            setPasswordError('Incorrect password.');
        }
    };

    if (!matchHistory || matchHistory.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Match History</h3>
                <p className="text-gray-600 dark:text-gray-400">No completed or suspended matches found in history.</p>
            </div>
        );
    }

    return (
        <>
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Confirm Clear History"
            >
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This action will permanently delete all match history. This cannot be undone. Please enter the admin action password to proceed.
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
                            className={`w-full px-4 py-2 bg-white dark:bg-gray-700 border border-medium-gray dark:border-gray-600 rounded-md text-dark-gray dark:text-gray-200 focus:ring-2 focus:outline-none focus:ring-classic-red`}
                            autoFocus
                        />
                    </div>
                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                    <button
                        type="submit"
                        className={`w-full font-bold py-2 rounded-md transition-colors duration-300 bg-classic-red text-white hover:brightness-90`}
                    >
                        Clear
                    </button>
                </form>
            </Modal>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200">Match History</h3>
                    <button
                        onClick={handleOpenClearHistoryModal}
                        className="bg-classic-red text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-300 text-sm"
                        title="Permanently delete all match history"
                    >
                        Clear All History
                    </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {matchHistory.map((match) => (
                        <div key={match._id || match.scheduledTime} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                                <p className="font-bold text-dark-gray dark:text-gray-200">{match.teamA.name} vs {match.teamB.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {match.status} - {match.completedAt ? new Date(match.completedAt).toLocaleString() : new Date(match.scheduledTime).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{match.resultMessage}</p>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => handleLoadMatch(match)}
                                    className="flex-1 bg-classic-blue text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
                                >
                                    Load Match
                                </button>
                                <button
                                    onClick={() => handleDownloadScorecard(match)}
                                    className="flex-1 bg-classic-green text-white font-semibold py-2 px-4 rounded-md hover:bg-dark-green transition-colors duration-300"
                                >
                                    Download Scorecard
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default MatchHistory;