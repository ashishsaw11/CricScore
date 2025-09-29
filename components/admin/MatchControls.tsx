import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import * as client from '../../websocket-client';
import Modal from '../common/Modal';
import { ADMIN_ACTION_PASSWORD } from '../../constants';
import { MatchStatus } from '../../types';

type ControlAction = 'pause' | 'resume-paused' | 'suspend' | 'resume' | 'end';

const MatchControls: React.FC = () => {
    const { serverState } = useContext(AppContext);
    const { match } = serverState;
    const isMatchInProgress = match.status === MatchStatus.IN_PROGRESS;
    const isMatchSuspended = match.status === MatchStatus.SUSPENDED;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [controlAction, setControlAction] = useState<ControlAction | null>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const openConfirmationModal = (action: ControlAction) => {
        setControlAction(action);
        setIsModalOpen(true);
    };

    const closeConfirmationModal = () => {
        setIsModalOpen(false);
        setControlAction(null);
        setPassword('');
        setPasswordError('');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_ACTION_PASSWORD) {
            switch (controlAction) {
                case 'pause':
                case 'resume-paused':
                    client.togglePauseMatch(); 
                    break;
                case 'suspend': client.suspendMatch(); break;
                case 'end': client.endMatch(); break;
                case 'resume': client.resumeMatch(); break;
            }
            closeConfirmationModal();
        } else {
            setPasswordError('Incorrect password.');
        }
    };

    const getModalConfig = () => {
        switch (controlAction) {
            case 'pause': return { title: 'Confirm Pause Match', buttonText: 'Confirm Pause', color: 'paused-yellow' };
            case 'resume-paused': return { title: 'Confirm Resume Match', buttonText: 'Confirm Resume', color: 'classic-green' };
            case 'suspend': return { title: 'Confirm Suspend Match', buttonText: 'Confirm Suspend', color: 'suspended-orange' };
            case 'end': return { title: 'Confirm End Match', buttonText: 'Confirm End', color: 'classic-blue' };
            case 'resume': return { title: 'Confirm Resume Match', buttonText: 'Confirm Resume', color: 'classic-green' };
            default: return { title: '', buttonText: '', color: 'gray-500' };
        }
    };
    const modalConfig = getModalConfig();

    return (
        <>
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

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Match Controls</h3>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use these controls to manage the state of the live match. Actions require password confirmation.
                    </p>
                    <button
                        onClick={() => {
                            if (match.isPaused) {
                                openConfirmationModal('resume-paused');
                            } else {
                                openConfirmationModal('pause');
                            }
                        }}
                        disabled={!isMatchInProgress}
                        className={`w-full font-bold py-3 rounded-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed ${match.isPaused
                                ? 'bg-classic-green text-white hover:bg-dark-green'
                                : 'bg-paused-yellow text-black hover:bg-yellow-500'
                            }`}
                    >
                        {match.isPaused ? 'Resume Paused Match' : 'Pause Match'}
                    </button>
                    <button
                        onClick={() => openConfirmationModal('suspend')}
                        disabled={!isMatchInProgress}
                        className="w-full font-bold py-3 rounded-md transition-colors duration-300 bg-suspended-orange text-white hover:brightness-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Suspend Match
                    </button>
                    <button
                        onClick={() => openConfirmationModal('resume')}
                        disabled={!isMatchSuspended}
                        className="w-full font-bold py-3 rounded-md transition-colors duration-300 bg-classic-green text-white hover:bg-dark-green disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Resume Suspended Match
                    </button>
                    <button
                        onClick={() => openConfirmationModal('end')}
                        disabled={!isMatchInProgress && !isMatchSuspended}
                        className="w-full font-bold py-3 rounded-md transition-colors duration-300 bg-classic-blue text-white hover:brightness-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        End Match
                    </button>
                </div>
            </div>
        </>
    );
};

export default MatchControls;