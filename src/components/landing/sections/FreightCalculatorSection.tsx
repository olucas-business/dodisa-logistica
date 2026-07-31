import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import BrandMark from "../../BrandMark";

interface SectionProps {
  reduced: boolean;
}

interface Inputs {
  freteIda: number;
  freteVolta: number;
  distancia: number;
  consumo: number;
  precoCombustivel: number;
  pedagios: number;
  comissao: number;
}

const DEFAULTS: Inputs = {
  freteIda: 8000,
  freteVolta: 6000,
  distancia: 1800,
  consumo: 2.5,
  precoCombustivel: 6.2,
  pedagios: 450,
  comissao: 12,
};

const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">{label}</span>
      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-primary/60 transition-colors">
        {prefix && <span className="text-slate-500 text-sm font-bold">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-white font-mono font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-slate-500 text-sm font-bold shrink-0">{suffix}</span>}
      </div>
    </label>
  );
}

// A real, live freight-cost calculator — the most literal "ação prática" the
// page can offer for its #1 stated benefit ("saiba exatamente quanto custa
// cada viagem"). Visitors edit their own numbers and watch the breakdown
// react instantly, instead of reading a paragraph that promises it.
export default function FreightCalculatorSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  const set = <K extends keyof Inputs>(key: K) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: Math.max(0, v) }));

  const bruto = inputs.freteIda + inputs.freteVolta;
  const custoCombustivel = inputs.consumo > 0 ? (inputs.distancia / inputs.consumo) * inputs.precoCombustivel : 0;
  const comissaoValor = bruto * (inputs.comissao / 100);
  const custosTotais = custoCombustivel + comissaoValor + inputs.pedagios;
  const lucro = bruto - custosTotais;
  const margem = bruto > 0 ? (lucro / bruto) * 100 : 0;

  const linhas = [
    { label: "Faturamento bruto", valor: bruto, pct: bruto > 0 ? 100 : 0, tom: "text-white" },
    { label: "Combustível", valor: -custoCombustivel, pct: bruto > 0 ? (custoCombustivel / bruto) * 100 : 0, tom: "text-red-300" },
    { label: "Comissão do motorista", valor: -comissaoValor, pct: bruto > 0 ? (comissaoValor / bruto) * 100 : 0, tom: "text-red-300" },
    { label: "Pedágios e despesas", valor: -inputs.pedagios, pct: bruto > 0 ? (inputs.pedagios / bruto) * 100 : 0, tom: "text-red-300" },
  ];

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-40">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <h2>Quanto vale esse frete, de verdade?</h2>
      </motion.div>

      <motion.div
        ref={ref}
        initial={reduced ? false : { opacity: 0, y: 40, scale: 0.97 }}
        animate={reduced || isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div
          className="absolute -inset-8 rounded-[2.5rem] pointer-events-none"
          style={{ background: "radial-gradient(closest-side, rgba(79,70,229,0.18), transparent)" }}
          aria-hidden="true"
        />
        <div
          className="relative rounded-3xl border border-white/10 shadow-2xl p-6 md:p-10"
          style={{ backgroundColor: "rgba(2,6,23,0.96)" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-8">
            <span className="flex items-center gap-2.5">
              <BrandMark size="sm" />
              <span className="text-sm font-black text-white uppercase tracking-wider">Calculadora de frete</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ao vivo
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Frete de ida" prefix="R$" value={inputs.freteIda} onChange={set("freteIda")} step={100} />
              <NumberField label="Frete de volta" prefix="R$" value={inputs.freteVolta} onChange={set("freteVolta")} step={100} />
              <NumberField label="Distância total" suffix="km" value={inputs.distancia} onChange={set("distancia")} step={50} />
              <NumberField label="Consumo médio" suffix="km/l" value={inputs.consumo} onChange={set("consumo")} step={0.1} />
              <NumberField label="Preço do combustível" prefix="R$" value={inputs.precoCombustivel} onChange={set("precoCombustivel")} step={0.05} />
              <NumberField label="Pedágios e despesas" prefix="R$" value={inputs.pedagios} onChange={set("pedagios")} step={10} />
              <div className="col-span-2">
                <NumberField label="Comissão do motorista" suffix="%" value={inputs.comissao} onChange={set("comissao")} step={0.5} />
              </div>
            </div>

            {/* Result breakdown */}
            <div className="flex flex-col">
              <div className="space-y-0 flex-1">
                {linhas.map(({ label, valor, pct, tom }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5">
                    <span className="text-xs font-bold text-slate-400">{label}</span>
                    <span className="flex items-baseline gap-2">
                      <span className={`font-mono font-bold text-sm ${tom}`}>
                        {valor < 0 ? "-" : ""}R$ {fmtMoney(Math.abs(valor))}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 w-12 text-right">{fmtPct(pct)}%</span>
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3.5 mt-1">
                  <span className="text-sm font-black text-white uppercase tracking-wide">Lucro líquido</span>
                  <span className="flex items-baseline gap-2">
                    <span className={`font-mono font-black text-xl ${lucro >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      R$ {fmtMoney(lucro)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 w-12 text-right">{fmtPct(margem)}%</span>
                  </span>
                </div>
              </div>

              {margem < 20 ? (
                <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold px-4 py-3 rounded-xl mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Margem apertada — revise os valores antes de aceitar esse frete.
                </div>
              ) : (
                <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-3 rounded-xl mt-2">
                  <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
                  Margem saudável para essa viagem.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
