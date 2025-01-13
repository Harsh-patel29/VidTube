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
import getUserChannelProfileRouter from "./routes/user.routes.js";
import getWatchHistoryRouter from "./routes/user.routes.js";
import publishVideoRouter from "./routes/video.routes.js";
import getVideoByusernameRouter from "./routes/video.routes.js";
import getVideoByIdRouter from "./routes/video.routes.js";
import getAllvideosRouter from "./routes/video.routes.js";
import updateVideoRouter from "./routes/video.routes.js";
import deleteVideoRouter from "./routes/video.routes.js";
import createTweetRouter from "./routes/tweet.routes.js";
import getUserTweetRouter from "./routes/tweet.routes.js";
import updateTweetRouter from "./routes/tweet.routes.js";
import deleteTweetRouter from "./routes/tweet.routes.js";
import toggleSubcriptionRouter from "./routes/subcription.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/users", loggedInUserRouter);
app.use("/api/v1/users", logOutUserRouter);
app.use("/api/v1/users", changeCurrentPasswordRouter);
app.use("/api/v1/users", getCurrentUserRouter);
app.use("/api/v1/users", UpdateAccountDetailsRouter);
app.use("/api/v1/users", UpdateUserAvatarRouter);
app.use("/api/v1/users", UpdateCoverImageRouter);
app.use("/api/v1/users", getUserChannelProfileRouter);
app.use("/api/v1/users", getWatchHistoryRouter);
app.use("/api/v1/video", publishVideoRouter);
app.use("/api/v1/video", getVideoByusernameRouter);
app.use("/api/v1/video", getVideoByIdRouter);
app.use("/api/v1/video", getAllvideosRouter);
app.use("/api/v1/video", updateVideoRouter);
app.use("/api/v1/video", deleteVideoRouter);
app.use("/api/v1/tweet", createTweetRouter);
app.use("/api/v1/tweet", getUserTweetRouter);
app.use("/api/v1/tweet", updateTweetRouter);
app.use("/api/v1/tweet", deleteTweetRouter);
app.use("/api/v1/subcriber", toggleSubcriptionRouter);

export { app };
