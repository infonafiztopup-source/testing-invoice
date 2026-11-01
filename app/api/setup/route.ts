import { db, isAdmin } from "@/lib/supabase";
export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const env = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_KEY: !!process.env.ADMIN_KEY,
    WISFY_SECRET_TOKEN: !!process.env.WISFY_SECRET_TOKEN,
  };
  let dbOk = false, dbError = "", payments: any[] = [];
  try {
    const { data, error } = await db().from("payments").select("provider,trx_id,amount,sim_slot,invoice_id,created_at").order("created_at", { ascending: false }).limit(10);
    if (error) dbError = error.message; else { dbOk = true; payments = data ?? []; }
  } catch (e: any) { dbError = String(e?.message || e); }
  return Response.json({ env, dbOk, dbError, payments });
}
