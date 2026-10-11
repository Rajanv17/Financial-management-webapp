import mongoose from "mongoose";
import dotenv from "dotenv";
import { CategoryModel } from "../models/index";
import { defaultCategories } from "../config/index";
dotenv.config();

const seedCategories = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`);
    console.log("Connected to MongoDB for Seeding");

    const existingDefaults = await CategoryModel.find({ isDefault: true });

    if (existingDefaults.length > 0) {
      console.log("Default categories already exist");
      process.exit();
    }

    await CategoryModel.insertMany(defaultCategories);
    console.log("Default Categories Seeded Successfully!");

    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedCategories();
