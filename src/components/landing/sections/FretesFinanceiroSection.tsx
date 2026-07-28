import { useEffect, useRef, useState } from "react";
import { Coins, Package } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { gsap } from "../gsapSetup";
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
  const listRef = useRef<HTMLDivElement>(null);
  const [processedCount, setProcessedCount] = useState(reduced ? fretesFinanceiro.length : 0);

  useEffect(() => {
    if (reduced || !listRef.current) return;
    const rows = listRef.current.querySelectorAll<HTMLElement>(".freight-row-item");
    const counter = { n: 0 };
    const totalDuration = rows.length * 0.15 + 0.45;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: listRef.current, start: "top 78%", toggleActions: "play none none none" },
    });
    tl.fromTo(rows, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.15, ease: "power2.out" }, 0);
    tl.to(counter, { n: fretesFinanceiro.length, duration: totalDuration, ease: "power1.out", onUpdate: () => setProcessedCount(Math.round(counter.n)) }, 0);
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [reduced]);

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
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Dados de demonstração
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <Package className="w-3.5 h-3.5 text-blue-500" />
            {processedCount}/{fretesFinanceiro.length} manifestos processados
          </span>
        </div>

        <div ref={listRef} className="space-y-3">
          {fretesFinanceiro.map((f) => (
            <div key={f.id} className="freight-row-item flex items-center justify-between gap-3 py-2 border-b border-border last:border-b-0">
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
