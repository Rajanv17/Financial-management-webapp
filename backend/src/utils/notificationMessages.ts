const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export const formatInr = (amount: { toString(): string } | number): string =>
  inr.format(Number(amount));

export const formatDisplayDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const dateOnlyKey = (date: Date): string =>
  date.toISOString().slice(0, 10);
