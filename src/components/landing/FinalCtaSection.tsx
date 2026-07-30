interface FinalCtaSectionProps {
  onNavigateSignup: () => void;
  onNavigateLogin: () => void;
}

export default function FinalCtaSection({ onNavigateSignup, onNavigateLogin }: FinalCtaSectionProps) {
  return (
    <section className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 py-24 md:py-32 text-center overflow-hidden">
      {/* Soft ambient glow — a quiet visual echo of the Hero's color-graded
          photo, so the page feels bookended rather than just ending. */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[500px] -z-10 pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(79,70,229,0.15), transparent)" }}
        aria-hidden="true"
      />
      <p className="text-sm font-black uppercase tracking-widest text-primary">Fleet One</p>
      <p className="mt-1 text-muted-foreground font-semibold">A maneira mais inteligente de gerenciar sua frota.</p>
      <h2 className="hero-title mt-4 font-black tracking-tight text-foreground">
        Sua operação merece mais controle.
      </h2>

      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onNavigateSignup}
          className="cta-btn w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
        >
          Começar agora
        </button>
        <button
          onClick={onNavigateLogin}
          className="cta-btn w-full sm:w-auto bg-card border-2 border-primary text-primary hover:bg-accent"
        >
          Solicitar demonstração
        </button>
      </div>
    </section>
  );
}
