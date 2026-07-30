import { useEffect, useRef } from "react";
import { DollarSign, ShieldCheck, Database, BarChart3, TrendingDown, Activity } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { gsap } from "../gsapSetup";
import { beneficios } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const ICONS = { DollarSign, ShieldCheck, Database, BarChart3, TrendingDown, Activity };

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
    <SectionReveal reduced={reduced} className="relative z-10 max-w-2xl mx-auto px-6 py-24 md:py-36">
      <div className="text-center mb-16">
        <h2>O que muda no seu dia a dia.</h2>
      </div>

      <div ref={listRef}>
        {beneficios.map(({ label, icon }, i) => {
          const Icon = ICONS[icon];
          return (
            <div
              key={label}
              className={`beneficio-item flex items-center gap-5 py-6 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <p className="font-bold text-lg md:text-xl">{label}</p>
            </div>
          );
        })}
      </div>
    </SectionReveal>
  );
}
