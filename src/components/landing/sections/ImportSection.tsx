import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { FileSpreadsheet, ArrowRight } from "lucide-react";
import BrandMark from "../../BrandMark";

interface SectionProps {
  reduced: boolean;
}

// Ataca diretamente o medo de migração mostrado no Antes/Depois — sair da
// planilha não precisa ser um recomeço do zero.
export default function ImportSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });

  return (
    <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-36 text-center">
      <motion.div
        ref={ref}
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-center gap-5 md:gap-8 mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
            <FileSpreadsheet className="w-7 h-7 md:w-9 md:h-9 text-emerald-600" />
          </div>
          <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
            <BrandMark size="lg" />
          </div>
        </div>

        <h2>Já tem uma planilha? A migração é simples.</h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Frota, motoristas e histórico de fretes são importados do seu Excel — você não recomeça do zero.
        </p>
      </motion.div>
    </section>
  );
}
