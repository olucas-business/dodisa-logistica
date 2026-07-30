import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Wrench, RotateCw } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { despesasBreakdown, despesasStats } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

export default function DespesasManutencaoSection({ reduced }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2 className="flex items-center justify-center gap-2">
          <Wrench className="w-6 h-6 text-blue-500" />
          Você sabe onde seu dinheiro está sendo gasto.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Combustível, pedágio, oficina, manutenção e pneus em um único painel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        <div className="bg-card border border-border rounded-2xl p-5 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={despesasBreakdown} dataKey="valor" nameKey="categoria" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {despesasBreakdown.map((d) => (
                  <Cell key={d.categoria} fill={d.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {despesasBreakdown.map((d) => (
            <div key={d.categoria} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.cor }} />
                {d.categoria}
              </span>
              <span className="font-mono font-bold">R$ {d.valor.toLocaleString("pt-BR")}</span>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-card border border-border p-4 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Pneus trocados
              </span>
              <p className="text-xl font-black font-mono mt-1">{despesasStats.tiresChangedMonth}</p>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Próxima manutenção
              </span>
              <p className="text-xl font-black font-mono mt-1">{despesasStats.nextMaintenanceDays}d</p>
            </div>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
