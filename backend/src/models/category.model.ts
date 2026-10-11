import mongoose, { Schema, Document } from "mongoose";
import { TransactionType } from "./transaction.model";

export interface Category extends Document {
  name: string;
  type: TransactionType;
  userId?: mongoose.Types.ObjectId;
  isDefault: boolean;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  archivedAt?: Date;
}

const categorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(TransactionType),
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const CategoryModel = mongoose.model<Category>(
  "Category",
  categorySchema,
);
