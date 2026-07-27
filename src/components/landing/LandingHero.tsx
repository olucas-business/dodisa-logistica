import { ArrowRight, LogIn } from "lucide-react";

interface LandingHeroProps {
  onNavigateLogin: () => void;
  onExplore: () => void;
}

export default function LandingHero({ onNavigateLogin, onExplore }: LandingHeroProps) {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-40 md:pb-56 text-center">
      <h1 className="hero-title font-black tracking-tight text-foreground leading-none">
        Fleet One
      </h1>
      <p className="mt-4 text-lg md:text-xl text-muted-foreground font-semibold">
        A maneira mais inteligente de gerenciar sua frota.
      </p>
      <p className="mt-3 max-w-xl mx-auto text-base text-muted-foreground">
        Controle sua operação, seus caminhões e suas finanças em um único lugar.
      </p>

      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onExplore}
          className="cta-btn w-full sm:w-auto bg-card border-2 border-primary text-primary hover:bg-accent flex items-center justify-center gap-2"
        >
          Explorar demonstração
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onNavigateLogin}
          className="cta-btn w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Entrar no sistema
        </button>
      </div>
    </section>
  );
}
