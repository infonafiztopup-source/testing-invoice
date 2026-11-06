import { createHash, timingSafeEqual } from "crypto";
import { db } from "./supabase";

export const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");
const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// Accepts (1) a per-pairing key made on /setup, or (2) the optional static WISFY_SECRET_TOKEN env var.
// A pairing key must be used within its expiry window the first time; that first authenticated
// request marks it as paired, and it then stays valid until you revoke it.
export async function authorize(req: Request): Promise<boolean> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const fixed = process.env.WISFY_SECRET_TOKEN;
  if (fixed && safeEq(token, fixed)) return true;
  const s = db();
  const { data } = await s.from("pairing_keys").select("id,expires_at,verified_at,revoked").eq("key_hash", hashKey(token)).maybeSingle();
  if (!data || data.revoked) return false;
  if (!data.verified_at) {
    if (new Date(data.expires_at) < new Date()) return false;
    await s.from("pairing_keys").update({ verified_at: new Date().toISOString() }).eq("id", data.id);
  }
  return true;
}
