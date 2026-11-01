"use client";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { ORDER, PROVIDERS, Provider, bn, steps } from "@/lib/providers";

export default function PayClient({ inv, nums }: { inv: any; nums: any[] }) {
  const avail = ORDER.filter((p) => nums.some((n) => n.provider === p));
  const [sel, setSel] = useState<Provider | null>(null);
  const [trx, setTrx] = useState("");
  const [status, setStatus] = useState(inv.status);
  const [paidTrx, setPaidTrx] = useState(inv.paid_trx);
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const amount = Number(inv.amount).toFixed(2);

  useEffect(() => {
    if (!waiting || status === "paid") return;
    const t = setInterval(async () => {
      const r = await (await fetch("/api/invoices/" + inv.id)).json();
      if (r.status === "paid") { setStatus("paid"); setPaidTrx(r.paid_trx); }
    }, 3000);
    return () => clearInterval(t);
  }, [waiting, status]);

  if (status === "paid")
    return (<div className="wrap"><div className="box ok"><h1>পেমেন্ট সম্পন্ন হয়েছে</h1>
      <p>{inv.title} · ৳{bn(amount)}</p><p className="muted">TrxID {paidTrx}</p></div></div>);

  async function verify() {
    setErr("");
    const r = await fetch("/api/invoices/" + inv.id, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trx, method: sel }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); return; }
    if (j.status === "paid") { setStatus("paid"); setPaidTrx(j.paid_trx); } else setWaiting(true);
  }

  const head = (<><h1>অর্ডার পেমেন্ট করুন</h1><p className="muted">{inv.title} · ৳{bn(amount)}</p></>);
  if (avail.length === 0) return <div className="wrap">{head}<div className="box">এখনো কোনো payment number যোগ করা হয়নি।</div></div>;

  if (!sel) return (
    <div className="wrap">{head}
      <div className="box"><b>কোন মাধ্যমে পাঠাবেন?</b><p className="muted">মাধ্যম বেছে নিলে পেমেন্ট নম্বর ও নির্দেশনা দেখা যাবে।</p>
        {avail.map((p) => (<div key={p} className="item" style={{ cursor: "pointer" }} onClick={() => setSel(p)}>
          <Logo p={p} size={44} /><b className="grow">{PROVIDERS[p].name}</b><span>›</span></div>))}</div></div>);

  const P = PROVIDERS[sel];
  const num = nums.find((n) => n.provider === sel);
  return (
    <div className="wrap">{head}
      <a href="#" className="muted" onClick={(e) => { e.preventDefault(); setSel(null); }}>‹ অন্য মাধ্যম বেছে নিন</a>
      <div className="tabs" style={{ marginTop: 8 }}>
        {avail.map((p) => (<button key={p} className="tab" onClick={() => setSel(p)} style={sel === p ? { background: PROVIDERS[p].color, color: "#fff" } : {}}>
          <Logo p={p} size={26} />{PROVIDERS[p].name}</button>))}
      </div>
      <div className="card" style={{ background: P.color }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Logo p={sel} size={36} /><b className="grow">{P.name}</b>
          <div className="amt">৳{bn(amount)}</div></div>
        <p style={{ margin: "14px 0 0", fontWeight: 600 }}>এই নম্বরে টাকা পাঠান</p>
        <div className="num"><b>{num.number}</b>
          <button onClick={() => { navigator.clipboard.writeText(num.number); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "কপি হয়েছে" : "কপি"}</button></div>
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>ট্রানজ্যাকশন আইডি</p>
        <input placeholder="ট্রানজ্যাকশন আইডি দিন" value={trx} onChange={(e) => setTrx(e.target.value)} disabled={waiting} />
        <div className="steps">{steps(sel, amount).map((t, k) => <div key={k}><span>{bn(k + 1)}.</span><span>{t}</span></div>)}</div>
        <button className="vbtn" onClick={verify} disabled={waiting || trx.trim().length < 6}>{waiting ? "SMS এর জন্য অপেক্ষা করা হচ্ছে…" : "ভেরিফাই"}</button>
        {err && <p className="err" style={{ color: "#fff" }}>{err}</p>}
        {waiting && <p style={{ fontSize: 13 }}>পেমেন্ট SMS আসলেই এই পেজ নিজে থেকে আপডেট হবে।</p>}
      </div>
    </div>
  );
}
