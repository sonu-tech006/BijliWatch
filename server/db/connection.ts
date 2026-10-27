import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let isConnecting = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected) return true;
  if (isConnecting) return false;

  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('MY_MONGODB')) {
    console.log('[BijliWatch DB] No live MongoDB Atlas URI provided. Running in resilient high-performance embedded persistence mode.');
    return false;
  }

  isConnecting = true;
  try {
    console.log('[BijliWatch DB] Attempting connection to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    isConnecting = false;
    console.log('[BijliWatch DB] Successfully connected to MongoDB Atlas!');
    return true;
  } catch (error: any) {
    isConnecting = false;
    console.warn(`[BijliWatch DB] MongoDB Atlas connection error (${error.message}). Falling back to resilient embedded store.`);
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
