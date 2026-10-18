export const CATEGORY_COLORS = [
  "#db63ff",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCF",
  "#63ff63",
  "#ff2121",
  "#2563EB",
  "#0F766E",
  "#B45309",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];
