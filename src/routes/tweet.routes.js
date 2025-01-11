import { Router } from "express";
import { createTweet, getUserTweet } from "../controller/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();
const UploadText = multer();

router.route("/tweet").post(UploadText.none(), verifyJwt, createTweet);
router.route("/getTweet").get(verifyJwt, getUserTweet);
export default router;
