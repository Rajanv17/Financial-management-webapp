import type { z } from "zod";
import type { categoryFormSchema, categorySchema } from "./schemas";

export type Category = z.infer<typeof categorySchema>;
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
