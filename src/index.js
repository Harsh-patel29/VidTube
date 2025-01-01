import { app } from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/index.js';
dotenv.config({
  path: './.env',
});
const port = process.env.PORT || 7001;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on Port:${port}`);
    });
  })
  .catch((err) => {
    console.log('MongoDb connection error', err);
  });
