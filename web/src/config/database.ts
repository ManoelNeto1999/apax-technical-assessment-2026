import mongoose from "mongoose";

const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri?.trim()) {
    throw new Error("MONGO_URI is required to start the backend; run the frontend separately for demo mode");
  }
  await mongoose.connect(uri);
};

export default connectDatabase;
