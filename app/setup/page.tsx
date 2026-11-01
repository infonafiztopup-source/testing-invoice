"use client";
import { useEffect, useState } from "react";

const Copy = ({ text }: { text: string }) => {
  const [c, setC] = useState(false);
  return <button className="ghost" onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1200); }}>{c ? "Copied" : "Copy"}</button>;
};

export default function Setup() {
  const [origin, setOrigin] = useState("");
  const [key, setKey] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("155");
  const [trx, setTrx] = useState("TEST123456");
  const [provider, setProvider] = useState("bkash");
  const [out, setOut] = useState("");
  const url = origin + "/api/webhooks/wisfy-sms";

  async function load(k = key) {
    const r = await fetch("/api/setup", { headers: { "x-admin-key": k } });
    if (r.status === 401) { setErr("Admin key দিন (আগে হোম পেজে লগইন করুন)"); return; }
    setErr(""); setInfo(await r.json());
  }
  useEffect(() => {
    setOrigin(location.origin);
    const k = sessionStorage.getItem("ak") || ""; setKey(k); if (k) load(k);
  }, []);

  async function send(body: any) {
    setOut("পাঠানো হচ্ছে…");
    const r = await fetch("/api/webhooks/wisfy-sms", { method: "POST", headers: { Authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) });
    setOut(r.status + " " + (await r.text())); load();
  }
  const ping = () => send({ event: "wisfy.test", event_type: "wisfy.test" });
  const fake = () => send({
    event: "sms.received", event_type: "sms.payment_candidate", event_id: "evt_test_" + Date.now(), sim_slot: 1,
    deduplication: { idempotency_key: `${provider}:${trx}` },
    payment_candidate: { provider, status: "parsed_candidate", amount: Number(amount).toFixed(2), transaction_id: trx },
  });

  return (
    <div className="wrap wide">
      <h1>App setup</h1>
      <p className="muted"><a href="/">← Admin</a> · Wisfy SMS app-এর জন্য webhook সেটিং এবং টেস্ট</p>

      <h2>1. App-এ যা বসাতে হবে</h2>
      <div className="box">
        <p className="muted">App-এর webhook/URL ফিল্ডে এটি দিন:</p>
        <div className="num" style={{ background: "#f3f0ea", color: "#16181d" }}><b style={{ fontSize: 14, wordBreak: "break-all" }}>{url}</b><Copy text={url} /></div>
        <p className="muted">Method: <b>POST</b> · Content-Type: <b>application/json</b></p>
        <p className="muted">Authentication: <b>Authorization: Bearer &lt;WISFY_SECRET_TOKEN&gt;</b> — token হলো আপনার Vercel-এ সেট করা <code>WISFY_SECRET_TOKEN</code> এর মান। App-এ কোন ফিল্ডে বসবে তা app-এর settings স্ক্রিনে দেখুন।</p>
      </div>

      <h2>2. Server ঠিক আছে কিনা</h2>
      <div className="box">
        {err && <p className="err">{err}</p>}
        {info && <>
          {Object.entries(info.env).map(([k, v]) => (
            <div className="item" key={k}><div className="grow"><b>{k}</b></div><span className={"tag " + (v ? "paid" : "")}>{v ? "set" : "missing"}</span></div>))}
          <div className="item"><div className="grow"><b>Supabase database</b>{info.dbError && <div className="err">{info.dbError}</div>}</div>
            <span className={"tag " + (info.dbOk ? "paid" : "")}>{info.dbOk ? "connected" : "error"}</span></div>
          {!info.dbOk && <p className="muted">Error হলে <code>supabase/schema.sql</code> Supabase SQL editor-এ রান করেছেন কিনা দেখুন।</p>}
        </>}
        <button className="ghost" style={{ marginTop: 8 }} onClick={() => load()}>Refresh</button>
      </div>

      <h2>3. Webhook টেস্ট</h2>
      <div className="box">
        <input type="password" placeholder="WISFY_SECRET_TOKEN (এখানে শুধু টেস্টের জন্য, সেভ হয় না)" value={token} onChange={(e) => setToken(e.target.value)} />
        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={ping} disabled={!token}>Test ping পাঠান</button>
        </div>
        <p className="muted" style={{ marginTop: 14 }}>নকল payment SMS (invoice-এর amount আর TrxID মিলিয়ে দিন):</p>
        <div className="row">
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="upay">Upay</option>
          </select>
          <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input placeholder="TrxID" value={trx} onChange={(e) => setTrx(e.target.value)} />
          <button onClick={fake} disabled={!token || trx.length < 6}>Fake SMS পাঠান</button>
        </div>
        {out && <p className="muted" style={{ wordBreak: "break-all" }}>Response: {out}</p>}
        <p className="muted">Token ভুল হলে <b>401</b> আসবে। একই TrxID দুইবার পাঠালে <b>duplicate</b> আসবে (নতুন TrxID দিন)।</p>
      </div>

      <h2>4. সর্বশেষ আসা payment</h2>
      <div className="box">
        {(!info || info.payments.length === 0) && <p className="muted">এখনো কোনো payment webhook আসেনি</p>}
        {info?.payments.map((p: any, k: number) => (
          <div className="item" key={k}><div className="grow"><b>{p.trx_id}</b> <span className="muted">{p.provider} · ৳{p.amount} · SIM {p.sim_slot ?? "-"}</span></div>
            <span className={"tag " + (p.invoice_id ? "paid" : "")}>{p.invoice_id ? "matched" : "unmatched"}</span></div>))}
      </div>
    </div>
  );
}
