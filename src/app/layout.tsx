import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientBody } from "./ClientBody";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WHAT-YES - Live Auctions",
  description: "Real-time auction platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
