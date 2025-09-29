import React, { useContext } from 'react';
import { AppContext } from '../../App';

const ActionHistory: React.FC = () => {
    const { serverState } = useContext(AppContext);
    const { match } = serverState;
    const { actionHistory } = match;

    if (!actionHistory || actionHistory.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
                <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-2">Action History</h3>
                <p className="text-gray-500 dark:text-gray-400">No administrative actions have been recorded for this match yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
            <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4">Action History</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {actionHistory.map((log, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                        <p className="text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="font-medium text-dark-gray dark:text-gray-300">
                            {log.action}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActionHistory;
