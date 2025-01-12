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

const updateTweet = AsyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "tweet is required");
  }
  const id = await User.findById(req.user._id);
  const userId = id._id;
  // console.log(userId);

  const owner = await Tweet.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "TweetId",
      },
    },
    {
      $match: {
        owner: userId,
      },
    },
    {
      $project: { TweetId: 0 },
    },
  ]);
  // console.log(owner);
  const ObjId = owner[0].owner;
  console.log(userId.equals(ObjId));

  if (userId.equals(ObjId)) {
    const tweetId = await Tweet.findByIdAndUpdate(
      owner,
      {
        $set: {
          content: content,
        },
      },
      {
        new: true,
      }
    );
    // console.log(tweetId);
    return res.status(200).json(new ApiResponse(200, tweetId, "Tweet updated"));
  } else {
    throw new ApiError(400, "Please Login");
  }
});

const deleteTweet = AsyncHandler(async (req, res) => {
  const { TweetId } = req.params;
  if (!TweetId) {
    throw new ApiError(400, "TweetId not found");
  }
  const deletedTweet = await Tweet.findByIdAndDelete(TweetId);
  if (deletedTweet) {
    return res
      .status(200)
      .json(new ApiResponse(200, deletedTweet, "Tweet deleted Successfully"));
  } else {
    throw new ApiResponse(500, "Something went wrong while deleting tweet");
  }
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
