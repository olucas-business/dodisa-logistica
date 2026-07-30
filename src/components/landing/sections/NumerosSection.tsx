import { useEffect, useRef, useState } from "react";
import SectionReveal from "../SectionReveal";
import RadialGauge from "../../RadialGauge";
import { gsap } from "../gsapSetup";
import { numeros } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

function Sparkline({ progress }: { progress: number }) {
  const length = 140;
  return (
    <svg viewBox="0 0 90 28" className="w-20 h-6 mx-auto mt-3 text-emerald-600 dark:text-emerald-400" fill="none">
      <polyline
        points="0,26 15,22 30,24 45,14 60,16 75,6 90,2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: length, strokeDashoffset: length * (1 - progress) }}
      />
    </svg>
  );
}

export default function NumerosSection({ reduced }: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced || !containerRef.current) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: containerRef.current, start: "top 78%", toggleActions: "play none none none" },
      onUpdate: () => setProgress(state.p),
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center items-center">
        {numeros.map((n) =>
          n.suffix === "%" ? (
            <div key={n.label} className="flex flex-col items-center">
              <RadialGauge label={n.label} value={n.value * progress} displayValue={`${Math.round(n.value * progress)}%`} />
            </div>
          ) : (
            <div key={n.label}>
              <p className="text-4xl md:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {Math.round(n.value * progress).toLocaleString("pt-BR")}
                {n.suffix}
              </p>
              <Sparkline progress={progress} />
              <p className="mt-3 text-sm md:text-base text-muted-foreground font-semibold">{n.label}</p>
            </div>
          )
        )}
      </div>
    </SectionReveal>
  );
}
