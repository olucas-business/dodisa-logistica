import { useRef, ReactNode } from "react";
import { motion, useInView } from "motion/react";

interface SectionRevealProps {
  children: ReactNode;
  reduced: boolean;
  className?: string;
}

export default function SectionReveal({ children, reduced, className = "" }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
