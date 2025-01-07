import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

import healthCheckRouter from "./routes/healthCheck.routes.js";
import userRouter from "./routes/user.routes.js";
import loggedInUserRouter from "./routes/user.routes.js";
import logOutUserRouter from "./routes/user.routes.js";
import changeCurrentPasswordRouter from "./routes/user.routes.js";
import getCurrentUserRouter from "./routes/user.routes.js";
import UpdateAccountDetailsRouter from "./routes/user.routes.js";
import UpdateUserAvatarRouter from "./routes/user.routes.js";
import UpdateCoverImageRouter from "./routes/user.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/users", loggedInUserRouter);
app.use("/api/v1/users", logOutUserRouter);
app.use("/api/v1/users", changeCurrentPasswordRouter);
app.use("/api/v1/users", getCurrentUserRouter);
app.use("/api/v1/users", UpdateAccountDetailsRouter);
app.use("/api/v1/users", UpdateUserAvatarRouter);
app.use("/api/v1/users", UpdateCoverImageRouter);

export { app };
