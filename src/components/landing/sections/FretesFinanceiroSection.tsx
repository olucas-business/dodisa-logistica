import { Coins } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { fretesFinanceiro } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  Pago: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  Pendente: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30",
  Adiantamento: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
};

export default function FretesFinanceiroSection({ reduced }: SectionProps) {
  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2 className="flex items-center justify-center gap-2">
          <Coins className="w-6 h-6 text-blue-500" />
          Fretes e financeiro, sempre em dia.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Pagos, pendentes e adiantamentos — clareza total sobre o caixa da operação.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <span className="inline-block mb-4 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">
          Dados de demonstração
        </span>

        <div className="space-y-3">
          {fretesFinanceiro.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-b-0">
              <span className="font-semibold text-foreground truncate">{f.cliente}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-sm">R$ {f.valor.toLocaleString("pt-BR")}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_STYLE[f.status]}`}>
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
