const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://AryanSaini1303:aryansaini9999@practice.jmvafq2.mongodb.net/?retryWrites=true&w=majority");
    console.log("MongoDB database connected");
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;
