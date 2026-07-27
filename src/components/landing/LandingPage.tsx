import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import ScrollTruck from "./ScrollTruck";
import ScrollProgressBar from "./ScrollProgressBar";
import RoadLine from "./RoadLine";
import TireTrackPattern from "./TireTrackPattern";
import TripOdometer from "./TripOdometer";
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
  const narrativeWrapperRef = useRef<HTMLDivElement>(null);
  const firstSectionRef = useRef<HTMLDivElement>(null);

  const handleExplore = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <div id="fleetone-landing" className="relative bg-background text-foreground min-h-screen">
      <LandingNav onNavigateLogin={onNavigateLogin} />
      <ScrollProgressBar reduced={reduced} />
      <TripOdometer targetRef={narrativeWrapperRef} reduced={reduced} />

      <div ref={narrativeWrapperRef} className="relative">
        <TireTrackPattern />
        <RoadLine targetRef={narrativeWrapperRef} reduced={reduced} />
        <ScrollTruck targetRef={narrativeWrapperRef} reduced={reduced} />

        <LandingHero onNavigateLogin={onNavigateLogin} onExplore={handleExplore} />

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
      </div>

      <RoadSignDivider label="Chegada" />
      <FinalCtaSection onNavigateSignup={onNavigateSignup} onNavigateLogin={onNavigateLogin} />
      <LandingFooter onNavigateLogin={onNavigateLogin} />
    </div>
  );
}
