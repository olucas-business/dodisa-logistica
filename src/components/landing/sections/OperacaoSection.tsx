import { Truck, Users, Compass } from "lucide-react";
import SectionReveal from "../SectionReveal";
import CountUp from "../../CountUp";
import { operacaoStats } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const CARDS = [
  { label: "Caminhões ativos", value: operacaoStats.trucksActive, icon: Truck, chip: "bg-blue-500/10 text-blue-500" },
  { label: "Motoristas em rota", value: operacaoStats.driversOnRoute, icon: Users, chip: "bg-emerald-500/10 text-emerald-500" },
  { label: "Viagens hoje", value: operacaoStats.tripsToday, icon: Compass, chip: "bg-amber-500/10 text-amber-500" },
];

export default function OperacaoSection({ reduced }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2>Sua operação, em um único lugar.</h2>
        <p className="mt-2 text-muted-foreground">
          Caminhões, motoristas e viagens sempre visíveis, sem planilhas soltas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {CARDS.map(({ label, value, icon: Icon, chip }) => (
          <div key={label} className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{label}</span>
              <span className={`p-1.5 rounded-lg ${chip}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-3xl mt-3">
              <CountUp value={value} />
            </p>
          </div>
        ))}
      </div>
    </SectionReveal>
  );
}
