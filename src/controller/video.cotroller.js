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

const publishVideo = AsyncHandler(async (req, res) => {
  const { tittle, description } = req.body;
  if (!tittle || !description) {
    throw new ApiError(404, "Title and description is required");
  }

  const videoLocalfilePath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalFilePath = req.files?.thumbnail?.[0]?.path;
  console.log(videoLocalfilePath);
  console.log(thumbnailLocalFilePath);

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

  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, `Video Published Successfully!!`));

  //   const user = await User.aggregate([
  //     {
  //       $match: {
  //         _id: new mongoose.Types.ObjectId(req.user?._id),
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "users",
  //         localField: "username",
  //         foreignField: "publishedBy",
  //         as: "publishedBy",
  //       },
  //     },
  //   ]);
  //   console.log(user);
});

export { publishVideo };
