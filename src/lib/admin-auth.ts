import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "opengap_admin";
const WEEK = 60 * 60 * 24 * 7;

export function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

export function adminSessionToken() {
  const secret = adminPassword();
  if (!secret) return "";
  return createHmac("sha256", secret).update("opengap.admin.session.v1").digest("hex");
}

export function passwordsMatch(input: string, expected: string) {
  if (!input || !expected) return false;
  const left = createHmac("sha256", "opengap.admin").update(input).digest();
  const right = createHmac("sha256", "opengap.admin").update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function isAdminSession() {
  const token = adminSessionToken();
  if (!token) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  if (!value || value.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(token));
}

export async function setAdminSession() {
  const token = adminSessionToken();
  if (!token) throw new Error("ADMIN_PASSWORD is not set");
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
