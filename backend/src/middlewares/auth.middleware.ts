import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const ACCESS_TOKEN_SECRET = requireEnv("ACCESS_TOKEN_SECRET") as Secret;
const REFRESH_TOKEN_SECRET = requireEnv("REFRESH_TOKEN_SECRET") as Secret;
const ACCESS_TOKEN_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY ??
  "1d") as SignOptions["expiresIn"];
const REFRESH_TOKEN_EXPIRY = (process.env.REFRESH_TOKEN_EXPIRY ??
  "7d") as SignOptions["expiresIn"];

// Replaces the schema's lowercase + trim options. Call it on every username and
// email before saving AND before looking a user up (register and login).
export const normalizeIdentifier = (value: string): string =>
  value.trim().toLowerCase();

// Replaces the pre("save") hook.
export const hashPassword = (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, 10);

// Replaces userSchema.methods.comparePassword.
export const comparePassword = (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(plainPassword, passwordHash);

type TokenUser = { id: string; username: string; email: string };

// Replaces userSchema.methods.generateAccessToken. The payload key is now `id`
// (it was `_id`), so update your auth middleware to read decoded.id.
export const generateAccessToken = (user: TokenUser): string =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

// Replaces userSchema.methods.generateRefreshToken.
export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ id: userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
