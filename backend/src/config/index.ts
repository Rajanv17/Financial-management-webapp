import connectDatabase from "./database.config";
import { defaultCategories } from "./defaultCategories";
import { prisma } from "./prisma";
import { accessCookieOptions, refreshCookieOptions } from "./cookies";
import { parseTrustProxy } from "./trustProxy";

export {
  connectDatabase,
  defaultCategories,
  prisma,
  accessCookieOptions,
  refreshCookieOptions,
  parseTrustProxy,
};
