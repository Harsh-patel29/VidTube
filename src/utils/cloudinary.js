import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnClodinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    console.log('File uploaded on Cloudinary!! File src:' + response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log('Error in uploading to Cloudinary', error);
    return null;
  }
};

export { uploadOnClodinary };
