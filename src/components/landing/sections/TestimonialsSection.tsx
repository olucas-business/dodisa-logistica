import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Quote } from "lucide-react";

interface SectionProps {
  reduced: boolean;
}

// Conteúdo ilustrativo — sem nome, empresa ou foto inventados, para não
// apresentar uma identidade fabricada como se fosse um cliente real. Trocar
// por depoimentos reais assim que houver.
const TESTEMUNHOS = [
  {
    quote: "Antes eu vivia perdido em planilha e WhatsApp. Hoje sei exatamente quanto cada viagem me custa.",
    role: "Dono de transportadora",
    place: "Minas Gerais",
  },
  {
    quote: "Parei de descobrir prejuízo no fim do mês. Agora vejo o problema antes dele acontecer.",
    role: "Gestor de frota",
    place: "São Paulo",
  },
  {
    quote: "Centralizei motoristas, combustível e frete em um lugar só. Nunca mais voltei pra planilha.",
    role: "Dono de transportadora",
    place: "Paraná",
  },
];

export default function TestimonialsSection({ reduced }: SectionProps) {
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
        <h2>Quem usa, não volta pra planilha.</h2>
      </motion.div>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTEMUNHOS.map(({ quote, role, place }, i) => (
          <motion.div
            key={quote}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: reduced ? 0 : i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            <Quote className="w-5 h-5 text-primary/50 mb-4" />
            <p className="text-base md:text-lg font-semibold leading-snug flex-1">"{quote}"</p>
            <div className="mt-5 text-sm">
              <p className="font-bold">{role}</p>
              <p className="text-muted-foreground">{place}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
