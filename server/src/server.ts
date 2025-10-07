import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { ObjectId } from 'mongodb';
import express from 'express';
import path from 'path';
import { getInitialState, setupMatch, startMatch, addPlayer, updatePlayerSelection, recordBall, switchSides, endMatch, resetMatch, toggleTheme, togglePauseMatch, suspendMatch, resumeMatch, loadMatch, clearMatchHistory } from './logic.js';
import { connectDB, getDB } from './db.js';
import { AppState, MatchState } from './types.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
// ESM-compliant alternative to __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const PORT = process.env.PORT || 8080;

// --- Express App Setup ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        const userWs = ws as UserWebSocket;
        if (userWs.isAlive === false) return userWs.terminate();

        userWs.isAlive = false;
        userWs.ping(() => {});
    });
}, 30000);

wss.on('close', function close() {
    clearInterval(interval);
});

// Serve all static assets (index.html, bundle.js) from the 'dist' directory.
app.use(express.static(__dirname));


interface UserWebSocket extends WebSocket {
    role: 'admin' | 'viewer' | 'unknown';
    isAlive: boolean;
}

// Define a type for the singleton app state document to handle the string _id
interface AppStateSingleton extends Omit<AppState, 'matchHistory'> {
    _id: 'main';
}

let state: AppState = getInitialState();
// Simple undo buffer for one previous state
let undoState: AppState | null = null;
const clients = new Set<UserWebSocket>();

const saveStateToDB = async (currentState: AppState) => {
    try {
        const db = getDB();
        const appStateCollection = db.collection<AppStateSingleton>('appState');

        // Exclude matchHistory from the main state document being saved, as it's managed explicitly.
        const { matchHistory, ...mainState } = currentState;

        await appStateCollection.updateOne(
            { _id: 'main' },
            { $set: mainState },
            { upsert: true }
        );
    } catch (error) {
        console.error('Failed to save main app state to DB:', error);
    }
};

const loadStateFromDB = async () => {
    try {
        const db = getDB();
        const appStateCollection = db.collection<AppStateSingleton>('appState');
        const historyCollection = db.collection('matchHistory');

        const savedState = await appStateCollection.findOne({ _id: 'main' });
        const historyDocs = await historyCollection.find({}).sort({ completedAt: -1 }).limit(20).toArray();

        // Map database documents with ObjectId to application state with string _id
        const history: MatchState[] = historyDocs.map(doc => {
            const { _id, ...rest } = doc;
            return { ...rest, _id: _id.toString() } as MatchState;
        });

        if (savedState) {
            // Reconstruct the full AppState from the saved main state and the history
            const { _id, ...mainState } = savedState;
            state = { ...getInitialState(), ...mainState, matchHistory: history };
        } else {
            // If no main state, just load history
            state.matchHistory = history;
        }
        console.log('Successfully loaded state from DB.');
    } catch (error) {
        console.error('Failed to load state from DB. Using initial state.', error);
        state = getInitialState();
    }
};

const updateViewerCount = () => {
    const viewerCount = Array.from(clients).filter(c => c.role === 'viewer').length;
    state.viewerCount = viewerCount;
};

const broadcastState = () => {
    const stateString = JSON.stringify(state);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(stateString);
        }
    });
};

const updateState = (newState: AppState, saveToUndo = false) => {
    if (saveToUndo) {
        undoState = JSON.parse(JSON.stringify(state)); // Deep copy for undo
    } else {
        undoState = null; // Clear undo buffer if not an undoable action
    }
    state = newState;
    state.canUndo = undoState !== null;
    
    // Save the main app state and then broadcast everything to clients.
    saveStateToDB(state);
    broadcastState();
};

const archiveCurrentMatch = async (matchToArchive: MatchState) => {
    try {
        const db = getDB();
        const historyCollection = db.collection('matchHistory');
        
        const filter = { 
            scheduledTime: matchToArchive.scheduledTime, 
            'teamA.name': matchToArchive.teamA.name,
            'teamB.name': matchToArchive.teamB.name
        };
        
        // Remove _id if it exists, as we're upserting based on other fields. MongoDB will manage its _id.
        const { _id, ...updateData } = { ...matchToArchive, completedAt: new Date().toISOString() };
        
        await historyCollection.updateOne(filter, { $set: updateData }, { upsert: true });

    } catch (error) {
        console.error('Failed to archive match:', error);
    }
};

const reloadHistory = async (): Promise<MatchState[]> => {
    try {
        const db = getDB();
        const historyCollection = db.collection('matchHistory');
        const historyDocs = await historyCollection.find({}).sort({ completedAt: -1 }).limit(20).toArray();
        return historyDocs.map(doc => ({ ...doc, _id: doc._id.toString() } as unknown as MatchState));
    } catch (error) {
        console.error('Failed to reload history from DB:', error);
        return [];
    }
}


wss.on('connection', (ws: WebSocket) => {
    const userWs = ws as UserWebSocket;
    userWs.role = 'unknown';
    userWs.isAlive = true;
    userWs.on('pong', () => {
        userWs.isAlive = true;
    });
    clients.add(userWs);
    updateViewerCount();
    broadcastState(); // Send current state to new client and update viewer count for others

    userWs.on('message', async (message) => {
        try {
            const { type, payload } = JSON.parse(message.toString());
            let newState: AppState = JSON.parse(JSON.stringify(state)); // Deep copy current state

            switch (type) {
                case 'login':
                    if (payload.role === 'admin' || payload.role === 'viewer') {
                        userWs.role = payload.role;
                        updateViewerCount();
                        broadcastState();
                    }
                    break;
                case 'logout':
                    userWs.role = 'unknown';
                    updateViewerCount();
                    broadcastState();
                    break;
                case 'toggleTheme':
                    newState = toggleTheme(newState);
                    updateState(newState);
                    break;
                case 'setupMatch':
                    newState = setupMatch(newState, payload);
                    updateState(newState);
                    break;
                case 'startMatch':
                    newState = startMatch(newState, payload);
                    updateState(newState);
                    break;
                case 'addPlayer':
                    newState = addPlayer(newState, payload);
                    updateState(newState);
                    break;
                case 'updatePlayerSelection':
                    newState = updatePlayerSelection(newState, payload);
                    updateState(newState);
                    break;
                case 'recordBall':
                    newState = recordBall(newState, payload);
                    updateState(newState, true); // This action is undoable
                    break;
                case 'undoLastBall':
                    if (undoState) {
                        state = undoState; // No logic function, just revert
                        undoState = null;
                        state.canUndo = false;
                        // Save the reverted state and broadcast
                        saveStateToDB(state).then(broadcastState);
                    }
                    break;
                case 'switchSides':
                    newState = switchSides(newState);
                    updateState(newState);
                    break;
                case 'endMatch':
                    newState = endMatch(newState);
                    await archiveCurrentMatch(newState.match);
                    newState.matchHistory = await reloadHistory();
                    updateState(newState);
                    break;
                case 'resetMatch':
                    if (newState.match.status === 'Finished' || newState.match.status === 'Suspended') {
                        await archiveCurrentMatch(newState.match);
                        newState.matchHistory = await reloadHistory();
                    }
                    newState = resetMatch(newState);
                    updateState(newState);
                    break;
                case 'togglePauseMatch':
                    newState = togglePauseMatch(newState);
                    updateState(newState);
                    break;
                case 'suspendMatch':
                    newState = suspendMatch(newState);
                    await archiveCurrentMatch(newState.match);
                    newState.matchHistory = await reloadHistory();
                    updateState(newState);
                    break;
                case 'resumeMatch':
                    newState = resumeMatch(newState);
                    updateState(newState);
                    break;
                case 'loadMatch':
                    newState = loadMatch(newState, payload);
                    updateState(newState);
                    break;
                case 'clearMatchHistory':
                    try {
                        const db = getDB();
                        const historyCollection = db.collection('matchHistory');
                        await historyCollection.deleteMany({});
                        console.log('Match history cleared from DB.');
                        newState = clearMatchHistory(newState);
                        updateState(newState);
                    } catch (error) {
                        console.error('Failed to clear match history from DB:', error);
                    }
                    break;
                default:
                    console.warn('Unknown message type:', type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    userWs.on('close', () => {
        clients.delete(userWs);
        updateViewerCount();
        broadcastState(); // Update viewer count for remaining clients
    });

    ws.on('error', (error) => {
        console.error('WebSocket error on client:', error);
    });
});

// Add a catch-all route to serve the index.html for any non-asset requests.
// This is crucial for single-page applications and fixes the "Not Found" error.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


const startServer = async () => {
    await connectDB();
    await loadStateFromDB();
    server.listen(PORT, () => {
        console.log(`Web and WebSocket server is listening on port ${PORT}`);
    });
};

startServer();