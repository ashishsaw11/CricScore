import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../../App';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';

const LiveCommentary: React.FC = () => {
    const { serverState } = useContext(AppContext);
    const { match } = serverState;
    const { liveCommentary, commentaryHistory } = match;

    const latestCommentaryRef = useRef<HTMLParagraphElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Animate new commentary
        if (latestCommentaryRef.current) {
            latestCommentaryRef.current.classList.add('animate-fade-in');
            const timer = setTimeout(() => {
                latestCommentaryRef.current?.classList.remove('animate-fade-in');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [liveCommentary]);

    useEffect(() => {
        // Auto-scroll to top
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [commentaryHistory]);


    if (!liveCommentary && (!commentaryHistory || commentaryHistory.length === 0)) {
        return null; // Don't render if there's nothing to show
    }

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-medium-gray dark:border-gray-700">
            <style>
                {`
                    @keyframes fade-in {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.5s ease-out forwards;
                    }
                `}
            </style>
            <h3 className="text-xl font-bold text-dark-gray dark:text-gray-200 mb-4 flex items-center">
                <MicrophoneIcon className="w-6 h-6 mr-3 text-classic-green" />
                Live Commentary
            </h3>
            
            <div className="space-y-4">
                {liveCommentary && (
                    <div className="p-4 bg-green-50 dark:bg-gray-700/50 border-l-4 border-classic-green rounded-r-lg">
                        <p ref={latestCommentaryRef} className="text-lg font-semibold text-dark-gray dark:text-gray-200">
                            {liveCommentary}
                        </p>
                    </div>
                )}
                
                {commentaryHistory && commentaryHistory.length > 0 && (
                     <div ref={scrollContainerRef} className="max-h-60 overflow-y-auto space-y-3 pr-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {commentaryHistory.map((comment, index) => {
                            const [over, ...textParts] = comment.split(': ');
                            const text = textParts.join(': ');
                            return (
                                <div key={index} className={`flex items-start gap-3 ${index > 0 ? 'opacity-70' : ''}`}>
                                    <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{over}</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{text}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveCommentary;
