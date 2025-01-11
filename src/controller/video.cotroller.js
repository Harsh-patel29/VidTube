import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import {
  uploadOnClodinary,
  deletefromCloudinary,
} from "../utils/cloudinary.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllvideos = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const video = await Video.aggregate([
    {
      $group: {
        _id: "$_id",
      },
    },
  ])
    .skip((page - 1) * limit)
    .limit(Number(limit));
  return res.status(200).json(new ApiResponse(200, video, "All videos are"));
});

const publishVideo = AsyncHandler(async (req, res) => {
  const { tittle, description } = req.body;
  if (!tittle || !description) {
    throw new ApiError(404, "Title and description is required");
  }

  const videoLocalfilePath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalFilePath = req.files?.thumbnail?.[0]?.path;
  // console.log(videoLocalfilePath);
  // console.log(thumbnailLocalFilePath);

  if (!videoLocalfilePath) {
    throw new ApiError(400, "Video file is missing");
  }

  if (!thumbnailLocalFilePath) {
    throw new ApiError(400, "Thumbnail is missing");
  }
  let video;
  let thumbnail;
  try {
    video = await uploadOnClodinary(videoLocalfilePath);
    console.log("Video uploaded SuccessFully", video);
  } catch (error) {
    console.log("Error", error);
    throw new ApiError(
      500,
      "Something went wrong while uploading video in cloudinary"
    );
  }
  try {
    thumbnail = await uploadOnClodinary(thumbnailLocalFilePath);
    console.log("Thumbnail uploades Successfully", thumbnail);
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while uploading thumbnail file in cloudinary"
    );
  }
  const user = await User.findById(req.user._id);
  // console.log(user);
  const duration = video.duration;
  // console.log(duration);

  const publishedVideo = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    tittle,
    description,
    views: 0,
    duration: duration,
    isPublished: true,
    owner: await User.findById(req.user._id),
  });
  // console.log(publishedVideo._id);

  const videoDetails = await Video.findById(publishedVideo._id).select(
    "-owner"
  );
  if (!videoDetails) {
    throw new ApiError(500, "Something went wrong while publishing video");
  }

  const uploadBY = req.user.username;
  // console.log(uploadBY);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoDetails,
        `Video Published Successfully By ${uploadBY}!!`
      )
    );
});

const getVideoByusername = AsyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(404, "Username is required");
  }

  const details = await Video.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $match: {
        user: {
          $elemMatch: {
            username: username,
          },
        },
      },
    },
  ]);
  if (details.length === 0) {
    throw new ApiError(400, "No video is uploaded by this user");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        details[0].videoFile,
        `Video published by ${username} are`
      )
    );
});

const getVideoById = AsyncHandler(async (req, res) => {
  const { VideoId } = req.params;

  const id = new mongoose.Types.ObjectId(VideoId);

  const videoDetail = await Video.aggregate([
    {
      $match: {
        _id: id,
      },
    },
    {
      $project: {
        tittle: 1,
        description: 1,
      },
    },
  ]);
  console.log(videoDetail);

  if (!videoDetail) {
    throw new ApiError(404, "Video with this Id do not exists.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videoDetail, "Video with particular ID found"));
});

const updateVideo = AsyncHandler(async (req, res) => {
  const videoLocalfilePath = req.file?.path;
  console.log(videoLocalfilePath);

  if (!videoLocalfilePath) {
    throw new ApiError(404, "Video file is missing.");
  }

  const UserId = await User.findById(req.user._id);
  // const ObjUserId = mongoose.isValidObjectId(UserId._id);
  const ObjUserId = UserId._id;
  const user = new mongoose.Types.ObjectId(ObjUserId);
  // console.log(user);

  const videoId = await Video.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoId",
      },
    },
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user),
      },
    },
  ]);
  console.log(videoId);

  const index = videoId.findIndex((v) =>
    v.videoId.some((vid) => vid._id.equals(user))
  );
  // console.log(index);

  const Id = videoId[index].videoId[0]._id;
  const ObjId = new mongoose.Types.ObjectId(Id);
  // console.log(mongoose.isValidObjectId(ObjId));
  // console.log(ObjId);

  // console.log(user.equals(ObjId));
  try {
    if (user.equals(ObjId)) {
      const videouploaded = await uploadOnClodinary(videoLocalfilePath);
      if (!videouploaded.url) {
        throw new ApiError(
          500,
          "Something went wrong while uploading file in cloudinary"
        );
      }
      const video = await Video.findByIdAndUpdate(
        videoId[0]._id,
        {
          $set: {
            videoFile: videouploaded.url,
          },
        },
        {
          new: true,
        }
      );
      return res
        .status(200)
        .json(new ApiResponse(200, video, "Video successfully updated"));
    } else {
      throw new ApiError(404, "Please Login");
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while uploading file to cloudinary"
    );
  }
});

const deleteVideo = AsyncHandler(async (req, res) => {
  const { VideoId } = req.params;
  if (!VideoId) {
    throw new ApiError(400, "VideoID must needed.");
  }
  const id = new mongoose.Types.ObjectId(VideoId);
  const deletedVideo = await Video.findByIdAndDelete(id);
  if (deletedVideo) {
    console.log("Video deleted successfully");
    return res
      .status(200)
      .json(new ApiResponse(200, deletedVideo, "Video deleted"));
  } else {
    throw new ApiError(500, "Something went wrong while deleting video");
  }
});

export {
  publishVideo,
  getVideoByusername,
  getVideoById,
  getAllvideos,
  updateVideo,
  deleteVideo,
};
