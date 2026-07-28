import { RefObject, useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";

interface ScrollTruckProps {
  targetRef: RefObject<HTMLDivElement>;
  reduced: boolean;
}

// Real professional photograph (Scania modern semi-truck, box/curtain-side trailer),
// same source used elsewhere in the app for visual consistency.
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

  const maxTravel = isMobile ? 20 : 70;
  const rawXNum = useTransform(
    scrollYProgress,
    [0, 0.15, 0.5, 0.85, 1],
    [0, isMobile ? 3 : 10, isMobile ? 11 : 40, isMobile ? 17 : 60, maxTravel]
  );
  const xNum = useSpring(rawXNum, { stiffness: 60, damping: 20, mass: 1 });
  const x = useTransform(xNum, (v) => `${v}vw`);
  const xVelocity = useVelocity(xNum);
  const motionBlur = useTransform(xVelocity, (v) => `blur(${Math.min(Math.abs(v) / 45, 1.4).toFixed(2)}px)`);

  // Full strength in the hero; fades to a translucent "ambient" layer once it
  // crosses into text-only section headers (no card behind them), so it never
  // fights section copy for contrast; fades out entirely at the end.
  const opacity = useTransform(scrollYProgress, [0, 0.08, 0.14, 0.9, 0.96, 1], [1, 1, 0.35, 0.35, 0.35, 0]);

  if (reduced) {
    return (
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none select-none">
        <div className="relative w-[85vw] max-w-[640px] h-[180px] md:h-[320px]">
          <div className="absolute inset-x-[8%] bottom-[4%] h-4 bg-black/25 blur-md rounded-full" />
          <img
            src={TRUCK_PHOTO_URL}
            alt="Caminhão moderno em rodovia"
            width={640}
            height={320}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-3xl drop-shadow-2xl"
            style={{ maskImage: EDGE_FADE_MASK, WebkitMaskImage: EDGE_FADE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="sticky top-[12vh] z-0 flex justify-center pointer-events-none select-none"
      style={{ x, opacity }}
    >
      <motion.div
        className="relative w-[85vw] max-w-[640px] h-[180px] md:h-[320px]"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Soft ground shadow, suggests weight/contact with the road */}
        <div className="absolute inset-x-[8%] bottom-[4%] h-4 bg-black/30 blur-md rounded-full" />

        <motion.img
          src={TRUCK_PHOTO_URL}
          alt="Caminhão moderno em rodovia"
          width={640}
          height={320}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-3xl drop-shadow-2xl"
          style={{
            maskImage: EDGE_FADE_MASK,
            WebkitMaskImage: EDGE_FADE_MASK,
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
            filter: motionBlur,
          }}
        />

        {/* Approximate headlight glow, positioned over the photo's front lamps */}
        <div
          className="headlight-glow absolute rounded-full pointer-events-none"
          style={{
            left: "27%",
            top: "58%",
            width: "10%",
            height: "10%",
            background: "radial-gradient(circle, rgba(253,230,138,0.55) 0%, rgba(253,230,138,0) 70%)",
            filter: "blur(2px)",
          }}
        />

        <div className="dust-puff absolute bottom-[6%] left-[4%] w-3 h-3 md:w-4 md:h-4 rounded-full bg-slate-400/40" style={{ animationDelay: "0s" }} aria-hidden="true" />
        <div className="dust-puff absolute bottom-[9%] left-[9%] w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-400/30" style={{ animationDelay: "0.5s" }} aria-hidden="true" />
        <div className="dust-puff absolute bottom-[5%] left-[13%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-slate-400/25" style={{ animationDelay: "1s" }} aria-hidden="true" />
      </motion.div>
    </motion.div>
  );
}
