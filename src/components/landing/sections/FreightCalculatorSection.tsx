import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import BrandMark from "../../BrandMark";

interface SectionProps {
  reduced: boolean;
}

interface Inputs {
  valorFrete: number;
  distancia: number;
  consumo: number;
}

const DEFAULTS: Inputs = {
  valorFrete: 14000,
  distancia: 1800,
  consumo: 2.5,
};

const PRECO_COMBUSTIVEL = 6.2;
const COMISSAO_PCT = 12;

const fmtMoney = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-full bg-transparent text-white font-mono font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-slate-500 text-sm font-bold shrink-0">{suffix}</span>}
      </div>
    </label>
  );
}

// A small, illustrative sample of the freight-cost calculation — NOT the
// full tool (that lives inside the platform, with tolls, driver commission
// settings, saved history, etc.). This just proves the "saiba quanto custa
// cada viagem" benefit is real, with three fields instead of the full form.
export default function FreightCalculatorSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

  const set = <K extends keyof Inputs>(key: K) => (v: number) => setInputs((prev) => ({ ...prev, [key]: v }));

  const custoCombustivel = inputs.consumo > 0 ? (inputs.distancia / inputs.consumo) * PRECO_COMBUSTIVEL : 0;
  const comissaoValor = inputs.valorFrete * (COMISSAO_PCT / 100);
  const lucro = inputs.valorFrete - custoCombustivel - comissaoValor;

  return (
    <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-40">
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
              <span className="text-sm font-black text-white uppercase tracking-wider">Amostra de cálculo</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Simulação</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <NumberField label="Valor do frete" prefix="R$" value={inputs.valorFrete} onChange={set("valorFrete")} step={500} />
            <NumberField label="Distância" suffix="km" value={inputs.distancia} onChange={set("distancia")} step={50} />
            <NumberField label="Consumo médio" suffix="km/l" value={inputs.consumo} onChange={set("consumo")} step={0.1} />
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                Combustível + comissão estimados
              </span>
              <span className="font-mono font-bold text-red-300 text-sm">
                -R$ {fmtMoney(custoCombustivel + comissaoValor)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Lucro estimado</span>
              <span className={`font-mono font-black text-2xl ${lucro >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                R$ {fmtMoney(lucro)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-8 text-center">
            Amostra simplificada — a calculadora completa, com pedágios, comissão configurável e histórico, fica dentro da plataforma.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
