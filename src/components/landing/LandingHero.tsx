import { useEffect, useRef } from "react";
import { ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import { gsap, ScrollTrigger } from "./gsapSetup";
import DashboardPreviewCard from "./DashboardPreviewCard";
import Canvas3DWrapper from "./Canvas3DWrapper";

interface LandingHeroProps {
  onExplore: () => void;
  onNavigateLogin: () => void;
  reduced: boolean;
}

const HERO_PHOTO_URL =
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=2400";

export default function LandingHero({ onExplore, onNavigateLogin, reduced }: LandingHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(bgRef.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(cardRef.current, {
        yPercent: -10,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(contentRef.current, {
        yPercent: 5,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduced]);

  useEffect(() => {
    return () => ScrollTrigger.getAll().forEach((st) => st.trigger === sectionRef.current && st.kill());
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 min-h-[640px] md:min-h-[720px] lg:min-h-screen flex items-center overflow-hidden">
      {/* Background photo layer (subtle parallax) */}
      <div ref={bgRef} className="absolute inset-x-0 -top-[10%] -bottom-[10%]">
        <img
          src={HERO_PHOTO_URL}
          alt="Caminhão Scania moderno em rodovia"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          style={{ objectPosition: "30% 55%", filter: "grayscale(0.4) contrast(1.15) brightness(0.85) saturate(1.05)" }}
        />
        {/* Signature brand color-grade — unifies the photo with the brand palette
            (a plain photo would read as generic reused stock imagery) and softens
            the truck's own real-world decals into atmosphere rather than clutter. */}
        <div className="absolute inset-0" style={{ backgroundColor: "#1D3D8F", mixBlendMode: "color" }} />
        {/* Fixed dark navy overlay (literal rgba, not the theme's slate-950 token —
            this project's dark-mode palette inverts slate-950 to near-white, which
            would otherwise wash this cinematic overlay out to near-white). */}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(2,6,23,0.35)", mixBlendMode: "multiply" }} />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(to right, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.72) 48%, rgba(2,6,23,0.25) 100%)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ backgroundImage: "linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(2,6,23,0.4) 50%, rgba(2,6,23,0) 100%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 py-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <div ref={contentRef} className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-300 mb-5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Gestão inteligente de frotas
          </span>

          <h1 className="hero-title font-black tracking-tight text-white leading-[0.95]">Fleet One</h1>
          <p className="mt-5 text-xl md:text-2xl text-slate-100 font-bold">
            A maneira mais inteligente de gerenciar sua frota.
          </p>
          <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-base md:text-lg text-slate-300 leading-relaxed">
            Controle sua operação, seus caminhões e suas finanças em um único lugar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
            <button
              onClick={onExplore}
              className="cta-btn w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
            >
              Explorar Demonstração
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateLogin}
              className="cta-btn w-full sm:w-auto bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Entrar no Sistema
            </button>
          </div>
        </div>

        <div ref={cardRef} className="relative hidden lg:block" style={{ perspective: "1200px" }}>
          <div className="absolute -top-10 -right-6 w-24 h-24 pointer-events-none">
            <Canvas3DWrapper reduced={reduced} className="w-full h-full" loadScene={() => import("./three/GpsPinScene")} />
          </div>
          <DashboardPreviewCard reduced={reduced} />
        </div>
      </div>
    </section>
  );
}
