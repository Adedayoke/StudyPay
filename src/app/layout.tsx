import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/wallet/WalletProvider";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { PWAInstallBanner, OfflineIndicator } from "@/components/pwa/PWAComponents";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyPay - Blockchain Campus Payments",
  description: "Revolutionary blockchain payment system for students, parents, and vendors using Solana",
  manifest: "/manifest.json",
  themeColor: "#9945FF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StudyPay",
  },
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9945FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudyPay" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
      </head>
      <body className={`${inter.className} antialiased bg-dark-bg-primary text-dark-text-primary`}>
        <PWAProvider>
          <WalletContextProvider>
            <OfflineIndicator />
            {children}
            <PWAInstallBanner />
          </WalletContextProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
