export const ACTIVE_ACCOUNT_KEY = "efp-active-account";
const DEMO_ACCOUNTS_KEY = "efp-demo-accounts";
const LEGACY_USER_KEY = "efp-demo-user";
const LEGACY_DATA_KEYS = ["efp-questionnaire-draft", "efp-business-context", "efp-requirement-statuses"];

export type LocalAccount = { id: string; email: string; name: string };

export function accountId(email: string) {
  return encodeURIComponent(email.trim().toLocaleLowerCase("en-US"));
}

export function scopedStorageKey(key: string) {
  const id = typeof window === "undefined" ? null : localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  return `${key}:${id || "guest"}`;
}

export function getDemoAccounts(): LocalAccount[] {
  try {
    const value = localStorage.getItem(DEMO_ACCOUNTS_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as LocalAccount[] : [];
  } catch {
    return [];
  }
}

function migrateLegacyAccount() {
  try {
    const rawProfile = localStorage.getItem(LEGACY_USER_KEY);
    if (!rawProfile) return;
    const legacy = JSON.parse(rawProfile) as { email?: string; name?: string };
    if (!legacy.email) return;
    const email = legacy.email.trim().toLocaleLowerCase("en-US");
    const id = accountId(email);
    const accounts = getDemoAccounts();
    if (!accounts.some(account => account.email === email)) {
      accounts.push({ id, email, name: legacy.name?.trim() || "Emprendedor" });
      localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    for (const key of LEGACY_DATA_KEYS) {
      const oldValue = localStorage.getItem(key);
      const scopedKey = `${key}:${id}`;
      if (oldValue && !localStorage.getItem(scopedKey)) localStorage.setItem(scopedKey, oldValue);
      localStorage.removeItem(key);
    }
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    // Leave malformed legacy data untouched rather than assigning it to another account.
  }
}

export function saveDemoAccount(email: string, name: string): LocalAccount | null {
  migrateLegacyAccount();
  const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
  const accounts = getDemoAccounts();
  if (accounts.some(account => account.email === normalizedEmail)) return null;
  const account = { id: accountId(normalizedEmail), email: normalizedEmail, name: name.trim() || "Emprendedor" };
  localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.id);
  return account;
}

export function activateDemoAccount(email: string): LocalAccount | null {
  migrateLegacyAccount();
  const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
  const account = getDemoAccounts().find(item => item.email === normalizedEmail);
  if (!account) return null;
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.id);
  return account;
}

export function activateAccount(email: string) {
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId(email));
}
