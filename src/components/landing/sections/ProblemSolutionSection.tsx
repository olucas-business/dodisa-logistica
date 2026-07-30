import SectionReveal from "../SectionReveal";
import BrandMark from "../../BrandMark";

interface SectionProps {
  reduced: boolean;
}

// Problema → solução, contado em um único bloco simples: aparece com um
// fade-in ao entrar na tela (via SectionReveal, o mesmo padrão já usado no
// resto da página) — sem scroll-pin, sem glow, sem fundo escuro fixo.
export default function ProblemSolutionSection({ reduced }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-36 text-center">
      <p className="text-xl md:text-3xl font-bold tracking-tight leading-snug text-muted-foreground">
        Planilhas soltas. WhatsApp. Papel.
        <br />
        Aos poucos, você perde o controle da operação.
      </p>

      <div className="my-10 md:my-14 flex justify-center">
        <BrandMark size="lg" />
      </div>

      <h2 className="hero-title font-black">Fleet One.</h2>
      <p className="mt-6 text-lg md:text-2xl font-semibold text-muted-foreground max-w-xl mx-auto">
        Você para de reagir à operação. Passa a comandá-la.
      </p>
    </SectionReveal>
  );
}
