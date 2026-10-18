import type { z } from "zod";
import type {
  loginSchema,
  profileSchema,
  registerSchema,
  userSchema,
} from "./schemas";

export type User = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
