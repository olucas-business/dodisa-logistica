import BrandMark from "../BrandMark";

interface LandingFooterProps {
  onNavigateLogin: () => void;
}

export default function LandingFooter({ onNavigateLogin }: LandingFooterProps) {
  return (
    <footer className="relative z-10 border-t border-border">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="text-sm font-bold text-foreground">Fleet One</span>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        <button onClick={onNavigateLogin} className="text-sm font-bold text-primary hover:underline">
          Já é cliente? Entrar no sistema
        </button>
      </div>
    </footer>
  );
}
