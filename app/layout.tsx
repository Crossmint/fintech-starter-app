import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fintech Starter App",
  description: "Create your own Fintech app in minutes using Crossmint",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-muted box-content antialiased`}
      >
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID && (
          <Script
            id="hs-script-loader"
            src={`//js.hs-scripts.com/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID}.js`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
