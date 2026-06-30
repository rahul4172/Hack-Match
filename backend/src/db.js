import mongoose from 'mongoose';

export async function initDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// We no longer export `db` because Mongoose models will be imported directly
// where needed. But we export initDB for server.js to use.
export default { initDB };
