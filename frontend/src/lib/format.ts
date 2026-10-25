export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

const integerGrouper = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/** Format a decimal money string (e.g. "1250.50") as INR without Number(). */
export const formatINRString = (amount: string) => {
  const trimmed = amount.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw = "0", fractionRaw = ""] = unsigned.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const paise = (fractionRaw + "00").slice(0, 2);
  const grouped = integerGrouper.format(BigInt(whole));
  const formatted = `₹${grouped}.${paise}`;
  return negative ? `-${formatted}` : formatted;
};

export const isNegativeMoneyString = (amount: string) => {
  const trimmed = amount.trim();
  return trimmed.startsWith("-") && !/^-0+(?:\.0+)?$/.test(trimmed);
};

export const userInitials = (username: string) => {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase() || "?";
};
