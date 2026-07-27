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
      <img
        src={TRUCK_PHOTO_URL}
        alt="Caminhão moderno em rodovia"
        width={640}
        height={320}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        referrerPolicy="no-referrer"
        className="w-[85vw] max-w-[640px] h-[180px] md:h-[320px] object-cover rounded-3xl"
        style={{ maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      />
    </motion.div>
  );
}
