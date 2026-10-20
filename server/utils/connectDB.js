import mongoose from "mongoose";

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database Connected");
  } catch (error) {
    console.log("DB Error: " + error.message);
    console.log("Check MONGODB_URI in server/.env and make sure MongoDB is running.");
  }
};

export default dbConnection;
