const STORAGE_KEY = "financehub-last-account-id";

type AccountChoice = {
  id: string;
  isDefault: boolean;
  isArchived: boolean;
};

export const readLastAccountId = (): string | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.trim() !== "" ? value : null;
  } catch {
    return null;
  }
};

export const writeLastAccountId = (id: string) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private mode or quota — last-account is a convenience only.
  }
};

export const defaultCreateAccountId = (accounts: AccountChoice[]): string => {
  const active = accounts.filter((account) => !account.isArchived);
  const stored = readLastAccountId();
  if (stored && active.some((account) => account.id === stored)) {
    return stored;
  }
  const nonDefault = active.find((account) => !account.isDefault);
  if (nonDefault) return nonDefault.id;
  return active.find((account) => account.isDefault)?.id ?? active[0]?.id ?? "";
};
