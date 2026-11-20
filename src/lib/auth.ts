// المصادقة والأمان: جلسات موقعة بـ HMAC، كلمة مرور مشفرة بـ scrypt، حماية جميع مسارات الإدارة من الخادم
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { getSetting, setSetting } from "./settings";

const COOKIE_NAME = "asba_session";
const SESSION_DAYS = 7;

// ---------- أدوات التشفير ----------

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function hmacSha256(secret: string, msg: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(msg).digest());
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---------- المفتاح السري ----------

async function getSessionSecret(): Promise<string> {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // يُولَّد عشوائيًا مرة واحدة ويُخزَّن في قاعدة البيانات — ثابت عبر جميع خوادم الدوال
  let secret = await getSetting("session_secret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    await setSetting("session_secret", secret);
  }
  return secret;
}

// ---------- الجلسات ----------

export async function signSession(username: string): Promise<string> {
  const payload = b64url(
    Buffer.from(
      JSON.stringify({ u: username, exp: Date.now() + SESSION_DAYS * 864e5 })
    )
  );
  const secret = await getSessionSecret();
  return `${payload}.${hmacSha256(secret, payload)}`;
}

export async function verifySession(
  token?: string | null
): Promise<{ u: string } | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const secret = await getSessionSecret();
  if (!safeEqual(sig, hmacSha256(secret, payload))) return null;
  try {
    const data = JSON.parse(b64urlDecode(payload).toString("utf8"));
    if (!data || typeof data.u !== "string") return null;
    if (!data.exp || Date.now() > data.exp) return null;
    return { u: data.u };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ u: string } | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}

export async function requireAuth(req?: NextRequest): Promise<{ u: string } | null> {
  const token = req
    ? req.cookies.get(COOKIE_NAME)?.value
    : (await cookies()).get(COOKIE_NAME)?.value;
  return verifySession(token);
}

export async function setSessionCookie(username: string, https: boolean): Promise<void> {
  const token = await signSession(username);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ---------- كلمة المرور ----------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyScrypt(password: string, stored: string): boolean {
  try {
    const [algo, salt, hash] = stored.split(":");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
    return safeEqual(candidate, hash);
  } catch {
    return false;
  }
}

/** التحقق من كلمة المرور: الأفضلية لما محفوظ في قاعدة البيانات ثم متغير البيئة */
export async function checkCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const storedUser =
    (await getSetting("admin_username")) || process.env.ADMIN_USERNAME || "admin";
  if (username !== storedUser) return false;
  const storedHash = await getSetting("admin_password_hash");
  if (storedHash) return verifyScrypt(password, storedHash);
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && envPassword.length >= 4) {
    return safeEqual(password, envPassword);
  }
  return false;
}

export async function getAdminUsername(): Promise<string> {
  return (
    (await getSetting("admin_username")) ||
    process.env.ADMIN_USERNAME ||
    "admin"
  );
}

// ---------- حماية من تكرار محاولات الدخول ----------

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;

export function rateLimit(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count++;
  return true;
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
