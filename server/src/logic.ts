import { AppState, MatchStatus, Player, PlayerStats, UserRole, Team, ExtraType, WicketType, MatchState } from './types.js';

// This file contains the core application logic, adapted from the original backend/db.ts
// These functions are pure: they take a state object and payload, and return a new state object.

const initialTeamState: Omit<Team, 'name' | 'players'> = {
  score: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
};

const logAction = (state: AppState, action: string): AppState => {
    if (!state.match.actionHistory) {
        state.match.actionHistory = [];
    }
    state.match.actionHistory.unshift({ timestamp: new Date().toISOString(), action });
    // Keep the history to a reasonable size
    if (state.match.actionHistory.length > 20) {
        state.match.actionHistory.pop();
    }
    return state;
}

export const getInitialState = (): AppState => {
    return {
        viewerCount: 0,
        theme: 'light',
        canUndo: false,
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
            actionHistory: [],
            // FIX: Initialize commentary fields.
            liveCommentary: '',
            commentaryHistory: [],
        },
    };
};

export const setupMatch = (state: AppState, payload: { teamAName: string; teamBName: string; scheduledTime: string; teamAPlayers: Player[]; teamBPlayers: Player[] }): AppState => {
    const { teamAName, teamBName, scheduledTime, teamAPlayers = [], teamBPlayers = [] } = payload;
    const mapToPlayerStats = (players: Player[]): PlayerStats[] => players.map(p => ({
        ...p, runs: 0, ballsFaced: 0, isOut: false, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0,
    }));
    state.match = {
        ...getInitialState().match,
        teamA: { ...initialTeamState, name: teamAName, players: mapToPlayerStats(teamAPlayers) },
        teamB: { ...initialTeamState, name: teamBName, players: mapToPlayerStats(teamBPlayers) },
        scheduledTime: scheduledTime,
        status: MatchStatus.NOT_STARTED,
    };
    logAction(state, `Match scheduled: ${teamAName} vs ${teamBName}`);
    return state;
};

export const startMatch = (state: AppState, payload: { tossWinner: 'teamA' | 'teamB'; choseTo: 'bat' | 'bowl'; totalOvers: number }): AppState => {
    const { tossWinner, choseTo, totalOvers } = payload;
    let battingTeam: 'teamA' | 'teamB' = 'teamA';
    if ((tossWinner === 'teamA' && choseTo === 'bowl') || (tossWinner === 'teamB' && choseTo === 'bat')) {
        battingTeam = 'teamB';
    }
    state.match.status = MatchStatus.IN_PROGRESS;
    state.match.tossWinner = tossWinner;
    state.match.choseTo = choseTo;
    state.match.totalOvers = totalOvers;
    state.match.battingTeam = battingTeam;
    logAction(state, `Match started. Total overs: ${totalOvers}.`);
    return state;
};

export const addPlayer = (state: AppState, payload: { team: 'teamA' | 'teamB'; playerName: string; nickname?: string }): AppState => {
    const { team, playerName, nickname } = payload;
    const targetTeam = state.match[team];
    const maxId = Math.max(0, ...state.match.teamA.players.map((p: PlayerStats) => p.id), ...state.match.teamB.players.map((p: PlayerStats) => p.id));
    const newPlayer: PlayerStats = {
        id: maxId + 1, name: playerName, nickname: nickname, runs: 0, ballsFaced: 0, isOut: false, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0,
    };
    targetTeam.players.push(newPlayer);
    return state;
};

export const updatePlayerSelection = (state: AppState, payload: { strikerId?: number | null; nonStrikerId?: number | null; bowlerId?: number | null; }): AppState => {
    state.match = { ...state.match, ...payload };
    return state;
};

export const recordBall = (state: AppState, payload: { runs: number; extra?: ExtraType; wicketType?: WicketType; batsmanOutId?: number }): AppState => {
    try {
        console.log('recordBall payload:', payload);
    const { runs, extra, wicketType, batsmanOutId } = payload;
    const { match } = state;

    if (match.isPaused) return state; // Do not record ball if paused

    const battingTeamKey = match.battingTeam;
    const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
    const currentBattingTeam = match[battingTeamKey];
    const currentBowlingTeam = match[bowlingTeamKey];

    // CRITICAL FIX: Prevent scoring if the first innings is already over.
    // This stops invalid states where a team with 10 wickets can keep batting.
    if (match.currentInning === 1 && (currentBattingTeam.wickets >= 10 || (currentBattingTeam.overs >= match.totalOvers && match.totalOvers > 0))) {
        console.warn("Attempted to record a ball after the first innings has concluded. Action blocked.");
        return state;
    }
    
    let { strikerId, nonStrikerId, bowlerId } = match;

    let scoreToAdd = runs;
    let isBallValid = true;
    let eventDescription = '';
      
    if (extra) {
        if (extra === 'wide' || extra === 'noball') { scoreToAdd += 1; isBallValid = false; eventDescription = `${extra.charAt(0).toUpperCase()}`; }
        if (extra === 'deadball') { isBallValid = false; eventDescription = 'DB'; }
    }
    if (runs > 0) { eventDescription += eventDescription ? `+${runs}` : `${runs}`; } 
    else if (!extra && !wicketType) { eventDescription = '0'; }
    currentBattingTeam.score += scoreToAdd;
      
    let overJustEnded = false;
    if (isBallValid) {
        currentBattingTeam.balls += 1;
        if (currentBattingTeam.balls === 6) {
            currentBattingTeam.balls = 0;
            currentBattingTeam.overs += 1;
            [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
            overJustEnded = true;
            bowlerId = null; // New bowler needed
            match.currentOverHistory = []; // Clear history for new over
        }
    }

    if (wicketType) {
        currentBattingTeam.wickets += 1;
        eventDescription = `W`;
        const outPlayerId = batsmanOutId || strikerId;
        currentBattingTeam.players.forEach((p: PlayerStats) => { if(p.id === outPlayerId) p.isOut = true; });

        if (outPlayerId === strikerId) {
            strikerId = null;
        } else {
            nonStrikerId = null;
        }
    }

    if(!overJustEnded) {
        match.currentOverHistory.push(eventDescription);
    }
      
    currentBattingTeam.players.forEach((p: PlayerStats) => {
        if (p.id === strikerId && !wicketType) {
            if (extra !== 'wide') { p.runs += runs; }
            if (isBallValid) { p.ballsFaced += 1; }
        }
    });
    currentBowlingTeam.players.forEach((p: PlayerStats) => {
        if (p.id === bowlerId) {
            p.runsConceded += scoreToAdd;
            if (wicketType && wicketType !== 'run out') { p.wicketsTaken += 1; }
            if (isBallValid) {
                p.ballsBowled += 1;
                if (p.ballsBowled === 6) { p.ballsBowled = 0; p.oversBowled += 1; }
            }
        }
    });

    if (extra !== 'wide' && runs % 2 !== 0 && runs < 7) { 
        [strikerId, nonStrikerId] = [nonStrikerId, strikerId]; 
    }
    
    // Check for match end in second inning
    if (match.currentInning === 2) {
        const isChaseComplete = currentBattingTeam.score >= match.targetScore;
        const areOversFinished = currentBattingTeam.overs >= match.totalOvers;
        const areAllOut = currentBattingTeam.wickets >= 10;
        if (isChaseComplete || areOversFinished || areAllOut) {
            match.status = MatchStatus.FINISHED;
            if (isChaseComplete) match.resultMessage = `${currentBattingTeam.name} won by ${10 - currentBattingTeam.wickets} wickets.`;
            else if (currentBattingTeam.score === match.targetScore - 1) match.resultMessage = "Match Drawn.";
            else match.resultMessage = `${currentBowlingTeam.name} won by ${(match.targetScore - 1) - currentBattingTeam.score} runs.`;
            logAction(state, `Match finished. ${match.resultMessage}`);
        }
    }
      
    state.match.strikerId = strikerId;
    state.match.nonStrikerId = nonStrikerId;
    state.match.bowlerId = bowlerId;
    return state;
    } catch (error) {
        console.error('Error in recordBall:', error);
        return state; // Return the original state to prevent a crash
    }
};

export const switchSides = (state: AppState): AppState => {
    const firstInningScore = state.match[state.match.battingTeam].score;
    state.match.battingTeam = state.match.battingTeam === 'teamA' ? 'teamB' : 'teamA';
    state.match.targetScore = firstInningScore + 1;
    state.match.currentInning = 2;
    state.match.strikerId = null;
    state.match.nonStrikerId = null;
    state.match.bowlerId = null;
    state.match.currentOverHistory = [];
    logAction(state, `End of 1st Innings. Target set: ${state.match.targetScore}`);
    return state;
};

export const endMatch = (state: AppState): AppState => {
    state.match.status = MatchStatus.FINISHED;
    state.match.resultMessage = state.match.resultMessage || "Match Concluded by Admin.";
    logAction(state, 'Match ended by Admin.');
    return state;
};

export const resetMatch = (state: AppState): AppState => {
    const initialState = getInitialState();
    state.match = initialState.match;
    logAction(state, 'Scoreboard cleared for new match setup.');
    return state;
};

export const toggleTheme = (state: AppState): AppState => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    return state;
};

export const togglePauseMatch = (state: AppState): AppState => {
    if (state.match.status === MatchStatus.IN_PROGRESS) {
        state.match.isPaused = !state.match.isPaused;
        const action = state.match.isPaused ? 'Match paused.' : 'Match resumed from pause.';
        logAction(state, action);
    }
    return state;
};

export const suspendMatch = (state: AppState): AppState => {
    if (state.match.status === MatchStatus.IN_PROGRESS) {
        state.match.status = MatchStatus.SUSPENDED;
        state.match.isPaused = false; // A suspended match is not paused
        state.match.resultMessage = "Match Suspended by Admin.";
        logAction(state, 'Match suspended by Admin.');
    }
    return state;
};

export const resumeMatch = (state: AppState): AppState => {
    if (state.match.status === MatchStatus.SUSPENDED) {
        state.match.status = MatchStatus.IN_PROGRESS;
        state.match.resultMessage = null;
        logAction(state, 'Match resumed from suspension.');
    }
    return state;
};

export const loadMatch = (state: AppState, historicMatch: MatchState): AppState => {
    const newState = JSON.parse(JSON.stringify(state));
    newState.match = historicMatch;
    newState.canUndo = false;

    // A loaded match, whether finished or suspended, should not be in a "paused" state by default.
    // The admin can pause it again if they resume it.
    newState.match.isPaused = false;
    logAction(newState, `Historic match loaded: ${historicMatch.teamA.name} vs ${historicMatch.teamB.name}`);
    
    return newState;
};

export const clearMatchHistory = (state: AppState): AppState => {
    state.matchHistory = [];
    logAction(state, 'Match history cleared by Admin.');
    return state;
};