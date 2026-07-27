import { RefObject } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

interface RoadLineProps {
  targetRef: RefObject<HTMLDivElement>;
  reduced: boolean;
}

export default function RoadLine({ targetRef, reduced }: RoadLineProps) {
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] });
  const rawOffset = useTransform(scrollYProgress, [0, 1], [0, -1600]);
  const smoothOffset = useSpring(rawOffset, { stiffness: 60, damping: 20, mass: 1 });
  const backgroundPositionY = useTransform(smoothOffset, (v) => `${v}px`);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 opacity-[0.12] dark:opacity-[0.18] pointer-events-none z-0"
      style={{
        backgroundPositionY: reduced ? "0px" : backgroundPositionY,
        backgroundImage:
          "repeating-linear-gradient(to bottom, var(--muted-foreground) 0px, var(--muted-foreground) 28px, transparent 28px, transparent 56px)",
      }}
    />
  );
}
