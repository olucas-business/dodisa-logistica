import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { comoFunciona } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

// "Como funciona" — four short editorial steps, numbered instead of iconed.
// Kept deliberately plain: this is the one place on the page that gets close
// to "how the product works", so it earns the right to be simple and calm.
export default function HowItWorksSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-40">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg mx-auto mb-16 md:mb-20"
      >
        <h2>Como funciona.</h2>
      </motion.div>

      <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        {comoFunciona.map(({ step, title }, i) => (
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: reduced ? 0 : i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative pt-6 border-t-2 border-primary/30"
          >
            <span className="font-mono text-sm font-bold text-primary">{step}</span>
            <h3 className="mt-3 text-lg md:text-xl font-black tracking-tight">{title}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
