import { Router } from "express";
import {
  publishVideo,
  getVideoByusername,
  getVideoById,
} from "../controller/video.cotroller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import multer from "multer";
const router = Router();

const UploadText = multer();

router.route("/publishVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJwt,
  publishVideo
);

router
  .route("/getVideoByusername/:username")
  .get(verifyJwt, getVideoByusername);
router.route("/getVideoById/:VideoId").get(verifyJwt, getVideoById);
export default router;
