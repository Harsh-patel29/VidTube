import { Router } from "express";
import {
  registerUser,
  logOutUser,
  loggedInUser,
  changeCurrentPassword,
  getCurrentUser,
  UpdateAccountDetails,
  UpdateUserAvatar,
  UpdateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();

const UploadText = multer();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(UploadText.none(), loggedInUser);
router.route("/logout").post(UploadText.none(), verifyJwt, logOutUser);
router
  .route("/changePassword")
  .patch(UploadText.none(), verifyJwt, changeCurrentPassword);
router.route("/getAccountDetails").get(verifyJwt, getCurrentUser);
router
  .route("/updateAccountDetail")
  .patch(UploadText.none(), verifyJwt, UpdateAccountDetails);
router
  .route("/UpdateAvatar")
  .patch(upload.single("avatar"), verifyJwt, UpdateUserAvatar);
router
  .route("/updatecoverimage")
  .patch(upload.single("coverImage"), verifyJwt, UpdateCoverImage);
router
  .route("/getchannelDetails/:username")
  .get(verifyJwt, getUserChannelProfile);
router.route("/getWatchHistory").get(verifyJwt, getWatchHistory);
export default router;
