import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ChevronDown } from "lucide-react";

interface SectionProps {
  reduced: boolean;
}

const PERGUNTAS = [
  {
    pergunta: "Dá para importar minha planilha do Excel?",
    resposta: "Sim. Frota, motoristas e histórico de fretes podem ser importados de uma planilha existente — você não perde o que já tem registrado.",
  },
  {
    pergunta: "Funciona pelo celular?",
    resposta: "Sim, o Fleet One funciona no navegador do celular, tablet ou computador, sem precisar instalar nada.",
  },
  {
    pergunta: "Quantos usuários posso ter?",
    resposta: "Depende do plano. Você pode adicionar motoristas e outros membros da equipe com acessos diferentes, conforme a necessidade da sua operação.",
  },
  {
    pergunta: "Meus dados financeiros ficam seguros?",
    resposta: "Sim. Os dados da sua transportadora são privados e não são compartilhados com outras empresas.",
  },
  {
    pergunta: "Preciso de contrato de fidelidade?",
    resposta: "Não. Você pode cancelar quando quiser, sem multa ou período mínimo obrigatório.",
  },
];

export default function FAQSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section className="relative z-10 max-w-2xl mx-auto px-6 py-24 md:py-40">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16 md:mb-20"
      >
        <h2>Perguntas frequentes.</h2>
      </motion.div>

      <div ref={ref}>
        {PERGUNTAS.map(({ pergunta, resposta }, i) => (
          <motion.details
            key={pergunta}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className={`group py-5 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-base md:text-lg">
              {pergunta}
              <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">{resposta}</p>
          </motion.details>
        ))}
      </div>
    </section>
  );
}
