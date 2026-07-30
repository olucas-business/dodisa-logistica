import { useEffect, useRef } from "react";
import { ClipboardList, UserCheck, Route, Fuel, Wrench, Package, Coins, FileText, Truck } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { gsap } from "../gsapSetup";
import { timelineSteps } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const ICONS = { ClipboardList, UserCheck, Route, Fuel, Wrench, Package, Coins, FileText };

export default function TimelineSection({ reduced }: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      if (lineRef.current) lineRef.current.style.height = "100%";
      return;
    }
    if (!containerRef.current) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: { trigger: containerRef.current, start: "top 75%", end: "bottom 60%", scrub: true },
      onUpdate: () => {
        if (lineRef.current) lineRef.current.style.height = `${state.p * 100}%`;
        if (markerRef.current) markerRef.current.style.top = `${state.p * 100}%`;
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div className="text-center max-w-lg mx-auto mb-14">
        <h2>A operação ganha controle, passo a passo.</h2>
        <p className="mt-2 text-muted-foreground">Do planejamento ao relatório, tudo conectado.</p>
      </div>

      <div ref={containerRef} className="relative">
        <div
          className="absolute left-6 md:left-8 top-2 bottom-2 w-[3px] -translate-x-1/2 bg-border rounded-full"
          aria-hidden="true"
        />
        <div
          ref={lineRef}
          className="absolute left-6 md:left-8 top-2 -translate-x-1/2 w-[3px] rounded-full"
          style={{ height: 0, background: "linear-gradient(180deg,#3b82f6,#6d28d9)" }}
          aria-hidden="true"
        />
        {!reduced && (
          <div
            ref={markerRef}
            className="absolute left-6 md:left-8 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-20"
            style={{ top: 0, background: "linear-gradient(135deg,#3b82f6,#6d28d9)" }}
            aria-hidden="true"
          >
            <Truck className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="space-y-10">
          {timelineSteps.map((step) => {
            const Icon = ICONS[step.icon];
            return (
              <div key={step.label} className="relative flex items-center gap-5 pl-16 md:pl-20">
                <div className="absolute left-6 md:left-8 -translate-x-1/2 w-9 h-9 rounded-full bg-card border-2 border-border flex items-center justify-center z-10">
                  <Icon className="w-4 h-4 text-blue-500" />
                </div>
                <p className="font-bold text-base md:text-lg">{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
