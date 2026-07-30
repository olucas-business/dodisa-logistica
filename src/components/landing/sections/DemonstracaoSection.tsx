import { LayoutGrid, Coins, Fuel, MapPin, PlayCircle } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { demoTiles } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
  onExplore: () => void;
}

const ICONS = { LayoutGrid, Coins, Fuel, MapPin };

export default function DemonstracaoSection({ reduced, onExplore }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 py-24 md:py-36 text-center">
      <h2>Veja o Fleet One por dentro.</h2>
      <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
        Uma prévia de como sua operação vai funcionar — com dados de demonstração.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {demoTiles.map(({ label, icon }) => {
          const Icon = ICONS[icon];
          return (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-2">
              <span className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-bold">{label}</span>
            </div>
          );
        })}
      </div>

      <span className="inline-block mt-6 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">
        Dados de demonstração
      </span>

      <div className="mt-8">
        <button
          onClick={onExplore}
          className="cta-btn bg-primary text-primary-foreground hover:opacity-90 shadow-lg inline-flex items-center gap-2"
        >
          <PlayCircle className="w-5 h-5" /> Explorar Demonstração
        </button>
      </div>
    </SectionReveal>
  );
}
