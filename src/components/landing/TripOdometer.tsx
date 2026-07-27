import { RefObject, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { Gauge } from "lucide-react";

interface TripOdometerProps {
  targetRef: RefObject<HTMLDivElement>;
  reduced: boolean;
}

const TARGET_KM = 480;

export default function TripOdometer({ targetRef, reduced }: TripOdometerProps) {
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] });
  const km = useTransform(scrollYProgress, [0, 1], [0, TARGET_KM]);
  const opacity = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [0, 1, 1, 0]);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(km, "change", (latest) => setDisplay(Math.round(latest)));

  if (reduced) {
    return (
      <div className="fixed bottom-4 left-4 z-30 bg-card/95 border border-border rounded-full pl-3 pr-4 py-2 flex items-center gap-2 shadow-lg backdrop-blur">
        <Gauge className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-mono font-black">{TARGET_KM} km percorridos</span>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity }}
      className="fixed bottom-4 left-4 z-30 bg-card/95 border border-border rounded-full pl-3 pr-4 py-2 flex items-center gap-2 shadow-lg backdrop-blur"
    >
      <Gauge className="w-4 h-4 text-blue-500" />
      <span className="text-xs font-mono font-black">{display} km percorridos</span>
    </motion.div>
  );
}
