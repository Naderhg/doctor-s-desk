import { env } from "./lib/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import clinicRouter from "./routes/clinic.js";
import appointmentsRouter from "./routes/appointments.js";
import medicalRouter from "./routes/medical.js";
import prescriptionsRouter from "./routes/prescriptions.js";
import doctorRouter from "./routes/doctor.js";
import notificationsRouter from "./routes/notifications.js";
import filesRouter from "./routes/files.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/clinic", clinicRouter);
app.use("/appointments", appointmentsRouter);
app.use("/medical-file", medicalRouter);
app.use("/prescriptions", prescriptionsRouter);
app.use("/doctor", doctorRouter);
app.use("/notifications", notificationsRouter);
app.use("/files", filesRouter);

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
