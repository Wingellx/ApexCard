import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      className={`${jakarta.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0b0f] text-[#f0f2f8]">
        {children}
      </body>
    </html>
  );
}
