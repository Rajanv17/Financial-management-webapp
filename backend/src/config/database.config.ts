import mongoose from "mongoose";

const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed");
    console.error(error);
    process.exit(1);
  }
};

export default connectDatabase;
