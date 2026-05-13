import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "pelada_admin_sess";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Usuário fixo configurável. Em produção defina `ADMIN_PASSWORD` (e idealmente `ADMIN_USER`). */
export function getAdminCredentials(): { user: string; password: string } | null {
  const user = process.env.ADMIN_USER?.trim() || "admin";
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (password) return { user, password };
  if (process.env.NODE_ENV !== "production") {
    return { user, password: "admin" };
  }
  return null;
}

export function getSessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV !== "production") {
    return "dev-admin-session-secret-substitua-em-prod";
  }
  return null;
}

export function createAdminSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const exp = Date.now() + TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url"
  );
  const sig = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const secret = getSessionSecret();
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  try {
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))
    ) {
      return false;
    }
  } catch {
    return false;
  }
  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: number };
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}
