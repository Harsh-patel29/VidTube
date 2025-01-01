import { DB_NAME } from '../constants.js';
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connectionInsatnce = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDb connected Successfully!! DB Host:${connectionInsatnce.connection.host} `
    );
  } catch (error) {
    console.log('MongoDB connection error', error);
    process.exit(1);
  }
};
export default connectDB;
