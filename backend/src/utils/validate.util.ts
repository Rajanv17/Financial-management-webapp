import { ApiError } from "./index";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_AMOUNT = 9_999_999_999.99;

export const requireId = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new ApiError(400, `${field} is invalid`);
  }
  return value;
};

export const requireString = (
  value: unknown,
  field: string,
  maxLength: number,
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
};

export const optionalString = (
  value: unknown,
  field: string,
  maxLength: number,
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }
  return requireString(value, field, maxLength);
};

export const parseAmount = (value: unknown, field = "Amount"): number => {
  const raw =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value;

  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new ApiError(400, `${field} must be a number greater than zero`);
  }

  const rounded = Math.round(raw * 100) / 100; // money has 2 decimal places
  if (rounded <= 0) {
    throw new ApiError(400, `${field} must be a number greater than zero`);
  }
  if (rounded > MAX_AMOUNT) {
    throw new ApiError(400, `${field} is too large`);
  }
  return rounded;
};

export const parseEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T => {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(400, `${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
};

export const parseDate = (value: unknown, field = "Date"): Date => {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ApiError(400, `${field} is invalid`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${field} is invalid`);
  }
  return date;
};

export const parseIntInRange = (
  value: unknown,
  field: string,
  min: number,
  max: number,
): number => {
  const n = Number(value);
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !Number.isInteger(n) ||
    n < min ||
    n > max
  ) {
    throw new ApiError(
      400,
      `${field} must be a whole number from ${min} to ${max}`,
    );
  }
  return n;
};
