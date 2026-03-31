import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";
import applianceRoutes from "./routes/applianceRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import meterRoutes from "./routes/meterRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import { authMiddleware } from "./middleware/auth.js";
import { startReminderScheduler } from "./services/reminderService.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/usage", authMiddleware, usageRoutes);
app.use("/api/appliances", authMiddleware, applianceRoutes);
app.use("/api/bills", authMiddleware, billRoutes);
app.use("/api/meter", authMiddleware, meterRoutes);
app.use("/api/alerts", authMiddleware, alertRoutes);
app.use("/api/complaints", authMiddleware, complaintRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT || 5000;
connectDB()
  .then(() => {
    const server = app.listen(port, () => console.log(`Server listening on ${port}`));
    startReminderScheduler();
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the running process or change PORT in backend/.env.`);
        process.exit(1);
      }
      console.error("Server start error", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("DB connect error", error);
    process.exit(1);
  });
