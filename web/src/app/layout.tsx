import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lunch Fund - Quản lý quỹ cơm trưa",
  description: "Hệ thống quản lý quỹ cơm trưa văn phòng",

  // PWA
  manifest: "/manifest.webmanifest",
  applicationName: "Lunch Fund",
  appleWebApp: {
    capable: true,
    title: "Lunch Fund",
    statusBarStyle: "default",
  },
  themeColor: "#007aff",
  icons: {
    // iOS Home Screen icon
    apple: "/apple-touch-icon.png",
    // Browser tab / address bar icon
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
