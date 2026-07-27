import { RefObject, useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

interface ScrollTruckProps {
  targetRef: RefObject<HTMLDivElement>;
  reduced: boolean;
}

const TRUCK_PHOTO_URL =
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=1600";

const EDGE_FADE_MASK =
  "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)";

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
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.9, 1], [1, 1, 1, 0]);

  if (reduced) {
    return (
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none select-none">
        <img
          src={TRUCK_PHOTO_URL}
          alt="Caminhão moderno em rodovia"
          width={640}
          height={320}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-[85vw] max-w-[640px] h-[180px] md:h-[320px] object-cover rounded-3xl"
          style={{ maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="sticky top-[12vh] z-0 flex justify-center pointer-events-none select-none"
      style={{ x, opacity }}
    >
      <div className="relative w-[85vw] max-w-[640px] h-[180px] md:h-[320px]">
        <img
          src={TRUCK_PHOTO_URL}
          alt="Caminhão moderno em rodovia"
          width={640}
          height={320}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-3xl"
          style={{ maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
        />
        <div className="dust-puff absolute bottom-[8%] left-[10%] w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-400/40" style={{ animationDelay: "0s" }} aria-hidden="true" />
        <div className="dust-puff absolute bottom-[12%] left-[16%] w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-400/30" style={{ animationDelay: "0.5s" }} aria-hidden="true" />
        <div className="dust-puff absolute bottom-[6%] left-[21%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-slate-400/25" style={{ animationDelay: "1s" }} aria-hidden="true" />
      </div>
    </motion.div>
  );
}
