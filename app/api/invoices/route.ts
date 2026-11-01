import { db, isAdmin } from "@/lib/supabase";
const no = () => Response.json({ error: "unauthorized" }, { status: 401 });
export async function GET(req: Request) {
  if (!isAdmin(req)) return no();
  const { data } = await db().from("invoices").select("*").order("created_at", { ascending: false }).limit(50);
  return Response.json(data ?? []);
}
export async function POST(req: Request) {
  if (!isAdmin(req)) return no();
  const b = await req.json();
  const amount = Number(b.amount);
  if (!b.title || !(amount > 0)) return Response.json({ error: "title and amount required" }, { status: 400 });
  const { data, error } = await db().from("invoices").insert({ title: b.title, customer_name: b.customer_name || null, amount }).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json(data);
}
