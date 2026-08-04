import { useEffect, useRef } from "react";
import { FileWarning, TrendingDown, MessageSquareOff, Coins, MoveHorizontal } from "lucide-react";
import SectionReveal from "../SectionReveal";
import CountUp from "../../CountUp";
import { gsap } from "../gsapSetup";
import { antesProblemas, depoisStats } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

// Real photos (Unsplash, standard free license) — cluttered desk for "Sem
// Fleet One", bright organized workspace for "Com Fleet One", so the reveal
// swaps one real photo for another instead of fading into empty white space.
const ANTES_PHOTO_URL =
  "https://images.unsplash.com/photo-1753340328027-73acda445c58?auto=format&fit=crop&q=80&w=1600";
const DEPOIS_PHOTO_URL =
  "https://images.unsplash.com/photo-1742198810079-49bb51d1c5af?auto=format&fit=crop&q=80&w=1600";

const ICONS = { FileWarning, TrendingDown, MessageSquareOff };

export default function BeforeAfterSection({ reduced }: SectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const depoisRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !sectionRef.current || !depoisRef.current) return;
    const state = { p: 0 };
    // pin: true pins the panel itself for exactly `end` px of scroll and maps
    // p:0→1 across that same pinned duration — so the reveal always finishes
    // right as the panel is about to release, instead of a manually-guessed
    // sticky/wrapper height that could unstick before (or long after) the
    // wipe actually completes.
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 96px",
        end: "+=1500",
        pin: true,
        anticipatePin: 1,
        scrub: true,
      },
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
        <h2>Antes. Com o Fleet One.</h2>
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
          <img
            src={DEPOIS_PHOTO_URL}
            alt="Espaço de trabalho organizado e iluminado"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #EEF2FF 0%, rgba(238,242,255,0.75) 38%, rgba(255,255,255,0.15) 65%)" }} />
          <span className="absolute top-6 left-6 text-[11px] font-black uppercase tracking-widest text-emerald-600">
            Com Fleet One
          </span>
          {/* Anchored to the left (where the wipe reveal starts) so the panel
              is fully visible early in the transition instead of popping in
              piecemeal once the reveal crosses the panel's centre. One
              cohesive widget (not separate floating cards) reads as a real
              product screenshot rather than a promise. */}
          <div className="absolute inset-0 flex flex-col items-start justify-center p-6 md:p-14">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-2xl rounded-2xl w-[260px] sm:w-[300px] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Painel em tempo real</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-100">
                <div className="bg-white p-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Caminhões ativos</span>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    <CountUp value={depoisStats.trucksActive} />
                  </p>
                </div>
                <div className="bg-white p-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Motoristas ativos</span>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    <CountUp value={depoisStats.driversActive} />
                  </p>
                </div>
                <div className="bg-white p-4 col-span-2">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Faturamento do mês</span>
                  <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                    <CountUp value={depoisStats.billingMonth} prefix="R$ " />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 text-emerald-700">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold">Financeiro em dia</span>
              </div>
            </div>
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
