"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const Copy = ({ text }: { text: string }) => {
  const [c, setC] = useState(false);
  return <button className="ghost" onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 1200); }}>{c ? "Copied" : "Copy"}</button>;
};
const status = (k: any) => k.revoked ? "revoked" : k.verified_at ? "paired" : new Date(k.expires_at) < new Date() ? "expired" : "waiting";

export default function Setup() {
  const [key, setKey] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [err, setErr] = useState("");
  const [pair, setPair] = useState<{ key: string; url: string; expires_at: string } | null>(null);
  const [qr, setQr] = useState("");
  const [token, setToken] = useState("");
  const [amount, setAmount] = useState("155");
  const [trx, setTrx] = useState("TEST123456");
  const [provider, setProvider] = useState("bkash");
  const [out, setOut] = useState("");

  const api = (url: string, method = "GET") => fetch(url, { method, headers: { "x-admin-key": key } });
  async function load(k = key) {
    const r = await fetch("/api/setup", { headers: { "x-admin-key": k } });
    if (r.status === 401) { setErr("Admin key দিন (আগে হোম পেজে লগইন করুন)"); return; }
    setErr(""); setInfo(await r.json());
  }
  useEffect(() => { const k = sessionStorage.getItem("ak") || ""; setKey(k); if (k) load(k); }, []);
  useEffect(() => { if (!key) return; const t = setInterval(() => load(), 4000); return () => clearInterval(t); }, [key]);

  async function generate() {
    setOut(""); setErr("");
    const r = await api("/api/setup/pair", "POST");
    const j = await r.json();
    if (!r.ok) { setErr(j.error); return; }
    setPair(j); setToken(j.key);
    setQr(await QRCode.toDataURL(JSON.stringify({ v: 1, url: j.url, key: j.key }), { width: 260, margin: 1 }));
    load();
  }

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
      <p className="muted"><a href="/">← Admin</a> · Wisfy SMS app pair করা, webhook টেস্ট</p>
      {err && <p className="err">{err}</p>}

      <h2>1. App pair করুন (QR)</h2>
      <div className="box">
        <p className="muted">প্রতিবার নতুন secret তৈরি হয়। QR-এ webhook URL আর secret থাকে। Secret শুধু একবার দেখানো হয় (DB-তে শুধু hash থাকে)। Pair না হলে ১৫ মিনিট পর key expire হবে।</p>
        <button onClick={generate}>{pair ? "নতুন QR + secret বানান" : "QR + secret বানান"}</button>
        {pair && <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {qr && <img src={qr} alt="pairing QR" width={220} height={220} style={{ borderRadius: 8, border: "1px solid #e5e2dc" }} />}
          <div className="grow" style={{ minWidth: 240 }}>
            <p className="muted" style={{ margin: "0 0 4px" }}>Webhook URL</p>
            <div className="num" style={{ background: "#f3f0ea", color: "#16181d", margin: "0 0 10px" }}><b style={{ fontSize: 13, wordBreak: "break-all" }}>{pair.url}</b><Copy text={pair.url} /></div>
            <p className="muted" style={{ margin: "0 0 4px" }}>App secret (Bearer token)</p>
            <div className="num" style={{ background: "#f3f0ea", color: "#16181d", margin: 0 }}><b style={{ fontSize: 13, wordBreak: "break-all" }}>{pair.key}</b><Copy text={pair.key} /></div>
            <p className="muted">App QR স্ক্যান না করলে URL আর secret হাতে বসান।</p>
          </div>
        </div>}
      </div>

      <h2>2. Server ঠিক আছে কিনা</h2>
      <div className="box">
        {info && <>
          {Object.entries(info.env).map(([k, v]) => (
            <div className="item" key={k}><div className="grow"><b>{k}</b></div><span className={"tag " + (v ? "paid" : "")}>{v ? "set" : "missing"}</span></div>))}
          <div className="item"><div className="grow"><b>WISFY_SECRET_TOKEN</b> <span className="muted">(optional fixed token)</span></div><span className="tag">{info.fixedToken ? "set" : "not set"}</span></div>
          <div className="item"><div className="grow"><b>Supabase database</b>{info.dbError && <div className="err">{info.dbError}</div>}</div>
            <span className={"tag " + (info.dbOk ? "paid" : "")}>{info.dbOk ? "connected" : "error"}</span></div>
          {info.keysError && <p className="err">pairing_keys table নেই: Supabase-এ <code>supabase/pairing.sql</code> রান করুন। ({info.keysError})</p>}
        </>}
      </div>

      <h2>3. Pair করা key গুলো</h2>
      <div className="box">
        {(!info || info.keys.length === 0) && <p className="muted">এখনো কোনো key নেই</p>}
        {info?.keys.map((k: any) => (
          <div className="item" key={k.id}><div className="grow"><span className="muted">{new Date(k.created_at).toLocaleString()}</span></div>
            <span className={"tag " + (status(k) === "paired" ? "paid" : "")}>{status(k)}</span>
            {!k.revoked && <button className="ghost" onClick={async () => { await api("/api/setup/pair?id=" + k.id, "DELETE"); load(); }}>Revoke</button>}</div>))}
      </div>

      <h2>4. Webhook টেস্ট</h2>
      <div className="box">
        <input type="password" placeholder="App secret (নতুন QR বানালে নিজে থেকে বসে যায়)" value={token} onChange={(e) => setToken(e.target.value)} />
        <div className="row" style={{ marginTop: 8 }}><button onClick={ping} disabled={!token}>Test ping পাঠান</button></div>
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
        <p className="muted">Secret ভুল বা expire হলে <b>401</b>। একই TrxID দুইবার পাঠালে <b>duplicate</b>।</p>
      </div>

      <h2>5. সর্বশেষ আসা payment</h2>
      <div className="box">
        {(!info || info.payments.length === 0) && <p className="muted">এখনো কোনো payment webhook আসেনি</p>}
        {info?.payments.map((p: any, k: number) => (
          <div className="item" key={k}><div className="grow"><b>{p.trx_id}</b> <span className="muted">{p.provider} · ৳{p.amount} · SIM {p.sim_slot ?? "-"}</span></div>
            <span className={"tag " + (p.invoice_id ? "paid" : "")}>{p.invoice_id ? "matched" : "unmatched"}</span></div>))}
      </div>
    </div>
  );
}
