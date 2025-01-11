import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createTweet = AsyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Tweet is required");
  }
  const owner = await User.findById(req.user._id);
  if (!owner) {
    throw new ApiError(404, "User not found");
  }

  const publishedTweet = await Tweet.create({
    content,
    owner: owner._id,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, publishedTweet, "Tweet posted Successfullyy"));
});

const getUserTweet = AsyncHandler(async (req, res) => {
  const id = await User.findById(req.user._id);
  const UserTweet = await Tweet.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $match: {
        result: {
          $elemMatch: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
      },
    },
  ]);

  const tweets = UserTweet[1].content;
  console.log(UserTweet);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweet by the users are"));
});

const updateTweet = AsyncHandler(async (req, res) => {});

const deleteTweet = AsyncHandler(async (req, res) => {});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
