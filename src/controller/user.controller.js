import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  deletefromCloudinary,
  uploadOnClodinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose, { Mongoose } from "mongoose";
dotenv.config();

const generateAccessandRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });
    // console.log(user);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh Token"
    );
  }
};

const registerUser = AsyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;

  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(404, "All fieild are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with username and email alreadt exists.");
  }
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  let avatar;
  try {
    avatar = await uploadOnClodinary(avatarLocalFilePath);
    console.log("Uploaded Avatar!!", avatar);
  } catch (error) {
    console.log("Error in uploading Avatar File", error);
    throw new ApiError(500, "Failed to upload Avatar File");
  }
  let coverImage;
  try {
    coverImage = await uploadOnClodinary(coverImageLocalFilePath);
    console.log("Uploaded CoverImage", coverImage);
  } catch (error) {
    console.log("Error in uploading CoverImage file", error);
    throw new ApiError(500, "Failed to upload CoverImage");
  }

  try {
    const user = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
    });

    const createdUser = await User.findById(user._id).select("-password");
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }
    // console.log(createdUser);

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered Successfully"));
  } catch (error) {
    console.log("User creation Failed");
    if (avatar) {
      await deletefromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deletefromCloudinary(coverImage.public_id);
    }
    throw new ApiError(500, "Something went wrong while creating user");
  }
});

const loggedInUser = AsyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    throw new ApiError(404, "Username and email required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // console.log(user.isPasswordCorrect);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // console.log(user);

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "Wrong credentials");
  }
  //isPasswordCoreect show me an error because i was exorting User in userSchema earlier than the isPasswordCorrect Method.

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new ApiError(404, "User not loggedIn");
  }
  const options = {
    httpOnly: true,
  };
  return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken, refreshToken },
        "User loggedIn successfully"
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out sucessfully"));
});

const refreshAcessToken = AsyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken || req.cookie.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(404, "Refresh Token is required");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (!incomingRefreshToken == user?.refreshToken) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    const options = {
      httpOnly: true,
    };
    const { accessToken, refreshToken: NewRefreshToken } =
      await generateAccessandRefreshToken(user._id);
    return res
      .status(201)
      .cookie("AccessToken", accessToken, options)
      .cookie("RefreshToken", NewRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "New Access token generated Successfukllly"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while geneating refreshing access token"
    );
  }
});

const changeCurrentPassword = AsyncHandler(async (req, res) => {
  const { oldPassword, NewPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "OldPassword is incorrect");
  }
  user.password = NewPassword;
  await user.save({
    validateBeforeSave: false,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched Successfully"));
});

const UpdateAccountDetails = AsyncHandler(async (req, res) => {
  const { username, email, fullname } = req.body;
  if (!username || !email || !fullname) {
    throw new ApiError(400, "Any of these fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.body._id,
    {
      $set: {
        username: username,
        email: email,
        fullname: fullname,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  console.log(user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated Successfully"));
});

const UpdateUserAvatar = AsyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.files?.avatar?.[0]?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is required.");
  }
  const avatar = await uploadOnClodinary(avatarLocalFilePath);
  if (!avatar.url) {
    throw new ApiError(
      500,
      "Something went wrong while uploading file on cloudinary"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated Successfully"));
});

const UpdateCoverImage = AsyncHandler(async (req, res) => {
  const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;
  if (!coverImageLocalFilePath) {
    throw new ApiError(400, "Cover Image is needed");
  }
  const coverImage = await uploadOnClodinary(coverImageLocalFilePath);
  if (!coverImage.url) {
    throw new ApiError(
      500,
      "Something went wrong while uploading file on cloudinary"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage updated successfully"));
});

const getUserChannelProfile = AsyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "subcriber",
        as: "subcribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: { $ifNull: ["$subscribers", []] } },
        channelsSubcribedTO: { $size: { $ifNull: ["$subcribedTo", []] } },
        isSubcribed: {
          $cond: [
            { $in: [req.user?._id, "$subscribers.subcriber"] },
            true,
            false,
          ],
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsSubcribedTO: 1,
        isSubcribed: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }
  // console.log(channel);
  // console.log(channel[0]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched Properly!")
    );
});

const getWatchHistory = AsyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "WatchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!user) {
    throw new ApiError("User not found");
  }
  // console.log(user[0].WatchHistory);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.WatchHistory,
        "Watch history fetched successfully!"
      )
    );
});

export {
  registerUser,
  loggedInUser,
  logOutUser,
  changeCurrentPassword,
  getCurrentUser,
  UpdateAccountDetails,
  UpdateUserAvatar,
  UpdateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
