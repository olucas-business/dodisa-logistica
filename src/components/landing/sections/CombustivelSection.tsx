import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Fuel } from "lucide-react";
import SectionReveal from "../SectionReveal";
import RadialGauge from "../../RadialGauge";
import { gsap } from "../gsapSetup";
import { combustivelStats, combustivelTrend } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

export default function CombustivelSection({ reduced }: SectionProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [fillProgress, setFillProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced || !gridRef.current) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: { trigger: gridRef.current, start: "top 78%", toggleActions: "play none none none" },
      onUpdate: () => setFillProgress(state.p),
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  const animatedKmL = combustivelStats.avgKmL * fillProgress;

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2 className="flex items-center justify-center gap-2">
          <Fuel className="w-6 h-6 text-blue-500" />
          Controle o que mantém sua frota em movimento.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Diesel, Arla, km/L e custo — tudo acompanhado abastecimento a abastecimento.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <RadialGauge
          label="KM/L (média)"
          value={(animatedKmL / 5) * 100}
          displayValue={`${animatedKmL.toFixed(1)} km/L`}
        />

        <div className="bg-card border border-border p-5 rounded-2xl">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Litros no mês</span>
          <p className="text-3xl mt-1">{combustivelStats.litersMonth.toLocaleString("pt-BR")} L</p>
          {/* Abstract "fuel pump filling" indicator, in sync with the gauge above */}
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
              style={{ width: `${fillProgress * 100}%` }}
            />
          </div>
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
