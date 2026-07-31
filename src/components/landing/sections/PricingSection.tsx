import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";

interface SectionProps {
  reduced: boolean;
  onNavigateSignup: () => void;
}

// Sem valores em R$ publicados de propósito — até termos os planos reais
// confirmados, é melhor levar para uma conversa do que arriscar mostrar um
// preço errado ou desatualizado.
const PLANOS = [
  {
    nome: "Essencial",
    descricao: "Para transportadoras começando a organizar a operação.",
    itens: ["Frota e motoristas", "Fretes e faturamento", "Combustível e despesas", "Relatórios básicos"],
  },
  {
    nome: "Completo",
    descricao: "Para quem quer controle total, do frete ao caixa.",
    itens: ["Tudo do Essencial", "IA e relatórios avançados", "Rastreamento em tempo real", "Suporte prioritário"],
    destaque: true,
  },
];

export default function PricingSection({ reduced, onNavigateSignup }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-40">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg mx-auto mb-16 md:mb-20"
      >
        <h2>Um plano para cada tamanho de operação.</h2>
      </motion.div>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANOS.map(({ nome, descricao, itens, destaque }, i) => (
          <motion.div
            key={nome}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: reduced ? 0 : i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-3xl p-8 flex flex-col ${
              destaque ? "border-2 border-primary shadow-xl" : "border border-border"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-widest text-primary">{nome}</p>
            <p className="mt-2 text-muted-foreground text-sm">{descricao}</p>

            <ul className="mt-6 space-y-3 flex-1">
              {itens.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-semibold">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={onNavigateSignup}
              className={`cta-btn mt-8 w-full ${
                destaque
                  ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
                  : "bg-card border-2 border-primary text-primary hover:bg-accent"
              }`}
            >
              Falar com a gente
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
