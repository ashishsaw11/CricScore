export interface Player {
  id: number;
  name: string;
  nickname?: string;
}

export interface PlayerStats extends Player {
    // Batting stats
    runs: number;
    ballsFaced: number;
    isOut: boolean;
    // Bowling stats
    oversBowled: number;
    ballsBowled: number;
    runsConceded: number;
    wicketsTaken: number;
}


export interface Team {
  name: string;
  players: PlayerStats[];
  score: number;
  wickets: number;
  overs: number;
  balls: number;
}

export enum MatchStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  FINISHED = "Finished",
  SUSPENDED = "Suspended",
}

export type WicketType = 'bowled' | 'caught' | 'run out';
export type ExtraType = 'wide' | 'noball' | 'deadball';


export interface MatchState {
  _id?: string;
  teamA: Team;
  teamB: Team;
  battingTeam: 'teamA' | 'teamB';
  scheduledTime: string;
  status: MatchStatus;
  tossWinner: 'teamA' | 'teamB' | null;
  choseTo: 'bat' | 'bowl' | null;
  totalOvers: number;
  strikerId: number | null;
  nonStrikerId: number | null;
  bowlerId: number | null;
  currentOverHistory: string[];
  isPaused?: boolean;
  // New state for innings management
  targetScore: number;
  currentInning: 1 | 2;
  // New state for final result
  resultMessage: string | null;
  // Add a completedAt field for sorting history
  completedAt?: string;
  // Add a history of admin actions
  actionHistory?: { timestamp: string; action: string }[];
  // FIX: Add commentary fields for the live commentary feature.
  liveCommentary?: string;
  commentaryHistory?: string[];
}

export type UserRole = 'admin' | 'viewer' | null;

export interface AppState {
  viewerCount: number;
  match: MatchState;
  theme: 'light' | 'dark';
  canUndo?: boolean;
  matchHistory?: MatchState[];
}