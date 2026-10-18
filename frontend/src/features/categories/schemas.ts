import { z } from "zod";

export const transactionTypeSchema = z.enum(["income", "expense"]);

export const categorySchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  name: z.string(),
  type: transactionTypeSchema,
  isDefault: z.boolean(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  isArchived: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or fewer"),
  type: transactionTypeSchema,
  icon: z.string().trim().min(1, "Choose an icon").max(50),
  color: z.string().trim().min(1, "Choose a colour").max(9),
});
