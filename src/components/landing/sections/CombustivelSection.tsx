import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Fuel } from "lucide-react";
import SectionReveal from "../SectionReveal";
import RadialGauge from "../../RadialGauge";
import { combustivelStats, combustivelTrend } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

export default function CombustivelSection({ reduced }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2 className="flex items-center justify-center gap-2">
          <Fuel className="w-6 h-6 text-blue-500" />
          Controle o que mantém sua frota em movimento.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Diesel, Arla, km/L e custo — tudo acompanhado abastecimento a abastecimento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <RadialGauge label="KM/L (média)" value={(combustivelStats.avgKmL / 5) * 100} displayValue={`${combustivelStats.avgKmL.toFixed(1)} km/L`} />

        <div className="bg-card border border-border p-5 rounded-2xl">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Litros no mês</span>
          <p className="text-3xl mt-1">{combustivelStats.litersMonth.toLocaleString("pt-BR")} L</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Custo no mês</span>
          <p className="text-3xl mt-1">R$ {combustivelStats.costMonth.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mt-5 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combustivelTrend}>
            <defs>
              <linearGradient id="landingFuelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip />
            <Area type="monotone" dataKey="litros" name="Litros" stroke="#3b82f6" strokeWidth={2.5} fill="url(#landingFuelGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionReveal>
  );
}
