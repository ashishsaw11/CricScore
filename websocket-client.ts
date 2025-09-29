import { AppState, ExtraType, MatchState, Player, WicketType } from './types';
import { WEBSOCKET_URL } from './config';

let socket: WebSocket | null = null;
let reconnectInterval: number | null = null;
const RECONNECT_DELAY = 3000; // 3 seconds

interface Callbacks {
  onUpdate: (newState: AppState) => void;
  onError: () => void;
  onConnect: () => void;
}

let callbacks: Callbacks | null = null;

const connectSocket = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (callbacks) {
        callbacks.onConnect();
    }

    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    socket.onmessage = (event) => {
        try {
            const newState = JSON.parse(event.data);
            if (callbacks) {
                callbacks.onUpdate(newState);
            }
        } catch (error) {
            console.error('Error parsing message from server:', error);
        }
    };

    socket.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        if (callbacks) {
            callbacks.onError();
        }
        if (!reconnectInterval) {
            reconnectInterval = window.setInterval(() => {
                connectSocket();
            }, RECONNECT_DELAY);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (callbacks) {
            callbacks.onError();
        }
        socket?.close(); // This will trigger onclose and reconnection logic
    };
};


export const connect = (cbs: Callbacks) => {
    callbacks = cbs;
    connectSocket();
};

const sendMessage = (type: string, payload?: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type, payload }));
    } else {
        console.warn('WebSocket is not connected. Message not sent:', { type, payload });
    }
};

// --- API Functions ---
export const login = (payload: { role: string; details?: { name: string } }) => sendMessage('login', payload);
export const logout = () => sendMessage('logout');
export const toggleTheme = () => sendMessage('toggleTheme');
export const setupMatch = (payload: { teamAName: string; teamBName: string; scheduledTime: string; teamAPlayers: Player[]; teamBPlayers: Player[] }) => sendMessage('setupMatch', payload);
export const startMatch = (payload: { tossWinner: 'teamA' | 'teamB'; choseTo: 'bat' | 'bowl'; totalOvers: number }) => sendMessage('startMatch', payload);
export const updatePlayerSelection = (payload: { strikerId?: number; nonStrikerId?: number; bowlerId?: number }) => sendMessage('updatePlayerSelection', payload);
export const recordBall = (payload: { runs: number; extra?: ExtraType; wicketType?: WicketType }) => sendMessage('recordBall', payload);
export const undoLastBall = () => sendMessage('undoLastBall');
export const addPlayer = (payload: { team: 'teamA' | 'teamB'; playerName: string }) => sendMessage('addPlayer', payload);
export const switchSides = () => sendMessage('switchSides');
export const togglePauseMatch = () => sendMessage('togglePauseMatch');
export const suspendMatch = () => sendMessage('suspendMatch');
export const resumeMatch = () => sendMessage('resumeMatch');
export const endMatch = () => sendMessage('endMatch');
export const resetMatch = () => sendMessage('resetMatch');
export const loadMatch = (match: MatchState) => sendMessage('loadMatch', match);
export const clearMatchHistory = () => sendMessage('clearMatchHistory');