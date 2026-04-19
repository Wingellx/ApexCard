import type { Metadata } from "next";
import { Geist, Sora } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://apexcard.com";

export const metadata: Metadata = {
  title: "ApexCard — Your Verified Sales Identity",
  description: "Track calls, close rate, commissions, and get manager-verified. Your shareable sales card for closers, setters, and operators.",
  openGraph: {
    title: "ApexCard — Your Verified Sales Identity",
    description: "The performance dashboard for high-ticket sales teams. Track calls, show rates, close rates, and commissions — then get manager-verified and share your card.",
    url: APP_URL,
    siteName: "ApexCard",
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ApexCard — Your Verified Sales Identity",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApexCard — Your Verified Sales Identity",
    description: "The performance dashboard for high-ticket sales teams.",
    images: [`${APP_URL}/og-image.png`],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
