import { AppState, MatchStatus, Team } from './types';

// Keep only team-level initial state (player objects are created on server and synced)
const initialTeamState: Omit<Team, 'name' | 'players'> = {
    score: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
};

export const getInitialState = (): AppState => {
    const savedTheme = (typeof window !== 'undefined') ? localStorage.getItem('theme') as 'light' | 'dark' | null : null;
    return {
        viewerCount: 0,
        theme: savedTheme || 'light',
        canUndo: false,
        matchHistory: [],
        match: {
            teamA: { ...initialTeamState, name: 'Team A', players: [] },
            teamB: { ...initialTeamState, name: 'Team B', players: [] },
            battingTeam: 'teamA',
            scheduledTime: '',
            status: MatchStatus.NOT_STARTED,
            tossWinner: null,
            choseTo: null,
            totalOvers: 0,
            strikerId: null,
            nonStrikerId: null,
            bowlerId: null,
            currentOverHistory: [],
            targetScore: 0,
            currentInning: 1,
            resultMessage: null,
            isPaused: false,
            liveCommentary: '',
            commentaryHistory: [],
            actionHistory: [],
        },
    };
};