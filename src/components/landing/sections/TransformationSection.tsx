import { useRef } from "react";
import { motion, useInView } from "motion/react";
import BrandMark from "../../BrandMark";

interface SectionProps {
  reduced: boolean;
}

// The pivot of the story: after ChaosSection, this is the single decisive
// moment where the narrative resolves. Deliberately the plainest section on
// the page — one wordmark, one line, one glow — so it reads as a turning
// point rather than another content block. The glow keeps breathing and the
// ring keeps rotating after the reveal, so the moment stays alive instead of
// freezing the instant the entrance animation ends.
export default function TransformationSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" });
  const show = reduced || isInView;

  return (
    <section ref={ref} className="relative z-10 bg-[#05070d] min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <motion.div
          className="w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(79,70,229,0.35), transparent)" }}
          initial={reduced ? false : { opacity: 0, scale: 0.7 }}
          animate={
            show
              ? reduced
                ? { opacity: 1, scale: 1 }
                : { opacity: [0.75, 1, 0.75], scale: [1, 1.08, 1] }
              : {}
          }
          transition={
            reduced
              ? { duration: 1.4, ease: [0.16, 1, 0.3, 1] }
              : { duration: 5, delay: 1.4, repeat: Infinity, ease: "easeInOut" }
          }
        />
        {!reduced && (
          <motion.div
            className="absolute w-[420px] h-[420px] md:w-[560px] md:h-[560px] rounded-full border border-indigo-400/20"
            initial={{ opacity: 0, rotate: 0 }}
            animate={show ? { opacity: 1, rotate: 360 } : {}}
            transition={{ opacity: { duration: 1, delay: 0.6 }, rotate: { duration: 40, repeat: Infinity, ease: "linear" } }}
            style={{ borderStyle: "dashed" }}
          />
        )}
      </div>

      <div className="relative text-center px-6">
        <motion.span
          initial={reduced ? false : { opacity: 0, y: -8 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="block text-xs font-black uppercase tracking-[0.3em] text-indigo-300/80 mb-6"
        >
          A virada
        </motion.span>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-8"
        >
          <div className="scale-[1.8]">
            <BrandMark size="lg" />
          </div>
        </motion.div>

        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="hero-title text-white font-black"
        >
          Fleet One.
        </motion.h2>

        <motion.p
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-lg md:text-2xl font-semibold text-slate-300 max-w-xl mx-auto"
        >
          Você para de reagir à operação. Passa a comandá-la.
        </motion.p>
      </div>
    </section>
  );
}
