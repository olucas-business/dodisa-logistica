import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface SectionProps {
  reduced: boolean;
}

// Real photo (Unsplash, standard free license) — aerial highway overpass
// with a truck crossing, different composition from the Hero/Antes-Depois
// photos. A full-bleed visual pause: the page's back half is mostly
// typography/UI mockups, and needed at least one more real, breathing photo
// moment to avoid reading as template-flat.
const PHOTO_URL =
  "https://images.unsplash.com/photo-1726895546262-6acf948975e4?auto=format&fit=crop&q=80&w=2400";

export default function LogisticsBreakSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section ref={ref} className="relative z-10 h-[60vh] md:h-[70vh] overflow-hidden">
      <motion.img
        src={PHOTO_URL}
        alt="Vista aérea de uma rodovia com caminhão cruzando um viaduto"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "saturate(1.05) contrast(1.05)" }}
        initial={reduced ? false : { scale: 1.08 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(2,6,23,0.35)" }} />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ backgroundImage: "linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0) 100%)" }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-8 md:bottom-12 left-0 right-0 px-6 text-center"
      >
        <p className="text-xl md:text-3xl font-black tracking-tight text-white max-w-2xl mx-auto">
          Cada caminhão na estrada. Cada real que entra e sai. Sob controle.
        </p>
      </motion.div>
    </section>
  );
}
