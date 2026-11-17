import mongoose from "mongoose";

const DB_OPTIONS = {
  dbName: process.env.DB_NAME,
  family: 4,
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
  setTimeout(connectDB, 5000);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, DB_OPTIONS);
    console.log("DB Connection Successful");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    setTimeout(connectDB, 5000);
  }
};
