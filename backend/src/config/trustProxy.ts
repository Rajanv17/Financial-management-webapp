export const parseTrustProxy = (
  value: string | undefined,
): boolean | number | string => {
  if (value === undefined || value.trim() === "") return false;
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
};
