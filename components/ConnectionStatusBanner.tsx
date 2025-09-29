import React, { useContext } from 'react';
import { AppContext } from '../App';

const ConnectionStatusBanner: React.FC = () => {
    const { connectionStatus } = useContext(AppContext);

    if (connectionStatus === 'connected') {
        return null; // Don't show anything when connected
    }

    let message: string;
    let bgColor: string;
    const textColor = 'text-white';

    switch (connectionStatus) {
        case 'connecting':
            message = 'Connecting to live scoreboard...';
            bgColor = 'bg-blue-500';
            break;
        case 'error':
            message = 'Connection failed. Attempting to reconnect...';
            bgColor = 'bg-classic-red';
            break;
        default:
            return null;
    }

    return (
        <div 
            className={`fixed top-0 left-0 right-0 p-2 text-center text-sm ${bgColor} ${textColor} z-50 shadow-lg`}
            role="alert"
            aria-live="assertive"
        >
            {message}
        </div>
    );
};

export default ConnectionStatusBanner;
