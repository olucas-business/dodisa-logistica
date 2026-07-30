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

// Same photo as BeforeAfterSection's "antes" side — reused here, heavily
// blurred and darkened, purely as atmosphere. Ties the chaos beat back to
// the cluttered-desk motif instead of leaving the frame pure black void.
const CHAOS_PHOTO_URL =
  "https://images.unsplash.com/photo-1753340328027-73acda445c58?auto=format&fit=crop&q=60&w=1200";

// The "problem" beat of the story, told through type, a dim atmospheric
// backdrop and a scroll-synced route marker — no icons, no cards. Short on
// purpose: this only needs to land the discomfort before TransformationSection
// resolves it.
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
        {/* Dim atmospheric backdrop — a real photo, not flat black void */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={CHAOS_PHOTO_URL}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            style={{ filter: "grayscale(0.7) brightness(0.28) contrast(1.1) blur(3px)", transform: "scale(1.05)" }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(5,7,13,0.75)" }} />
        </div>

        {/* Slow-breathing red glow — keeps the frame alive without adding a "card" */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div className="chaos-glow w-[55vw] h-[55vw] max-w-[760px] max-h-[760px] rounded-full" />
        </div>

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
