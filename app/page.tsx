"use client";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { ORDER, PROVIDERS, Provider } from "@/lib/providers";

export default function Admin() {
  const [key, setKey] = useState("");
  const [ok, setOk] = useState(false);
  const [nums, setNums] = useState<any[]>([]);
  const [invs, setInvs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [n, setN] = useState({ provider: "bkash", number: "", kind: "Payment" });
  const [i, setI] = useState({ title: "", customer_name: "", amount: "" });

  const api = (url: string, method = "GET", body?: any) =>
    fetch(url, { method, headers: { "x-admin-key": key, "content-type": "application/json" }, body: body && JSON.stringify(body) });

  async function load() {
    const [a, b] = await Promise.all([api("/api/numbers"), api("/api/invoices")]);
    if (a.status === 401) { setMsg("Admin key ভুল"); setOk(false); return; }
    setNums(await a.json()); setInvs(await b.json()); setOk(true); setMsg("");
    sessionStorage.setItem("ak", key);
  }
  useEffect(() => { const k = sessionStorage.getItem("ak"); if (k) setKey(k); }, []);
  useEffect(() => { if (ok) { const t = setInterval(load, 5000); return () => clearInterval(t); } }, [ok, key]);

  if (!ok) return (
    <div className="wrap"><h1>Invoice Test</h1><p className="muted">Admin key দিয়ে ঢুকুন</p>
      <div className="box"><input type="password" placeholder="ADMIN_KEY" value={key} onChange={(e) => setKey(e.target.value)} />
        <p className="err">{msg}</p><button onClick={load}>Enter</button></div></div>);

  return (
    <div className="wrap wide">
      <h1>Invoice Test</h1><p className="muted">টেস্টিং এর জন্য — invoice বানান, payment number যোগ করুন</p>

      <h2>Payment numbers</h2>
      <div className="box">
        <div className="row">
          <select value={n.provider} onChange={(e) => setN({ ...n, provider: e.target.value })}>
            {ORDER.map((p) => <option key={p} value={p}>{PROVIDERS[p].name}</option>)}
          </select>
          <input placeholder="01XXXXXXXXX" value={n.number} onChange={(e) => setN({ ...n, number: e.target.value })} />
          <select value={n.kind} onChange={(e) => setN({ ...n, kind: e.target.value })}>
            <option>Payment</option><option>Personal</option><option>Agent</option>
          </select>
          <button style={{ flex: "0 0 auto" }} onClick={async () => { await api("/api/numbers", "POST", n); setN({ ...n, number: "" }); load(); }}>Add number</button>
        </div>
        <div style={{ marginTop: 8 }}>
          {nums.length === 0 && <p className="muted">এখনো কোনো নম্বর নেই</p>}
          {nums.map((x) => (
            <div className="item" key={x.id}><Logo p={x.provider as Provider} size={30} />
              <div className="grow"><b>{x.number}</b> <span className="muted">{PROVIDERS[x.provider as Provider].name} · {x.kind}</span></div>
              <button className="ghost" onClick={async () => { await api("/api/numbers?id=" + x.id, "DELETE"); load(); }}>Remove</button></div>))}
        </div>
      </div>

      <h2>New invoice</h2>
      <div className="box"><div className="row">
        <input placeholder="Title (যেমন: Weekly 1x)" value={i.title} onChange={(e) => setI({ ...i, title: e.target.value })} />
        <input placeholder="Customer name (optional)" value={i.customer_name} onChange={(e) => setI({ ...i, customer_name: e.target.value })} />
        <input placeholder="Amount (৳)" inputMode="decimal" value={i.amount} onChange={(e) => setI({ ...i, amount: e.target.value })} />
        <button style={{ flex: "0 0 auto" }} onClick={async () => {
          const r = await api("/api/invoices", "POST", i);
          if (!r.ok) { setMsg((await r.json()).error); return; }
          setI({ title: "", customer_name: "", amount: "" }); setMsg(""); load();
        }}>Create invoice</button></div><p className="err">{msg}</p></div>

      <h2>Invoices</h2>
      <div className="box">
        {invs.length === 0 && <p className="muted">এখনো কোনো invoice নেই</p>}
        {invs.map((v) => (
          <div className="item" key={v.id}>
            <div className="grow"><b>{v.title}</b> <span className="muted">৳{v.amount}{v.customer_name ? " · " + v.customer_name : ""}</span>
              {v.paid_trx && <div className="muted">TrxID {v.paid_trx}</div>}</div>
            <span className={"tag " + (v.status === "paid" ? "paid" : "")}>{v.status}</span>
            <button className="ghost" onClick={() => { navigator.clipboard.writeText(location.origin + "/pay/" + v.id); setMsg("Link copied"); }}>Copy link</button>
            <a href={"/pay/" + v.id} target="_blank"><button className="ghost">Open</button></a>
          </div>))}
      </div>
    </div>
  );
}
