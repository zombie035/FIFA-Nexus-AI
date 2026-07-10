"use client";

import dynamic from "next/dynamic";

const FootballScene = dynamic(() => import("@/components/FootballScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#020408] text-white overflow-hidden">
      <FootballScene />
    </main>
  );
}
