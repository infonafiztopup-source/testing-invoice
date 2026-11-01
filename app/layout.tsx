import "./globals.css";
import { Hind_Siliguri } from "next/font/google";
const f = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"] });
export const metadata = { title: "Invoice Test" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="bn"><body className={f.className}>{children}</body></html>);
}
