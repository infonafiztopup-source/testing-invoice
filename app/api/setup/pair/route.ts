import { randomBytes } from "crypto";
import { db, isAdmin } from "@/lib/supabase";
import { hashKey } from "@/lib/wisfy-auth";

const no = () => Response.json({ error: "unauthorized" }, { status: 401 });

// New secret every time. Only its hash is stored, so the key is shown once.
export async function POST(req: Request) {
  if (!isAdmin(req)) return no();
  const key = "whsec_temp_" + randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error } = await db().from("pairing_keys").insert({ key_hash: hashKey(key), expires_at: expires });
  if (error) return Response.json({ error: error.message + " (supabase/pairing.sql রান করেছেন?)" }, { status: 500 });
  return Response.json({ key, url: new URL(req.url).origin + "/api/webhooks/wisfy-sms", expires_at: expires });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return no();
  const id = new URL(req.url).searchParams.get("id")!;
  await db().from("pairing_keys").update({ revoked: true }).eq("id", id);
  return Response.json({ ok: true });
}
