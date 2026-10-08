import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri && uri !== 'inmemory') {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`[DB] Connected to MongoDB at ${uri.includes('@') ? 'Atlas Cluster' : 'Local MongoDB'}`);
      return;
    }
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB URI (${err.message}). Falling back to in-memory MongoDB for local zero-config demo.`);
  }

  try {
    mongodInstance = await MongoMemoryServer.create();
    const memUri = mongodInstance.getUri();
    await mongoose.connect(memUri);
    console.log(`[DB] Connected to in-memory MongoDB Server successfully (Zero-config local sandbox ready).`);
  } catch (memErr) {
    console.error(`[DB] Fatal error initializing MongoDB:`, memErr);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

