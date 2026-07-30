import { useEffect, useRef } from "react";
import { FileWarning, TrendingDown, MessageSquareOff, Coins, MoveHorizontal } from "lucide-react";
import SectionReveal from "../SectionReveal";
import CountUp from "../../CountUp";
import { gsap } from "../gsapSetup";
import { antesProblemas, depoisStats } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

// Real photo (Unsplash, standard free license) — cluttered desk with papers,
// used only for the "Sem Fleet One" side of the comparison.
const ANTES_PHOTO_URL =
  "https://images.unsplash.com/photo-1753340328027-73acda445c58?auto=format&fit=crop&q=80&w=1600";

const ICONS = { FileWarning, TrendingDown, MessageSquareOff };

export default function BeforeAfterSection({ reduced }: SectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const depoisRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !sectionRef.current || !depoisRef.current) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: sectionRef.current, start: "top 70%", end: "bottom 30%", scrub: true },
      onUpdate: () => {
        const pct = state.p * 100;
        if (depoisRef.current) depoisRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        if (handleRef.current) handleRef.current.style.left = `${pct}%`;
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-24 md:py-40">
      <div className="text-center max-w-xl mx-auto mb-12">
        <h2>Assim administram hoje. Assim administram com o Fleet One.</h2>
        <p className="mt-3 text-muted-foreground">Role a página e veja a transformação acontecer.</p>
      </div>

      <div ref={sectionRef} className="relative h-[540px] md:h-[680px] rounded-3xl overflow-hidden shadow-2xl">
        {/* ANTES layer (base) */}
        <div className="absolute inset-0">
          <img
            src={ANTES_PHOTO_URL}
            alt="Operação desorganizada, com planilhas e papéis espalhados"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            style={{ filter: "grayscale(0.5) brightness(0.5) contrast(1.05)" }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(2,6,23,0.55)" }} />
          <span className="absolute top-6 left-6 text-[11px] font-black uppercase tracking-widest text-red-300">
            Sem Fleet One
          </span>
          {/* Anchored to the bottom-right corner (not centered) so the wipe
              boundary — which sweeps left-to-right — never slices through the
              middle of a tag as it passes. These stay whole until the very
              end of the transition. */}
          <div className="absolute inset-0 flex flex-col items-end justify-end gap-3 p-6 md:p-14">
            {antesProblemas.map(({ label, icon }) => {
              const Icon = ICONS[icon];
              return (
                <span
                  key={label}
                  className="flex items-center gap-2 bg-black/40 border border-white/10 text-slate-200 text-xs font-bold px-3 py-2 rounded-full backdrop-blur-sm whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 text-red-400" /> {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* DEPOIS layer, revealed via scroll-driven clip-path wipe */}
        <div
          ref={depoisRef}
          className="absolute inset-0 bg-white"
          style={{ clipPath: reduced ? "inset(0 50% 0 0)" : "inset(0 100% 0 0)" }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 60%)" }} />
          <span className="absolute top-6 left-6 text-[11px] font-black uppercase tracking-widest text-emerald-600">
            Com Fleet One
          </span>
          {/* Anchored to the left (where the wipe reveal starts) so every card
              is fully visible early in the transition instead of popping in
              piecemeal once the reveal crosses the panel's centre. */}
          <div className="absolute inset-0 flex flex-col items-start justify-center gap-3 p-6 md:p-14">
            <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-5 min-w-[170px]">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Caminhões ativos</span>
              <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                <CountUp value={depoisStats.trucksActive} />
              </p>
            </div>
            <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-5 min-w-[170px]">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Motoristas ativos</span>
              <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                <CountUp value={depoisStats.driversActive} />
              </p>
            </div>
            <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-5 min-w-[170px]">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Faturamento do mês</span>
              <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                R$ <CountUp value={depoisStats.billingMonth} />
              </p>
            </div>
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap">
              <Coins className="w-3.5 h-3.5" /> Financeiro em dia
            </span>
          </div>
        </div>

        {/* Scroll-driven wipe handle — a small, deliberate touch that makes the
            clip-path boundary read as an intentional "slider", not a glitch. */}
        <div
          ref={handleRef}
          className="absolute inset-y-0 w-0.5 bg-white/80 pointer-events-none hidden md:block"
          style={{ left: reduced ? "50%" : "0%" }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center">
            <MoveHorizontal className="w-4 h-4 text-slate-700" />
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
