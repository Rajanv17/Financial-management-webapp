import { Response } from "express";
import { prisma } from "../config";
import {
  ApiError,
  ApiResponse,
  optionalQueryString,
  optionalString,
  parseEnum,
  requireId,
  requireString,
} from "../utils/index";
import { AuthenticatedRequest } from "../middlewares/index";
import { TransactionType } from "../generated/prisma/enums";

const CATEGORY_TYPES = Object.values(TransactionType);
const DUPLICATE_MESSAGE =
  "Category with the same name and type already exists (it may be archived)";

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }
  return userId;
};

const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const body = req.body;

  const name = requireString(body.name, "Name", 50);
  const type = parseEnum(body.type, CATEGORY_TYPES, "Type");
  const icon = optionalString(body.icon, "Icon", 50);
  const color = optionalString(body.color, "Color", 9);

  try {
    const category = await prisma.category.create({
      data: { name, type, userId, isDefault: false, icon, color },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, category, "Category created successfully"));
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(400, DUPLICATE_MESSAGE);
    }
    throw error;
  }
};

const fetchCategories = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const archivedValue = optionalQueryString(req.query.archived, "archived");

  if (
    archivedValue !== undefined &&
    archivedValue !== "true" &&
    archivedValue !== "false"
  ) {
    throw new ApiError(400, "archived must be true or false");
  }

  const categories =
    archivedValue === "true"
      ? await prisma.category.findMany({
          where: { userId, isArchived: true, isDefault: false },
        })
      : await prisma.category.findMany({
          where: {
            OR: [{ isDefault: true }, { userId }],
            isArchived: false,
          },
        });

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
};

const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const categoryId = requireId(req.params.id, "Category id");
  const body = req.body;

  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, userId, isDefault: false },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  if (body.type !== undefined && body.type !== existingCategory.type) {
    throw new ApiError(400, "Category type cannot be changed");
  }

  const data = {
    ...(body.name !== undefined && {
      name: requireString(body.name, "Name", 50),
    }),
    ...(body.icon !== undefined && {
      icon: optionalString(body.icon, "Icon", 50),
    }),
    ...(body.color !== undefined && {
      color: optionalString(body.color, "Color", 9),
    }),
  };

  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, category, "Category updated successfully"));
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(400, DUPLICATE_MESSAGE);
    }
    throw error;
  }
};

const archiveCategory = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const categoryId = requireId(req.params.id, "Category id");

  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, userId, isDefault: false, isArchived: false },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: { isArchived: true, archivedAt: new Date() },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category archived successfully"));
};

const restoreCategory = async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const categoryId = requireId(req.params.id, "Category id");

  const existingCategory = await prisma.category.findFirst({
    where: { id: categoryId, userId, isDefault: false, isArchived: true },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  const restoredCategory = await prisma.category.update({
    where: { id: categoryId },
    data: { isArchived: false, archivedAt: null },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, restoredCategory, "Category restored successfully"),
    );
};

export {
  createCategory,
  updateCategory,
  fetchCategories,
  archiveCategory,
  restoreCategory,
};
