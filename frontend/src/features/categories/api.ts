import { api } from "@/lib/api";
import type { Category, CategoryFormInput } from "./types";

export const fetchCategories = (archived = false) => {
  const query = archived ? "?archived=true" : "";
  return api<Category[]>(`/categories${query}`);
};

export const createCategory = (input: CategoryFormInput) =>
  api<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateCategory = (
  id: string,
  input: Pick<CategoryFormInput, "name" | "icon" | "color">,
) =>
  api<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const archiveCategory = (id: string) =>
  api<Category>(`/categories/archive/${id}`, { method: "PATCH" });

export const restoreCategory = (id: string) =>
  api<Category>(`/categories/restore/${id}`, { method: "PATCH" });
