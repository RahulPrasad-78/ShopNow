const mongoose = require("mongoose");

// On Vercel the function can be started many times, but module-level state
// survives between warm invocations. Cache the connection promise on `global`
// so each invocation reuses it instead of opening a new connection.
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { promise: null };
}

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((conn) => {
      console.log("MongoDB Connected Successfully");
      return conn;
    });
  }

  try {
    await cached.promise;
  } catch (error) {
    cached.promise = null; // allow a retry on the next request
    console.error("Error connecting to MongoDB:", error);
    // A long-running local server cannot do anything useful without a database;
    // a serverless function should just fail this request and try again later.
    if (!process.env.VERCEL) process.exit(1);
    throw error;
  }
  return mongoose.connection;
};

module.exports = connectDB;
