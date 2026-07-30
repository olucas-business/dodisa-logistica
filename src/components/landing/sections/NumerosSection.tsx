import { useEffect, useRef, useState } from "react";
import SectionReveal from "../SectionReveal";
import { gsap } from "../gsapSetup";
import { numeros } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
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
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {numeros.map((n) => (
          <div key={n.label}>
            <p className="text-4xl md:text-5xl font-black font-mono text-primary">
              {Math.round(n.value * progress).toLocaleString("pt-BR")}
              {n.suffix}
            </p>
            <p className="mt-3 text-sm md:text-base text-muted-foreground font-semibold">{n.label}</p>
          </div>
        ))}
      </div>
    </SectionReveal>
  );
}
