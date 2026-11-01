import { timingSafeEqual } from "crypto";
import { db } from "@/lib/supabase";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(token), b = Buffer.from(process.env.WISFY_SECRET_TOKEN || "");
  if (!b.length || a.length !== b.length || !timingSafeEqual(a, b))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  const p = await req.json();
  const c = p.payment_candidate;
  if (p.event === "wisfy.test" || p.event_type === "wisfy.test" || c?.provider === "system_test")
    return Response.json({ success: true, test: true });
  if (p.event_type !== "sms.payment_candidate" || c?.status !== "parsed_candidate")
    return Response.json({ success: true, ignored: true });

  const trx = String(c.transaction_id).toUpperCase();
  const s = db();
  const { error } = await s.from("payments").insert({
    event_id: p.event_id,
    idempotency_key: p.deduplication?.idempotency_key ?? `${c.provider}:${trx}`,
    provider: c.provider,
    trx_id: trx,
    amount: Number(String(c.amount).replace(/,/g, "")),
    sim_slot: p.sim_slot,
    raw: p,
  });
  if (error) {
    if (error.code === "23505") return Response.json({ success: true, duplicate: true });
    return Response.json({ error: error.message }, { status: 500 });
  }
  const { data: inv } = await s.from("invoices").select("id").eq("status", "pending").eq("submitted_trx", trx).limit(1);
  if (inv?.[0]) await s.rpc("try_match", { p_invoice: inv[0].id });
  return Response.json({ success: true });
}
