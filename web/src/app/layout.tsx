import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "FIFA Nexus AI | Intelligent Stadium OS",
  description: "The official GenAI Operating System for the FIFA World Cup 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        {/* Abstract background blobs for modern look */}
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0a0a]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-900/20 blur-[120px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
