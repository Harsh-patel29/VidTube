import jwt from 'jsonwebtoken';
import { AsyncHandler } from '../utils/AsyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.models';
import dotenv from 'dotenv';
dotenv.config();

export const verifyJwt = AsyncHandler(async (req, res, next) => {
  const token =
    (req.cookies && req.cookies.accessToken) ||
    (req.header('Authorization').startsWith('Bearer ') &&
      req.header('Authorization').replace('Bearer ', ''));
  if (!token) {
    throw new ApiError(404, 'Unauthorized');
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select(
      '-password -refreshToken'
    );
    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid Access Token');
  }
});
