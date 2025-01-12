import { Router } from "express";
import {
  createTweet,
  getUserTweet,
  updateTweet,
  deleteTweet,
} from "../controller/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();
const UploadText = multer();

router.route("/tweet").post(UploadText.none(), verifyJwt, createTweet);
router.route("/getTweet").get(verifyJwt, getUserTweet);
router.route("/updateTweet").patch(UploadText.none(), verifyJwt, updateTweet);
router.route("/deleteTweet/:TweetId").delete(verifyJwt, deleteTweet);
export default router;
