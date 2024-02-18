const mongoose = require("mongoose");
require('dotenv').config();// remember to configure dotenv before using in the file

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_ID);
    console.log("MongoDB database connected");
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
