import { prisma } from "../config/prisma";
import { defaultCategories } from "../config/defaultCategories";

const seedCategories = async () => {
  try {
    console.log("Connected to PostgreSQL for seeding");

    const existingDefaults = await prisma.category.count({
      where: { isDefault: true },
    });

    if (existingDefaults > 0) {
      console.log("Default categories already exist");
      return;
    }

    await prisma.category.createMany({
      data: defaultCategories,
      skipDuplicates: true,
    });
    console.log("Default Categories Seeded Successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

seedCategories();
