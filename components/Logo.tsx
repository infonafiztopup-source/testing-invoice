import type { Provider } from "@/lib/providers";
// Simplified placeholder marks. Put official brand files in /public/logos and swap to <img> for exact logos.
export default function Logo({ p, size = 36 }: { p: Provider; size?: number }) {
  const s = { width: size, height: size };
  if (p === "bkash")
    return (<svg {...s} viewBox="0 0 40 40" aria-label="bKash"><rect width="40" height="40" rx="9" fill="#E2136E"/><path d="M9 11l22 4-9 5 4 9-8-6-9 3 3-8z" fill="#fff"/></svg>);
  if (p === "nagad")
    return (<svg {...s} viewBox="0 0 40 40" aria-label="Nagad"><rect width="40" height="40" rx="9" fill="#EE3A25"/><circle cx="20" cy="20" r="10" fill="none" stroke="#fff" strokeWidth="4"/><circle cx="26" cy="13" r="4" fill="#F7A21B"/></svg>);
  if (p === "rocket")
    return (<svg {...s} viewBox="0 0 40 40" aria-label="Rocket"><rect width="40" height="40" rx="9" fill="#8C3494"/><path d="M8 20L32 9l-6 22-6-8z" fill="#fff"/><path d="M20 23l12-14" stroke="#8C3494" strokeWidth="2"/></svg>);
  return (<svg {...s} viewBox="0 0 40 40" aria-label="Upay"><rect width="40" height="40" rx="9" fill="#FFD21E"/><path d="M11 9v13a9 9 0 0018 0V9" fill="none" stroke="#1F5FB4" strokeWidth="5" strokeLinecap="round"/></svg>);
}
