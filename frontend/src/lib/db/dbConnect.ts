/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is missing in environment variables");
}

// Global cache to prevent multiple connections in Next.js
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) {
    // 👍 Reuse existing DB connection
    return cached.conn;
  }

  if (!cached.promise) {
    // 👇 Create connection once, with optimized settings
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Retry for 30s instead of 10s
      socketTimeoutMS: 45000,          // Prevent monitor connection dropping
      heartbeatFrequencyMS: 2000,      // Faster detection of issues
      bufferCommands: false,           // Avoid memory bloat
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
