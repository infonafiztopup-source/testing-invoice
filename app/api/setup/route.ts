import { db, isAdmin } from "@/lib/supabase";
export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const env = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_KEY: !!process.env.ADMIN_KEY,
  };
  const fixedToken = !!process.env.WISFY_SECRET_TOKEN;
  let dbOk = false, dbError = "", payments: any[] = [], keys: any[] = [], keysError = "";
  try {
    const s = db();
    const p = await s.from("payments").select("provider,trx_id,amount,sim_slot,invoice_id,created_at").order("created_at", { ascending: false }).limit(10);
    if (p.error) dbError = p.error.message; else { dbOk = true; payments = p.data ?? []; }
    const k = await s.from("pairing_keys").select("id,created_at,expires_at,verified_at,revoked").order("created_at", { ascending: false }).limit(8);
    if (k.error) keysError = k.error.message; else keys = k.data ?? [];
  } catch (e: any) { dbError = String(e?.message || e); }
  return Response.json({ env, fixedToken, dbOk, dbError, payments, keys, keysError });
}
