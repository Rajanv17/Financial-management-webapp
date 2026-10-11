import { Request, Response } from "express";
import { ApiError, ApiResponse } from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";
import { CategoryModel } from "../models/index";

const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  const { name, type, icon, color } = req.body;

  const categoryExist = await CategoryModel.findOne({
    name,
    userId: req.user?.id,
  });

  if (categoryExist) {
    throw new ApiError(400, "Category with the same name already exists");
  }

  const category = await CategoryModel.create({
    name,
    type,
    userId: req.user?.id,
    isDefault: false,
    icon,
    color,
    isArchived: false,
  });

  if (!category) {
    throw new ApiError(500, "Something went wrong while creating category");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
};

const fetchCategories = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id;

  const categories = await CategoryModel.find({
    $or: [{ isDefault: true }, { userId: currentUserId }],
    isArchived: false,
  });

  if (!categories || categories.length === 0) {
    throw new ApiError(404, "No categories found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
};

const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const categoryId = req.params.id;
  const { name, type, icon, color } = req.body;

  const categoryExist = await CategoryModel.findOne({
    name,
    userId: req.user?.id,
  });

  if (categoryExist) {
    throw new ApiError(400, "Category with the same name already exists");
  }

  const category = await CategoryModel.findOneAndUpdate(
    {
      _id: categoryId,
      userId: req.user?.id,
    },
    {
      name,
      icon,
      type,
      color,
    },
    { new: true }
  );

  if (!category) {
    throw new ApiError(500, "Something went wrong while updating category");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
};

const archiveCategory = async (req: AuthenticatedRequest, res: Response) => {
  const categoryId = req.params.id;

  const category = await CategoryModel.findOneAndUpdate(
    {
      _id: categoryId,
      userId: req.user!.id,
      isArchived: false,
    },
    { isArchived: true, archivedAt: new Date() },
    { new: true }
  );

  if (!category) {
    throw new ApiError(500, "Something went wrong while archiving category");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category archived successfully"));
};

const restoreCategory = async (req: AuthenticatedRequest, res: Response) => {
  const categoryId = req.params.id;

  const category = await CategoryModel.findOneAndUpdate(
    {
      _id: categoryId,
      userId: req.user!.id,
      isArchived: true,
    },
    { isArchived: false, archivedAt: undefined },
    { new: true }
  );

  if (!category) {
    throw new ApiError(500, "Something went wrong while restoring category");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category restored successfully"));
};

export {
  createCategory,
  updateCategory,
  fetchCategories,
  archiveCategory,
  restoreCategory,
};
