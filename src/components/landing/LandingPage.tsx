import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import type Lenis from "lenis";
import { createLenis } from "./lenisSetup";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import FinalCtaSection from "./FinalCtaSection";
import LandingFooter from "./LandingFooter";
import ProblemSolutionSection from "./sections/ProblemSolutionSection";
import BeforeAfterSection from "./sections/BeforeAfterSection";
import ProductShowcaseSection from "./sections/ProductShowcaseSection";
import ImportSection from "./sections/ImportSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import BeneficiosSection from "./sections/BeneficiosSection";
import FreightCalculatorSection from "./sections/FreightCalculatorSection";
import LogisticsBreakSection from "./sections/LogisticsBreakSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import NumerosSection from "./sections/NumerosSection";
import PricingSection from "./sections/PricingSection";
import FAQSection from "./sections/FAQSection";

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
}

export default function LandingPage({ onNavigateLogin, onNavigateSignup }: LandingPageProps) {
  const reduced = !!useReducedMotion();
  const firstSectionRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Cinematic smooth-scroll for the whole page — skipped under reduced-motion,
  // where native (instant) scroll is what the visitor actually asked for.
  useEffect(() => {
    if (reduced) return;
    const { lenis, destroy } = createLenis();
    lenisRef.current = lenis;
    return () => {
      lenisRef.current = null;
      destroy();
    };
  }, [reduced]);

  const handleExplore = () => {
    if (lenisRef.current && firstSectionRef.current) {
      lenisRef.current.scrollTo(firstSectionRef.current, { duration: 1.2 });
    } else {
      firstSectionRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  };

  return (
    <div id="fleetone-landing" className="relative bg-background text-foreground min-h-screen">
      <LandingNav onNavigateLogin={onNavigateLogin} />

      <LandingHero onExplore={handleExplore} reduced={reduced} />

      {/* Problema → Solução: um bloco simples, com fade-in. */}
      <div ref={firstSectionRef}>
        <ProblemSolutionSection reduced={reduced} />
      </div>

      {/* A transformação, demonstrada, e depois o produto de fato. */}
      <BeforeAfterSection reduced={reduced} />
      <ProductShowcaseSection reduced={reduced} />
      <ImportSection reduced={reduced} />

      {/* Benefícios → prova prática do benefício #1 → como funciona → prova social. */}
      <BeneficiosSection reduced={reduced} />
      <FreightCalculatorSection reduced={reduced} />
      <HowItWorksSection reduced={reduced} />
      <LogisticsBreakSection reduced={reduced} />
      <TestimonialsSection reduced={reduced} />
      <NumerosSection reduced={reduced} />

      {/* Preço → objeções → CTA final. */}
      <PricingSection reduced={reduced} onNavigateSignup={onNavigateSignup} />
      <FAQSection reduced={reduced} />

      <FinalCtaSection onNavigateSignup={onNavigateSignup} onNavigateLogin={onNavigateLogin} />
      <LandingFooter onNavigateLogin={onNavigateLogin} />
    </div>
  );
}
