import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IRC ESG Dashboard",
  description: "Indorama Corporation ESG reporting (2021-2025)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
