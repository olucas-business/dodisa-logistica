import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import RoadSignDivider from "./RoadSignDivider";
import FinalCtaSection from "./FinalCtaSection";
import LandingFooter from "./LandingFooter";
import OperacaoSection from "./sections/OperacaoSection";
import RastreamentoSection from "./sections/RastreamentoSection";
import CombustivelSection from "./sections/CombustivelSection";
import DespesasManutencaoSection from "./sections/DespesasManutencaoSection";
import FretesFinanceiroSection from "./sections/FretesFinanceiroSection";
import MotoristasSection from "./sections/MotoristasSection";

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
}

export default function LandingPage({ onNavigateLogin, onNavigateSignup }: LandingPageProps) {
  const reduced = !!useReducedMotion();
  const firstSectionRef = useRef<HTMLDivElement>(null);

  const handleExplore = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <div id="fleetone-landing" className="relative bg-background text-foreground min-h-screen">
      <LandingNav onNavigateLogin={onNavigateLogin} />

      <LandingHero onExplore={handleExplore} reduced={reduced} />

      <div ref={firstSectionRef}>
        <OperacaoSection reduced={reduced} />
      </div>
      <RoadSignDivider label="Rastreamento" />
      <RastreamentoSection reduced={reduced} />
      <RoadSignDivider label="Combustível" />
      <CombustivelSection reduced={reduced} />
      <RoadSignDivider label="Despesas & Manutenção" />
      <DespesasManutencaoSection reduced={reduced} />
      <RoadSignDivider label="Fretes & Financeiro" />
      <FretesFinanceiroSection reduced={reduced} />
      <RoadSignDivider label="Motoristas" />
      <MotoristasSection reduced={reduced} />

      <FinalCtaSection onNavigateSignup={onNavigateSignup} onNavigateLogin={onNavigateLogin} />
      <LandingFooter onNavigateLogin={onNavigateLogin} />
    </div>
  );
}
