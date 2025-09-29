import { MongoClient, Db } from 'mongodb';
// FIX: Import the Node.js 'process' module to provide the full, correct type definitions and resolve the error on 'process.exit()'.
import * as process from 'process';

let db: Db;

export const connectDB = async (): Promise<void> => {
    if (db) {
        return;
    }
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not defined in the environment variables. Please create a .env file in the 'server' directory based on .env.example.");
        }
        const client = new MongoClient(mongoUri);
        await client.connect();
        // Explicitly connect to the "CricketDB" database as requested by the user.
        // This ensures data is stored correctly even if the database name is omitted from the URI.
        db = client.db('CricketDB');
        console.log("Successfully connected to MongoDB database: CricketDB");
    } catch (error) {
        console.error("Could not connect to MongoDB.", error);
        process.exit(1);
    }
};

export const getDB = (): Db => {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB first.");
    }
    return db;
};