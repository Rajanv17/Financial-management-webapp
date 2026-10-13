import { prisma } from "./index";

const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed");
    console.error(error);
    process.exit(1);
  }
};

export default connectDatabase;
