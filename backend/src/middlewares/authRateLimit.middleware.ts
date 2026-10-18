import "dotenv/config";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "../utils/index";

const positiveInt = (
  value: string | undefined,
  fallback: number,
  name: string,
) => {
  const parsed =
    value === undefined || value.trim() === "" ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

const windowMs = positiveInt(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
  "AUTH_RATE_LIMIT_WINDOW_MS",
);
const limit = positiveInt(
  process.env.AUTH_RATE_LIMIT_MAX,
  10,
  "AUTH_RATE_LIMIT_MAX",
);

export const authRateLimiter = rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, "Too many requests, please try again later"));
  },
});
