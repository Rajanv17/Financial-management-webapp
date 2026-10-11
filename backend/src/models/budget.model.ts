import mongoose, { Schema, Document } from "mongoose";

export interface Budget extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  week?: number;
  month: number;
  year: number;
  isActive: boolean;
  isArchived: boolean;
}

const budgetSchema = new Schema<Budget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    week: {
      type: Number,
      required: false,
      min: 1,
      max: 53,
    },
    year: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const BudgetModel = mongoose.model<Budget>("budget", budgetSchema);
