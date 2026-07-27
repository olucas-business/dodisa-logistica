import { Truck } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

interface ScrollProgressBarProps {
  reduced: boolean;
}

export default function ScrollProgressBar({ reduced }: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.3 });
  const widthPct = useTransform(progress, (v) => `${v * 100}%`);
  const leftPct = useTransform(progress, (v) => `calc(${v * 100}% - 8px)`);

  return (
    <div className="sticky top-16 z-30 h-[3px] w-full bg-muted/60 overflow-visible" aria-hidden="true">
      <motion.div className="h-full bg-primary origin-left" style={{ width: widthPct }} />
      {!reduced && (
        <motion.div className="absolute -top-[7px]" style={{ left: leftPct }}>
          <Truck className="w-4 h-4 text-primary" />
        </motion.div>
      )}
    </div>
  );
}
