import { useEffect, useRef } from "react";
import { DollarSign, ShieldCheck, TrendingDown, LayoutGrid, Users, Fuel, Database } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { gsap } from "../gsapSetup";
import { beneficios } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const ICONS = { DollarSign, ShieldCheck, TrendingDown, LayoutGrid, Users, Fuel, Database };

export default function BeneficiosSection({ reduced }: SectionProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>(".beneficio-item");
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: listRef.current, start: "top 80%", toggleActions: "play none none none" },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div className="text-center max-w-lg mx-auto mb-12">
        <h2>O que muda no seu dia a dia.</h2>
        <p className="mt-2 text-muted-foreground">Menos telas, mais resultado.</p>
      </div>

      <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beneficios.map(({ label, icon }) => {
          const Icon = ICONS[icon];
          return (
            <div
              key={label}
              className="beneficio-item flex items-center gap-4 bg-card border border-border rounded-2xl p-5"
            >
              <span className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <p className="font-bold text-sm md:text-base">{label}</p>
            </div>
          );
        })}
      </div>
    </SectionReveal>
  );
}
