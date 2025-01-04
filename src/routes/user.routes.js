import { Router } from 'express';
import { registerUser } from '../controller/user.controller.js';
import { loggedInUser } from '../controller/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import multer from 'multer';

const router = Router();

const UploadText = multer();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route('/login').post(UploadText.none(), loggedInUser);
export default router;
