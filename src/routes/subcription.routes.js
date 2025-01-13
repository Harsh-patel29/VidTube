import { Router } from "express";
import { toggleSubcription } from "../controller/subcription.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = Router();
const uploadText = multer();

router.route("/subcribe").post(verifyJwt, toggleSubcription, uploadText.none());

export default router;
