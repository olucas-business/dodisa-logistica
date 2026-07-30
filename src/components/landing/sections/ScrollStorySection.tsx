import { useEffect, useRef, useState } from "react";
import { gsap } from "../gsapSetup";
import { scrollStorySteps } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

// Cinematic typographic narrative — one short phrase fills the screen at a
// time, crossfading into the next as the visitor scrolls. No icons, no
// cards: this replaces the old icon-timeline with an Apple/Linear-style
// scroll-story built purely from type and whitespace.
export default function ScrollStorySection({ reduced }: SectionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced || !wrapperRef.current) return;
    const state = { p: 0 };
    const steps = scrollStorySteps.length;
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
        {scrollStorySteps.map((phrase, i) => (
          <div key={i} className="flex flex-col items-center gap-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <p
              className={`text-2xl md:text-4xl font-black tracking-tight leading-tight ${phrase === "Fleet One." ? "text-primary" : ""}`}
            >
              {phrase}
            </p>
          </div>
        ))}
      </section>
    );
  }

  const stepLabel = String(activeIndex + 1).padStart(2, "0");
  const totalLabel = String(scrollStorySteps.length).padStart(2, "0");

  return (
    <section ref={wrapperRef} className="relative" style={{ height: `${scrollStorySteps.length * 40}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Route rail — a thin vertical track with a marker that travels down
            it as the visitor scrolls, echoing the trip/route the narrative
            describes (chaos → Fleet One → control) without icons or cards. */}
        <div className="absolute right-6 md:right-12 top-0 h-full w-px flex items-center pointer-events-none" aria-hidden="true">
          <div className="relative h-[64%] w-px bg-border">
            {scrollStorySteps.map((_, i) => {
              const topPct = (i / (scrollStorySteps.length - 1)) * 100;
              const passed = i <= activeIndex;
              return (
                <span
                  key={i}
                  className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    passed ? "bg-primary" : "bg-border"
                  }`}
                  style={{ top: `${topPct}%` }}
                />
              );
            })}
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary"
              style={{ top: `${progress * 100}%`, boxShadow: "0 0 14px 3px rgba(79,70,229,0.65)" }}
            />
          </div>
        </div>

        {scrollStorySteps.map((phrase, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{ opacity: activeIndex === i ? 1 : 0, transition: "opacity 0.6s ease" }}
          >
            <p
              // Arbitrary text sizes on purpose: the bare `.text-3xl` utility is
              // globally forced to a fixed 30px JetBrains Mono by index.css (a
              // rule meant for dashboard KPI numbers), which would silently
              // shrink and re-font this display headline.
              className={`max-w-4xl text-center text-[2.25rem] md:text-[4rem] lg:text-[5.5rem] font-black tracking-tight leading-tight ${phrase === "Fleet One." ? "text-primary" : ""}`}
            >
              {phrase}
            </p>
          </div>
        ))}

        {/* Monospace progress readout — a deliberate "operational system"
            touch, reusing the app's own data font instead of the display sans. */}
        <span className="absolute bottom-8 right-8 font-mono text-xs text-muted-foreground/60 tracking-wider">
          {stepLabel} / {totalLabel}
        </span>
      </div>
    </section>
  );
}
