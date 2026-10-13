export const serializeAmount = <T extends { amount: unknown }>(row: T) => ({
  ...row,
  amount: Number(row.amount),
});
