import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DERASS NIH BOSSS",
  description: "Landing page DERASS NIH BOSSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
