import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIFA Nexus AI | Intelligent Stadium Operating System",
  description:
    "The world's most advanced generative AI platform for FIFA World Cup 2026 stadium operations, predictive crowd intelligence, and unparalleled fan experiences.",
  keywords: ["FIFA", "World Cup 2026", "AI", "stadium", "operations", "generative AI"],
  openGraph: {
    title: "FIFA Nexus AI | Intelligent Stadium OS",
    description: "Generative AI operating system for FIFA World Cup 2026",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0a0a0b" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen flex flex-col ambient-grid scanline">
        {/* Deep ambient light orbs — fixed, behind everything */}
        <div className="fixed inset-0 z-[-2] bg-[hsl(0,0%,2%)] overflow-hidden pointer-events-none">
          {/* Top-left cyan bloom */}
          <div
            className="orb orb-cyan absolute"
            style={{ width: "55vw", height: "55vh", top: "-15vh", left: "-15vw", opacity: 0.7 }}
          />
          {/* Bottom-right gold bloom */}
          <div
            className="orb orb-gold absolute"
            style={{ width: "50vw", height: "50vh", bottom: "-20vh", right: "-15vw", opacity: 0.6 }}
          />
          {/* Center subtle blue */}
          <div
            className="orb orb-blue absolute"
            style={{ width: "40vw", height: "40vh", top: "30vh", left: "30vw", opacity: 0.3 }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
