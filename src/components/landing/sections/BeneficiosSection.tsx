import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { beneficios } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

// Pure editorial list — no icons, no cards. What the customer buys is
// organização/controle/economia/clareza, and the type itself should carry
// that weight instead of a grid of colored chips.
export default function BeneficiosSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-40">
      <motion.h2
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl mb-16 md:mb-20"
      >
        Não é um sistema. É tranquilidade.
      </motion.h2>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
        {beneficios.map(({ label }, i) => (
          <motion.div
            key={label}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: reduced ? 0 : i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className={`group py-7 md:py-8 flex items-start gap-5 ${i > 0 ? "border-t border-border" : ""} ${
              i === 1 ? "md:border-t-0" : ""
            }`}
          >
            <span className="font-mono text-xs text-muted-foreground/50 pt-1.5 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-xl md:text-2xl font-bold tracking-tight leading-snug transition-colors group-hover:text-primary">
              {label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
