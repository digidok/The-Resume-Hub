// Free/personal webmail providers — employers must sign up with a work
// email so the account is tied to a verifiable company, not a personal inbox.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.za",
  "yahoo.co.uk",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.za",
  "hotmail.co.uk",
  "live.com",
  "live.co.za",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "zoho.com",
  "webmail.co.za",
]);

export function isFreeEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return Boolean(domain && FREE_EMAIL_DOMAINS.has(domain));
}
