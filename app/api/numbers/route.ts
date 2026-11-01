import { db, isAdmin } from "@/lib/supabase";
const no = () => Response.json({ error: "unauthorized" }, { status: 401 });
export async function GET(req: Request) {
  if (!isAdmin(req)) return no();
  const { data } = await db().from("payment_numbers").select("*").order("created_at", { ascending: false });
  return Response.json(data ?? []);
}
export async function POST(req: Request) {
  if (!isAdmin(req)) return no();
  const b = await req.json();
  const { error } = await db().from("payment_numbers").insert({ provider: b.provider, number: String(b.number).trim(), kind: b.kind || "Payment" });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return no();
  const id = new URL(req.url).searchParams.get("id")!;
  await db().from("payment_numbers").delete().eq("id", id);
  return Response.json({ ok: true });
}
