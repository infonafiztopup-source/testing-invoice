import { db } from "@/lib/supabase";
type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const { data } = await db().from("invoices").select("status,paid_trx").eq("id", id).single();
  return Response.json(data ?? { status: "missing" });
}
// Customer submits TrxID. If the SMS already arrived it matches now; otherwise the webhook matches it later.
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json();
  const trx = String(b.trx || "").trim().toUpperCase();
  if (trx.length < 6) return Response.json({ error: "সঠিক ট্রানজ্যাকশন আইডি দিন" }, { status: 400 });
  const s = db();
  await s.from("invoices").update({ submitted_trx: trx, method: b.method }).eq("id", id).eq("status", "pending");
  await s.rpc("try_match", { p_invoice: id });
  const { data } = await s.from("invoices").select("status,paid_trx").eq("id", id).single();
  return Response.json(data);
}
