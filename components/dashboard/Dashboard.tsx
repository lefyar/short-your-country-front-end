// components/dashboard/Dashboard.tsx
"use client";

import { GlobeHero } from "./GlobeHero";

export function Dashboard() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden po">
      {/* Background bola full-screen, fixed di belakang */}
      

      {/* Gradient supaya teks kebaca, tapi pointer tembus ke bawah */}
  <div className="pointer-events-none absolute inset-0 from-black via-black/70 to-black/10" />

      {/* Layer teks di kiri, pointer tembus kecuali di konten dalamnya */}
      <div className="relative z-10 flex min-h-screen items-center ">
        <GlobeHero />
        <div className="px-6 py-16 md:px-16 lg:px-24 pointer-events-auto">
          <div className="max-w-xl pointer-events-none">
            <p className="text-3xl text-slate-50 md:text-4xl lg:text-5xl">
              Short Your <span className="font-bold">Country,</span>
              <br />
              Short Your <span className="font-bold">Governments.</span>
            </p>

            <p className="mt-4 max-w-xl text-sm text-slate-300 md:text-base">
              Express your macro view on nations through on-chain long/short
              positions. Hedge risk, trade narratives, or simply bet on policy
              outcomes—directly from your wallet.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 pointer-events-auto">
              <a
                href="/markets"
                className="rounded-full bg-white px-5 py-2.5 text-sm text-black transition-colors hover:bg-emerald-400"
              >
                Start Trading
              </a>
              <a
                href="/markets"
                className="rounded-full border-2 border-slate-500 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                View Markets
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
