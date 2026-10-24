import { prisma } from "../config/prisma";
import type { PaymentMethod, TransactionType } from "../generated/prisma/client";

const ALLOWED_USERNAME = "demo";

type MonthWindow = {
  year: number;
  month: number;
  lastDay: number;
  isCurrent: boolean;
};

type TxDraft = {
  title: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryName: string;
  paymentMethod: PaymentMethod;
  year: number;
  month: number;
  day: number;
};

const monthlyTemplates: Array<{
  day: number;
  title: string;
  description: string;
  amount: number | ((year: number, month: number) => number);
  type: TransactionType;
  categoryName: string;
  paymentMethod: PaymentMethod;
}> = [
  {
    day: 1,
    title: "Monthly salary",
    description: "Credit of monthly salary from employer",
    amount: 50_000,
    type: "income",
    categoryName: "Salary",
    paymentMethod: "BANK_TRANSFER",
  },
  {
    day: 2,
    title: "House rent",
    description: "Monthly rent paid to landlord",
    amount: 12_000,
    type: "expense",
    categoryName: "Housing",
    paymentMethod: "UPI",
  },
  {
    day: 4,
    title: "Metro card recharge",
    description: "BMTC/metro travel for the week",
    amount: 400,
    type: "expense",
    categoryName: "Transportation",
    paymentMethod: "UPI",
  },
  {
    day: 6,
    title: "Weekly groceries",
    description: "Vegetables, milk and staples from DMart",
    amount: (year, month) => 150 + ((year + month * 17) % 1051),
    type: "expense",
    categoryName: "Food & Drinks",
    paymentMethod: "UPI",
  },
  {
    day: 7,
    title: "Internet bill",
    description: "Fibre broadband monthly plan",
    amount: 799,
    type: "expense",
    categoryName: "Housing",
    paymentMethod: "UPI",
  },
  {
    day: 8,
    title: "Netflix",
    description: "Netflix mobile plan subscription",
    amount: 649,
    type: "expense",
    categoryName: "Life & Entertainment",
    paymentMethod: "CREDIT_CARD",
  },
  {
    day: 11,
    title: "Mobile recharge",
    description: "Jio prepaid pack",
    amount: 399,
    type: "expense",
    categoryName: "Other financial expense",
    paymentMethod: "UPI",
  },
  {
    day: 12,
    title: "Petrol",
    description: "Fuel fill at Indian Oil",
    amount: (year, month) => 1_650 + ((year + month) % 5) * 80,
    type: "expense",
    categoryName: "Vehicle",
    paymentMethod: "CREDIT_CARD",
  },
  {
    day: 15,
    title: "Electricity bill",
    description: "BESCOM monthly electricity charges",
    amount: (year, month) => 1_680 + ((month * 37) % 420),
    type: "expense",
    categoryName: "Housing",
    paymentMethod: "UPI",
  },
];

const oneOffTemplates: Array<{
  monthsAgo: number;
  day: number;
  title: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryName: string;
  paymentMethod: PaymentMethod;
}> = [
  {
    monthsAgo: 3,
    day: 9,
    title: "Freelance landing page",
    description: "Invoice for a small website redesign",
    amount: 18_500,
    type: "income",
    categoryName: "Freelancing",
    paymentMethod: "BANK_TRANSFER",
  },
  {
    monthsAgo: 3,
    day: 18,
    title: "Amazon order",
    description: "Kitchen container set",
    amount: 1_249,
    type: "expense",
    categoryName: "Shopping",
    paymentMethod: "CREDIT_CARD",
  },
  {
    monthsAgo: 3,
    day: 22,
    title: "Auto rickshaw",
    description: "Auto from office to metro",
    amount: 160,
    type: "expense",
    categoryName: "Transportation",
    paymentMethod: "CASH",
  },
  {
    monthsAgo: 2,
    day: 27,
    title: "Swiggy dinner",
    description: "Biryani order for two",
    amount: 620,
    type: "expense",
    categoryName: "Food & Drinks",
    paymentMethod: "UPI",
  },
  {
    monthsAgo: 1,
    day: 10,
    title: "Freelance API work",
    description: "Weekend contract for reporting APIs",
    amount: 12_500,
    type: "income",
    categoryName: "Freelancing",
    paymentMethod: "BANK_TRANSFER",
  },
  {
    monthsAgo: 1,
    day: 16,
    title: "Myntra order",
    description: "Casual shirts sale",
    amount: 1_899,
    type: "expense",
    categoryName: "Shopping",
    paymentMethod: "DEBIT_CARD",
  },
  {
    monthsAgo: 0,
    day: 3,
    title: "Local auto",
    description: "Auto to the railway station",
    amount: 90,
    type: "expense",
    categoryName: "Transportation",
    paymentMethod: "CASH",
  },
  {
    monthsAgo: 0,
    day: 5,
    title: "Freelance bugfix",
    description: "Small production hotfix billed hourly",
    amount: 8_000,
    type: "income",
    categoryName: "Freelancing",
    paymentMethod: "BANK_TRANSFER",
  },
  {
    monthsAgo: 0,
    day: 9,
    title: "Flipkart order",
    description: "Headphones replacement",
    amount: 2_199,
    type: "expense",
    categoryName: "Shopping",
    paymentMethod: "CREDIT_CARD",
  },
  {
    monthsAgo: 0,
    day: 13,
    title: "Swiggy dinner",
    description: "South Indian thali delivery",
    amount: 540,
    type: "expense",
    categoryName: "Food & Drinks",
    paymentMethod: "UPI",
  },
];

const budgetTargets: Array<{
  categoryName: string;
  band: "under" | "mid" | "warn" | "over";
}> = [
  { categoryName: "Housing", band: "under" },
  { categoryName: "Food & Drinks", band: "warn" },
  { categoryName: "Transportation", band: "over" },
  { categoryName: "Shopping", band: "mid" },
  { categoryName: "Life & Entertainment", band: "mid" },
];

const fallbackSpend: Record<string, { title: string; description: string; amount: number; paymentMethod: PaymentMethod }> =
  {
    Housing: {
      title: "House rent",
      description: "Monthly rent paid to landlord",
      amount: 12_000,
      paymentMethod: "UPI",
    },
    "Food & Drinks": {
      title: "Tea and snacks",
      description: "Office canteen snacks",
      amount: 180,
      paymentMethod: "UPI",
    },
    Transportation: {
      title: "Metro token",
      description: "Single journey metro tokens",
      amount: 60,
      paymentMethod: "UPI",
    },
    Shopping: {
      title: "Stationery",
      description: "Notebooks and pens",
      amount: 249,
      paymentMethod: "CASH",
    },
    "Life & Entertainment": {
      title: "Movie tickets",
      description: "Weekend PVR tickets",
      amount: 450,
      paymentMethod: "DEBIT_CARD",
    },
  };

const round2 = (value: number) => Math.round(value * 100) / 100;

const addMonths = (year: number, month: number, delta: number) => {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
};

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const utcDay = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day, 10, 0, 0));

const resolveUsername = () =>
  (process.argv[2] ?? process.env.DEMO_USERNAME ?? ALLOWED_USERNAME)
    .trim()
    .toLowerCase();

const databaseHost = (url: string) => {
  try {
    return new URL(url).hostname || "unknown";
  } catch {
    return "unknown";
  }
};

const amountForBand = (spent: number, band: "under" | "mid" | "warn" | "over") => {
  if (spent <= 0) {
    return band === "over" ? 100 : 5_000;
  }
  const ratio = { under: 0.4, mid: 0.62, warn: 0.88, over: 1.18 }[band];
  return Math.max(round2(spent / ratio), 1);
};

const monthWindows = (today: Date): MonthWindow[] => {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();
  const windows: MonthWindow[] = [];
  for (let ago = 3; ago >= 0; ago -= 1) {
    const stamp = addMonths(year, month, -ago);
    windows.push({
      year: stamp.year,
      month: stamp.month,
      lastDay: ago === 0 ? day : daysInMonth(stamp.year, stamp.month),
      isCurrent: ago === 0,
    });
  }
  return windows;
};

const seedDemo = async () => {
  const username = resolveUsername();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exitCode = 1;
    return;
  }

  if (username !== ALLOWED_USERNAME && !process.env.DEMO_USERNAME_ALLOW) {
    console.error(
      `Refusing to seed user "${username}". Only "${ALLOWED_USERNAME}" is allowed unless DEMO_USERNAME_ALLOW is set.`,
    );
    process.exitCode = 1;
    return;
  }

  const host = databaseHost(databaseUrl);
  console.log(`Database host: ${host}`);

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.error(
      `User "${username}" was not found. Create the account first; this script does not create users or change passwords.`,
    );
    process.exitCode = 1;
    return;
  }

  const categories = await prisma.category.findMany({
    where: { isDefault: true, isArchived: false },
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const requireCategory = (name: string) => {
    const category = categoryByName.get(name);
    if (!category) {
      throw new Error(
        `Default category "${name}" was not found. Run npm run seed:categories first.`,
      );
    }
    return category;
  };

  const today = new Date();
  const windows = monthWindows(today);
  const current = windows[windows.length - 1];
  if (!current) {
    throw new Error("Failed to build month windows");
  }

  const drafts: TxDraft[] = [];

  for (const window of windows) {
    for (const template of monthlyTemplates) {
      if (template.day > window.lastDay) continue;
      const amount =
        typeof template.amount === "function"
          ? round2(template.amount(window.year, window.month))
          : template.amount;
      drafts.push({
        title: template.title,
        description: template.description,
        amount,
        type: template.type,
        categoryName: template.categoryName,
        paymentMethod: template.paymentMethod,
        year: window.year,
        month: window.month,
        day: template.day,
      });
    }
  }

  for (const template of oneOffTemplates) {
    const stamp = addMonths(current.year, current.month, -template.monthsAgo);
    const window = windows.find(
      (item) => item.year === stamp.year && item.month === stamp.month,
    );
    if (!window || template.day > window.lastDay) continue;
    drafts.push({
      title: template.title,
      description: template.description,
      amount: template.amount,
      type: template.type,
      categoryName: template.categoryName,
      paymentMethod: template.paymentMethod,
      year: stamp.year,
      month: stamp.month,
      day: template.day,
    });
  }

  const currentKey = (categoryName: string) =>
    drafts.some(
      (draft) =>
        draft.type === "expense" &&
        draft.categoryName === categoryName &&
        draft.year === current.year &&
        draft.month === current.month,
    );

  for (const target of budgetTargets) {
    if (currentKey(target.categoryName)) continue;
    const fallback = fallbackSpend[target.categoryName];
    if (!fallback) continue;
    drafts.push({
      title: fallback.title,
      description: fallback.description,
      amount: fallback.amount,
      type: "expense",
      categoryName: target.categoryName,
      paymentMethod: fallback.paymentMethod,
      year: current.year,
      month: current.month,
      day: Math.min(current.lastDay, 1),
    });
  }

  const deletedTx = await prisma.transaction.deleteMany({ where: { userId: user.id } });
  const deletedBudgets = await prisma.budget.deleteMany({ where: { userId: user.id } });

  await prisma.transaction.createMany({
    data: drafts.map((draft) => ({
      userId: user.id,
      categoryId: requireCategory(draft.categoryName).id,
      title: draft.title,
      amount: draft.amount,
      type: draft.type,
      date: utcDay(draft.year, draft.month, draft.day),
      description: draft.description,
      paymentMethod: draft.paymentMethod,
    })),
  });

  const currentStart = new Date(Date.UTC(current.year, current.month - 1, 1));
  const currentEnd = new Date(Date.UTC(current.year, current.month, 1));
  const spentRows = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: user.id,
      type: "expense",
      date: { gte: currentStart, lt: currentEnd },
      categoryId: {
        in: budgetTargets.map((target) => requireCategory(target.categoryName).id),
      },
    },
    _sum: { amount: true },
  });
  const spentByCategoryId = new Map(
    spentRows.map((row) => [row.categoryId, Number(row._sum.amount ?? 0)]),
  );

  const budgets = budgetTargets.map((target) => {
    const category = requireCategory(target.categoryName);
    const spent = spentByCategoryId.get(category.id) ?? 0;
    const amount = amountForBand(spent, target.band);
    return { category, spent, amount, band: target.band };
  });

  await prisma.budget.createMany({
    data: budgets.map((budget) => ({
      userId: user.id,
      categoryId: budget.category.id,
      amount: budget.amount,
      month: current.month,
      year: current.year,
    })),
  });

  const incomeCount = drafts.filter((draft) => draft.type === "income").length;
  const expenseCount = drafts.filter((draft) => draft.type === "expense").length;

  console.log(`Seeded existing user "${user.username}" (${user.id})`);
  console.log(
    `Removed ${deletedTx.count} transactions and ${deletedBudgets.count} budgets`,
  );
  console.log(
    `Inserted ${drafts.length} transactions (${incomeCount} income, ${expenseCount} expense) from ${windows[0]?.year}-${String(windows[0]?.month).padStart(2, "0")} through ${current.year}-${String(current.month).padStart(2, "0")}`,
  );
  console.log(`Inserted ${budgets.length} budgets for ${current.year}-${String(current.month).padStart(2, "0")}:`);
  for (const budget of budgets) {
    const pct = budget.amount === 0 ? 0 : Math.round((budget.spent / budget.amount) * 100);
    console.log(
      `  ${budget.category.name}: limit ${budget.amount.toFixed(2)}, spent ${budget.spent.toFixed(2)} (${pct}% ${budget.band})`,
    );
  }
};

seedDemo()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
