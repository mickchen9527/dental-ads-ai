export const AUTH_COOKIE_NAME = "dental_ads_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function createAdminSessionToken(password: string) {
  const input = new TextEncoder().encode(`dental-ads-ai:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidAdminSession(cookieValue?: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !cookieValue) {
    return false;
  }

  const expectedToken = await createAdminSessionToken(adminPassword);
  return cookieValue === expectedToken;
}
