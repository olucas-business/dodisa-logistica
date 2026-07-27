import BrandMark from "../BrandMark";

interface LandingNavProps {
  onNavigateLogin: () => void;
}

export default function LandingNav({ onNavigateLogin }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-navbar/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="text-sm font-black tracking-tight uppercase bg-gradient-to-r from-[#0B3D5C] to-[#2455D9] dark:from-[#5B8DEF] dark:to-[#8FB2F5] bg-clip-text text-transparent">
            Fleet One
          </span>
        </div>
        <button
          onClick={onNavigateLogin}
          className="nav-btn bg-primary text-primary-foreground hover:opacity-90 shadow-md"
        >
          Entrar no sistema
        </button>
      </div>
    </header>
  );
}
