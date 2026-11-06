import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import activityRoutes from "./routes/activity";
import balanceRoutes from "./routes/balance";
import userRoutes from "./routes/users";
import holdingsRoutes from "./routes/holdings";
import connectDatabase from "./config/database";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/activity", activityRoutes);
app.use("/balance", balanceRoutes);
app.use("/user", userRoutes);
app.use("/api/holdings", holdingsRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Safe JSON errors; never expose driver details or stack traces.
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error instanceof Error && "statusCode" in error &&
    typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode : 500;
  res.status(status).json({ success: false, message: status === 500 ? "Internal server error" : (error as Error).message });
});

async function start(): Promise<void> {
  if (!process.env.MONGO_URI?.trim()) {
    console.error("MONGO_URI is required to start the backend; run the frontend separately for demo mode");
    process.exitCode = 1;
    return;
  }
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch {
    console.error("Backend startup failed: unable to connect to MongoDB");
    process.exitCode = 1;
  }
}

void start();
