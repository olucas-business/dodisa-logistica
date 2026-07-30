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
          <p
            key={i}
            className={`text-2xl md:text-4xl font-black tracking-tight leading-tight ${phrase === "Fleet One." ? "text-primary" : ""}`}
          >
            {phrase}
          </p>
        ))}
      </section>
    );
  }

  return (
    <section ref={wrapperRef} className="relative" style={{ height: `${scrollStorySteps.length * 60}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
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
      </div>
    </section>
  );
}
