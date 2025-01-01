import { app } from './app.js';
import dotenv from 'dotenv';
dotenv.config({
  path: './.env',
});
const port = process.env.PORT || 7001;

app.listen(port, () => {
  console.log(`Server is running on Port:${port}`);
});
