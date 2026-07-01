import { Truck, Shield, Flame, Compass, Star } from "lucide-react";

export default function Logistics3DHero() {
  return (
    <div 
      id="logistics-premium-hero" 
      className="relative w-full h-[380px] md:h-[340px] rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800/80 shadow-2xl bg-slate-900 group"
    >
      {/* Background High-Resolution Real Hero Image of a Modern Semi-Truck */}
      <div className="absolute inset-0 overflow-hidden w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=1600"
          alt="Premium Semi-Truck Fleet Hero"
          loading="eager"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out scale-100 group-hover:scale-[1.04]"
        />

        {/* Dual Layer Cinematic Overlays (Glassmorphism & Depth) with premium blue gradient */}
        {/* Dark subtle overlay */}
        <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply" />
        {/* Discrete subtle blue gradient accent for premium SaaS vibe */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-transparent to-transparent mix-blend-screen opacity-80" />
        {/* Sleek Gradient backdrop with superb text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
      </div>

      {/* Floating Modern Badge (Top Left) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none select-none">
        <div className="flex items-center gap-2 bg-white/10 dark:bg-zinc-950/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 dark:border-zinc-800/80 shadow-lg">
          <Truck className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-xs font-black text-white font-sans tracking-widest uppercase">
            Sistemas Premium Online
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>
      </div>

      {/* Hero Body Content */}
      <div className="absolute inset-x-6 bottom-6 md:bottom-8 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        
        {/* Left Column: SaaS Headings */}
        <div className="space-y-3 max-w-2xl text-left">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono uppercase tracking-wider">
              Frota de Alta Performance
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 font-mono">
              <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" /> Roteamento Inteligente IA
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
            Logística Inteligente de Ponta a Ponta
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            A mais avançada plataforma de monitoramento de frotas, planejamento de fretes interestaduais, telemetria em tempo real e eficiência de combustível automatizada.
          </p>
        </div>

        {/* Right Column: Key Specifications Card (Floating Glassmorphism) */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-white/10 dark:border-zinc-800/80 p-5 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[240px] text-left">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white font-sans uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Ativo Líder
            </span>
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              ACTROS 6X4
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Disponibilidade</p>
              <p className="text-base font-black text-white font-mono mt-0.5">98.4%</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">Média Frota</p>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">2.9 km/L</p>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 font-mono leading-tight">
            Chassis Reforçado • Bitrem • Monitoramento ESC
          </p>
        </div>

      </div>

    </div>
  );
}
