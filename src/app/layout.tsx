import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

// Self-hosted variable fonts — no runtime dependency on Google Fonts.
const inter = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const playfair = localFont({
  src: "./fonts/PlayfairDisplay.woff2",
  variable: "--font-playfair",
  weight: "400 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rahul's Wedding Planner",
  description: "Plan every celebration — Mehendi to Walima — in one elegant place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
