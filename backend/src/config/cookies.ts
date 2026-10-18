import type { CookieOptions } from "express";

const SAME_SITE_VALUES = ["lax", "strict", "none"] as const;
type SameSite = (typeof SAME_SITE_VALUES)[number];

const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};

const durationToMs = (value: string, name: string): number => {
  const trimmed = value.trim();
  const withUnit = /^(\d+)(ms|s|m|h|d|w|y)$/i.exec(trimmed);
  if (withUnit) {
    return Number(withUnit[1]) * UNIT_MS[withUnit[2].toLowerCase()];
  }
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }
  throw new Error(
    `${name} must be a duration such as 15m, 1d, or 7d (got "${value}")`,
  );
};

const parseSameSite = (): SameSite => {
  if (process.env.NODE_ENV !== "production") {
    return "lax";
  }

  const raw = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
  if (!SAME_SITE_VALUES.includes(raw as SameSite)) {
    throw new Error(
      `COOKIE_SAMESITE must be one of ${SAME_SITE_VALUES.join(", ")}`,
    );
  }
  return raw as SameSite;
};

const cookieBase = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: parseSameSite(),
});

export const accessCookieOptions = (): CookieOptions => ({
  ...cookieBase(),
  maxAge: durationToMs(
    process.env.ACCESS_TOKEN_EXPIRY ?? "1d",
    "ACCESS_TOKEN_EXPIRY",
  ),
});

export const refreshCookieOptions = (): CookieOptions => ({
  ...cookieBase(),
  maxAge: durationToMs(
    process.env.REFRESH_TOKEN_EXPIRY ?? "7d",
    "REFRESH_TOKEN_EXPIRY",
  ),
});
