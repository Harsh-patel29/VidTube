import { ApiResponse } from '../utils/ApiResponse.js';
import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import {
  deletefromCloudinary,
  uploadOnClodinary,
} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateAccessandRefreshToken = async (userID) => {
  try {
    const user = User.findById(userID);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating access and refresh Token'
    );
  }
};

const registerUser = AsyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;

  if (
    [fullname, email, password, username].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(404, 'All fieild are required');
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, 'User with username and email alreadt exists.');
  }
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, 'Avatar file is missing');
  }
  let avatar;
  try {
    avatar = await uploadOnClodinary(avatarLocalFilePath);
    console.log('Uploaded Avatar!!', avatar);
  } catch (error) {
    console.log('Error in uploading Avatar File', error);
    throw new ApiError(500, 'Failed to upload Avatar File');
  }
  let coverImage;
  try {
    coverImage = await uploadOnClodinary(coverImageLocalFilePath);
    console.log('Uploaded CoverImage', coverImage);
  } catch (error) {
    console.log('Error in uploading CoverImage file', error);
    throw new ApiError(500, 'Failed to upload CoverImage');
  }

  try {
    const user = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || '',
      password,
    });

    const createdUser = await User.findById(user._id).select('-password');
    if (!createdUser) {
      throw new ApiError(500, 'Something went wrong while creating user');
    }
    // console.log(createdUser);

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, 'User registered Successfully'));
  } catch (error) {
    console.log('User creation Failed');
    if (avatar) {
      await deletefromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deletefromCloudinary(coverImage.public_id);
    }
    throw new ApiError(500, 'Something went wrong while creating user');
  }
});

const loggedInUser = AsyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new ApiError(404, 'Username and email required');
  }
  const user = User.findOne({
    $or: [{ username }, { email }],
  });
  const isPasswordCorrect = user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(404, 'Wrong credentials');
  }
  const { accessToken, refreshToken } = await generateAccessandRefreshToken();
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );
  if (!loggedInUser) {
    throw new ApiError(404, 'User not loggedIn');
  }
  const options = {
    httpOnly: true,
  };
  return res
    .status(200)
    .cookie('AccessToken', accessToken, options)
    .cookie('RefreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken, refreshToken },
        'User loggedIn successfully'
      )
    );
});

const logOutUser = AsyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );
  const options = { httpOnly: true };
  return res
    .status(200)
    .clearCookie('accessToken', accessToken)
    .clearCookie('refreshToken', refreshToken)
    .json(new ApiResponse(200, {}, 'User Logged Out sucessfully'));
});

const refreshToken = AsyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken || req.cookie.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(404, 'Refresh Token is required');
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, 'Invalid Refresh Token');
    }
    if (!incomingRefreshToken == user?.refreshToken) {
      throw new ApiError(401, 'Invalid Refresh Token');
    }
    const options = {
      httpOnly: true,
    };
    const { accessToken, refreshToken: NewRefreshToken } =
      await generateAccessandRefreshToken(user._id);
    return res
      .status(201)
      .cookie('AccessToken', accessToken, options)
      .cookie('RefreshToken', NewRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          'New Access token generated Successfukllly'
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while geneating refreshing access token'
    );
  }
});
export { registerUser };
