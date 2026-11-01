export type Provider = "bkash" | "nagad" | "rocket" | "upay";
export const PROVIDERS: Record<Provider, { name: string; color: string }> = {
  bkash: { name: "bKash", color: "#E2136E" },
  nagad: { name: "Nagad", color: "#E8452C" },
  rocket: { name: "Rocket", color: "#8C3494" },
  upay: { name: "Upay", color: "#1F5FB4" },
};
export const ORDER: Provider[] = ["bkash", "nagad", "rocket", "upay"];
export const bn = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
export const steps = (p: Provider, amount: string) => {
  const n = PROVIDERS[p].name;
  return [
    p === "bkash" ? "*247# ডায়াল করে আপনার bKash মোবাইল মেনুতে যান অথবা bKash অ্যাপ খুলুন।" : `আপনার ${n} অ্যাপ খুলুন অথবা ডায়াল করে মেনুতে যান।`,
    "Payment-এ ক্লিক করুন।",
    "উপরের নম্বরে টাকা পাঠান।",
    `টাকার পরিমাণ: ${bn(amount)}`,
    `নিশ্চিত করে এখন আপনার ${n} PIN লিখুন।`,
    "টাকা পাঠান এবং ট্রানজ্যাকশন আইডি কপি করুন।",
    "ট্রানজ্যাকশন আইডি লিখে ভেরিফাই চাপুন।",
  ];
};
