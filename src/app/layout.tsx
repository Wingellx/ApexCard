import type { Metadata } from "next";
import { Geist, Sora } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ApexCard — Your Verified Sales Identity",
  description: "Track calls, close rate, commissions, and get manager-verified. Your shareable sales card for closers, setters, and operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0b0f] text-[#f0f2f8]">
        {children}
      </body>
    </html>
  );
}
