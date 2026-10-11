import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Secret } from "jsonwebtoken";

export interface User extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  refreshToken?: string;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<User>("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error("Error in pre-save hook", error);
    next(error as Error);
  }
});

userSchema.methods.generateAccessToken = function (): string {
  const secret = (process.env.ACCESS_TOKEN_SECRET ?? "12345") as Secret;
  const expiry = (process.env.ACCESS_TOKEN_EXPIRY ??
    "1d") as jwt.SignOptions["expiresIn"];
  const payload = {
    _id: this._id,
    username: this.username,
    email: this.email,
  };

  const token = jwt.sign(payload, secret, { expiresIn: expiry });

  return token;
};

userSchema.methods.generateRefreshToken = function (): string {
  const secret = (process.env.REFRESH_TOKEN_SECRET ?? "98765") as Secret;
  const expiry = (process.env.REFRESH_TOKEN_EXPIRY ??
    "7d") as jwt.SignOptions["expiresIn"];
  const payload = {
    _id: this._id,
  };

  const token = jwt.sign(payload, secret, { expiresIn: expiry });

  return token;
};

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<User>("user", userSchema);
