import { RefObject, useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import TruckSVG from "./TruckSVG";

interface ScrollTruckProps {
  targetRef: RefObject<HTMLDivElement>;
  reduced: boolean;
}

export default function ScrollTruck({ targetRef, reduced }: ScrollTruckProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] });

  const maxTravel = isMobile ? "20vw" : "70vw";
  const rawX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.5, 0.85, 1],
    ["0vw", isMobile ? "3vw" : "10vw", isMobile ? "11vw" : "40vw", isMobile ? "17vw" : "60vw", maxTravel]
  );
  const x = useSpring(rawX, { stiffness: 60, damping: 20, mass: 1 });
  // Full strength in the hero; fades to a translucent "ambient" layer once it
  // crosses into text-only section headers (which have no card behind them),
  // so it never fights section copy for contrast; fades out entirely at the end.
  const opacity = useTransform(scrollYProgress, [0, 0.08, 0.14, 0.9, 0.96, 1], [1, 1, 0.35, 0.35, 0.35, 0]);

  if (reduced) {
    return (
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none select-none">
        <div className="relative w-[85vw] max-w-[640px] h-[180px] md:h-[320px] drop-shadow-2xl">
          <TruckSVG reduced />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="sticky top-[12vh] z-0 flex justify-center pointer-events-none select-none"
      style={{ x, opacity }}
    >
      <div className="relative w-[85vw] max-w-[640px] h-[180px] md:h-[320px] drop-shadow-2xl">
        <TruckSVG reduced={false} />
        <div className="dust-puff absolute bottom-[6%] left-[4%] w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-400/40" style={{ animationDelay: "0s" }} aria-hidden="true" />
        <div className="dust-puff absolute bottom-[9%] left-[9%] w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-400/30" style={{ animationDelay: "0.5s" }} aria-hidden="true" />
        <div className="dust-puff absolute bottom-[5%] left-[13%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-slate-400/25" style={{ animationDelay: "1s" }} aria-hidden="true" />
      </div>
    </motion.div>
  );
}
