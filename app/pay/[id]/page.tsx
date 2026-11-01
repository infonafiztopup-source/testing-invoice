import { db } from "@/lib/supabase";
import PayClient from "./PayClient";
export const dynamic = "force-dynamic";
export default async function Pay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = db();
  const { data: inv } = await s.from("invoices").select("id,title,amount,status,paid_trx").eq("id", id).maybeSingle();
  if (!inv) return <div className="wrap"><h1>Invoice পাওয়া যায়নি</h1></div>;
  const { data: nums } = await s.from("payment_numbers").select("provider,number,kind").eq("active", true).order("created_at");
  return <PayClient inv={inv} nums={nums ?? []} />;
}
