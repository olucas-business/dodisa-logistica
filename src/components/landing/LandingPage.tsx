import { useRef } from "react";
import { useReducedMotion } from "motion/react";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import RoadSignDivider from "./RoadSignDivider";
import FinalCtaSection from "./FinalCtaSection";
import LandingFooter from "./LandingFooter";
import BeforeAfterSection from "./sections/BeforeAfterSection";
import TimelineSection from "./sections/TimelineSection";
import DashboardModulesSection from "./sections/DashboardModulesSection";
import BeneficiosSection from "./sections/BeneficiosSection";
import NumerosSection from "./sections/NumerosSection";
import DemonstracaoSection from "./sections/DemonstracaoSection";

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
        <BeforeAfterSection reduced={reduced} />
      </div>
      <RoadSignDivider label="A jornada da operação" />
      <TimelineSection reduced={reduced} />
      <RoadSignDivider label="Módulos do sistema" />
      <DashboardModulesSection reduced={reduced} />
      <RoadSignDivider label="Benefícios" />
      <BeneficiosSection reduced={reduced} />
      <RoadSignDivider label="Em números" />
      <NumerosSection reduced={reduced} />
      <RoadSignDivider label="Demonstração" />
      <DemonstracaoSection reduced={reduced} onExplore={handleExplore} />

      <FinalCtaSection onNavigateSignup={onNavigateSignup} onNavigateLogin={onNavigateLogin} />
      <LandingFooter onNavigateLogin={onNavigateLogin} />
    </div>
  );
}
