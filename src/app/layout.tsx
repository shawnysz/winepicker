import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HeaderNav } from "@/components/header-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "WinePicker by SZ",
  description: "Burgundy wine price lookup and collection tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WinePicker",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b1a1a",
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script src="/sw-register.js" defer />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeaderNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
