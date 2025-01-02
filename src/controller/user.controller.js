import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  deletefromCloudinary,
  uploadOnClodinary,
} from "../utils/cloudinary.js";

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
export { registerUser };
