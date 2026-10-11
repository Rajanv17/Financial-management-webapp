import mongoose, { Schema, Document } from "mongoose";

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

export enum PaymentMethod {
  CASH = "Cash",
  CREDIT_CARD = "Credit Card",
  DEBIT_CARD = "Debit Card",
  BANK_TRANSFER = "Bank Transfer",
  UPI = "UPI",
  OTHER = "Other",
}

export interface Transaction extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  type: TransactionType;
  date: Date;
  description?: string;
  paymentMethod?: string;
}

const transactionSchema = new Schema<Transaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 150,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.CASH,
    },
  },
  { timestamps: true }
);

// Compound Index: Optimizes "Get my transactions for this month sorted by date"
transactionSchema.index({ userId: 1, date: -1 });

export const TransactionModel = mongoose.model<Transaction>(
  "transaction",
  transactionSchema
);
