import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subcription.models.js";

const toggleSubcription = AsyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subcriber = await User.findById(req.user._id);
  const channel = await User.aggregate([
    {
      $group: {
        _id: "$_id",
      },
    },
  ]);
  console.log(channel);

  const subcribedChannel = await Subscription.create({
    subscriber: subcriber,
    channel: channel,
  });
});

export { toggleSubcription };
