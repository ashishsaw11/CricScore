import { AppState, MatchStatus, Team } from './types';

const initialTeamState: Omit<Team, 'name' | 'players'> = {
  score: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
};

export const getInitialState = (): AppState => {
    // Check for theme in local storage to provide persistence
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

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
            // FIX: Initialize commentary and action history fields to match server state.
            liveCommentary: '',
            commentaryHistory: [],
            actionHistory: [],
        },
    };
};