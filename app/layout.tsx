import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pulsetap.co.uk"),
  icons: {
    icon: []
  },
  title: {
    default: "PulseTap | Smart NFC + QR Products",
    template: "%s | PulseTap"
  },
  description:
    "Premium NFC and QR smart products for reviews, social links, WiFi, restaurants and business profiles. Tap. Activate. Done. No app required.",
  keywords: [
    "PulseTap",
    "NFC cards",
    "QR products",
    "Google review cards",
    "NFC business cards",
    "restaurant NFC"
  ],
  openGraph: {
    title: "PulseTap | Smart NFC + QR Products",
    description: "Tap. Activate. Done. Premium NFC + QR products with no app required.",
    url: "https://pulsetap.co.uk",
    siteName: "PulseTap",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
