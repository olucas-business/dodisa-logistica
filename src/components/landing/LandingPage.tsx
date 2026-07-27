import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import ScrollTruck from "./ScrollTruck";
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
  const narrativeWrapperRef = useRef<HTMLDivElement>(null);
  const firstSectionRef = useRef<HTMLDivElement>(null);

  const handleExplore = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <div id="fleetone-landing" className="relative bg-background text-foreground min-h-screen">
      <LandingNav onNavigateLogin={onNavigateLogin} />

      <div ref={narrativeWrapperRef} className="relative">
        <ScrollTruck targetRef={narrativeWrapperRef} reduced={reduced} />

        <LandingHero onNavigateLogin={onNavigateLogin} onExplore={handleExplore} />

        <div ref={firstSectionRef}>
          <OperacaoSection reduced={reduced} />
        </div>
        <RastreamentoSection reduced={reduced} />
        <CombustivelSection reduced={reduced} />
        <DespesasManutencaoSection reduced={reduced} />
        <FretesFinanceiroSection reduced={reduced} />
        <MotoristasSection reduced={reduced} />
      </div>

      <FinalCtaSection onNavigateSignup={onNavigateSignup} onNavigateLogin={onNavigateLogin} />
      <LandingFooter onNavigateLogin={onNavigateLogin} />
    </div>
  );
}
