import { useEffect, useRef } from "react";
import { ArrowRight, PlayCircle, ChevronDown } from "lucide-react";
import { gsap, ScrollTrigger } from "./gsapSetup";
import DashboardPreviewCard from "./DashboardPreviewCard";

interface LandingHeroProps {
  onExplore: () => void;
  reduced: boolean;
}

// Ground-level dusk highway shot — deliberately moodier and more cinematic
// than a flat aerial view. Two trucks moving steadily into a dramatic sky
// read as "always in motion, always under control" rather than a vehicle ad.
const HERO_PHOTO_URL =
  "https://images.unsplash.com/photo-1745956983820-6e960f7e8472?auto=format&fit=crop&q=80&w=2400";

export default function LandingHero({ onExplore, reduced }: LandingHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(bgRef.current, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(contentRef.current, {
        yPercent: 10,
        opacity: 0.35,
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
    <section ref={sectionRef} className="relative z-10 min-h-[680px] md:min-h-screen flex items-end overflow-hidden">
      {/* Full-bleed cinematic photo — the dominant subject of the Hero. Text
          and the live-glance card float on top rather than sharing a 50/50
          grid with it, so the frame reads as a photograph first. */}
      <div ref={bgRef} className="absolute inset-x-0 -top-[12%] -bottom-[12%]">
        <img
          src={HERO_PHOTO_URL}
          alt="Caminhões em rodovia ao entardecer — operação em movimento contínuo"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 55%", filter: "contrast(1.1) saturate(1.05) brightness(0.95)" }}
        />
        {/* Signature brand color-grade — unifies the photo with the brand palette */}
        <div className="absolute inset-0" style={{ backgroundColor: "#1D3D8F", mixBlendMode: "color", opacity: 0.5 }} />
        {/* Fixed dark navy overlays (literal rgba, not the theme's slate-950 token
            — this project's dark-mode palette inverts slate-950 to near-white,
            which would wash this cinematic overlay out). Bottom-heavy gradient
            keeps the text block, floating card and CTAs legible. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top, rgba(2,6,23,0.97) 0%, rgba(2,6,23,0.55) 45%, rgba(2,6,23,0.12) 72%, rgba(2,6,23,0.3) 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-full md:w-3/5"
          style={{ backgroundImage: "linear-gradient(to right, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0) 100%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pb-20 md:pb-28 pt-40">
        <div ref={contentRef} className="max-w-2xl">
          <span className="block text-xs md:text-sm font-black uppercase tracking-[0.25em] text-blue-200/90 mb-5">
            Gestão inteligente de frotas
          </span>
          <h1 className="hero-title font-black tracking-tight text-white leading-[0.95]">Fleet One</h1>
          <p className="mt-6 text-xl md:text-2xl text-slate-100/90 font-semibold max-w-xl">
            Organização, controle e clareza para sua transportadora — em um só lugar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={onExplore}
              className="cta-btn w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
            >
              Conhecer a Plataforma
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onExplore}
              className="cta-btn w-full sm:w-auto bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Ver Demonstração
            </button>
          </div>
        </div>
      </div>

      {/* Compact live-glance card, floating apart from the text so the photo
          stays the star instead of splitting the frame with a dashboard mockup. */}
      <div
        className="hidden lg:block absolute right-10 xl:right-16 bottom-16 w-[300px]"
        style={{ transform: "scale(0.86)", transformOrigin: "bottom right" }}
      >
        <DashboardPreviewCard reduced={reduced} />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50" aria-hidden="true">
        <span className="text-[10px] font-bold uppercase tracking-widest">Role</span>
        <ChevronDown className="w-4 h-4 animate-bounce" />
      </div>
    </section>
  );
}
