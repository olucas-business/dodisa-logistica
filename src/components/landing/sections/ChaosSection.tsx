import { useEffect, useRef, useState } from "react";
import { gsap } from "../gsapSetup";

interface SectionProps {
  reduced: boolean;
}

const CHAOS_PHRASES = [
  "O problema começa pequeno.",
  "Planilhas. WhatsApp. Papel.",
  "Aos poucos, você perde o controle.",
  "Custos sem explicação. Decisões no escuro.",
];

// The "problem" beat of the story, told purely through type and a scroll-
// synced route marker — no icons, no cards. Deliberately short: this only
// needs to land the discomfort before TransformationSection resolves it.
export default function ChaosSection({ reduced }: SectionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced || !wrapperRef.current) return;
    const state = { p: 0 };
    const steps = CHAOS_PHRASES.length;
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: wrapperRef.current, start: "top top", end: "bottom bottom", scrub: true },
      onUpdate: () => {
        setActiveIndex(Math.min(steps - 1, Math.floor(state.p * steps)));
        setProgress(state.p);
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-24 md:py-32 space-y-10 text-center">
        {CHAOS_PHRASES.map((phrase, i) => (
          <div key={i} className="flex flex-col items-center gap-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" aria-hidden="true" />
            <p className="text-2xl md:text-4xl font-black tracking-tight leading-tight text-foreground">{phrase}</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section ref={wrapperRef} className="relative bg-[#05070d]" style={{ height: `${CHAOS_PHRASES.length * 42}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute right-6 md:right-12 top-0 h-full w-px flex items-center pointer-events-none" aria-hidden="true">
          <div className="relative h-[60%] w-px bg-white/15">
            {CHAOS_PHRASES.map((_, i) => {
              const topPct = (i / (CHAOS_PHRASES.length - 1)) * 100;
              const passed = i <= activeIndex;
              return (
                <span
                  key={i}
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    passed ? "bg-red-400" : "bg-white/20"
                  }`}
                  style={{ top: `${topPct}%` }}
                />
              );
            })}
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-400"
              style={{ top: `${progress * 100}%`, boxShadow: "0 0 14px 3px rgba(248,113,113,0.55)" }}
            />
          </div>
        </div>

        {CHAOS_PHRASES.map((phrase, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{ opacity: activeIndex === i ? 1 : 0, transition: "opacity 0.6s ease" }}
          >
            {/* Arbitrary text sizes on purpose: bare `.text-3xl` is globally
                forced to a fixed 30px JetBrains Mono by index.css (a rule meant
                for dashboard KPI numbers), which would silently re-font this
                display headline. */}
            <p className="max-w-4xl text-center text-[2.25rem] md:text-[4rem] lg:text-[5.5rem] font-black tracking-tight leading-tight text-white">
              {phrase}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
