import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Compass, Users, Fuel, Coins, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import BrandMark from "../../BrandMark";
import CountUp from "../../CountUp";

interface SectionProps {
  reduced: boolean;
}

const STATS = [
  { label: "Caminhões ativos", value: 18, decimals: 0, icon: Compass },
  { label: "Motoristas em rota", value: 12, decimals: 0, icon: Users },
  { label: "Km/L médio", value: 2.9, decimals: 1, icon: Fuel },
  { label: "Faturamento do mês", value: 128400, decimals: 0, icon: Coins, prefix: "R$ " },
];

const TREND = [
  { mes: "Fev", v: 30 },
  { mes: "Mar", v: 45 },
  { mes: "Abr", v: 38 },
  { mes: "Mai", v: 58 },
  { mes: "Jun", v: 66 },
  { mes: "Jul", v: 74 },
];

const ROTAS = [
  { placa: "RSD-4E12", trecho: "Uberlândia → Campinas", pct: 72 },
  { placa: "OPL-9A30", trecho: "Curitiba → Porto Alegre", pct: 34 },
  { placa: "QXV-1177", trecho: "Goiânia → Brasília", pct: 91 },
];

const ALERTAS = [
  { icon: CheckCircle2, tom: "text-emerald-400", texto: "Frete #4821 entregue no prazo" },
  { icon: AlertTriangle, tom: "text-amber-400", texto: "Manutenção do RSD-4E12 vence em 3 dias" },
  { icon: CheckCircle2, tom: "text-emerald-400", texto: "Abastecimento registrado — OPL-9A30" },
];

const VIEWS = ["Visão geral", "Rastreamento"] as const;

// A single, large, unhurried look at the real product. Cycles automatically
// between two views (visão geral / rastreamento) — a lightweight stand-in
// for a screen-recorded demo video, without needing a real video asset.
export default function ProductShowcaseSection({ reduced }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const [view, setView] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setView((v) => (v + 1) % VIEWS.length), 4500);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-40">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={reduced || isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <h2>A central de comando da sua operação.</h2>
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
          className="relative rounded-3xl border border-white/10 shadow-2xl p-6 md:p-10 overflow-hidden"
          style={{ backgroundColor: "rgba(2,6,23,0.96)" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-8">
            <span className="flex items-center gap-2.5">
              <BrandMark size="sm" />
              <span className="text-sm font-black text-white uppercase tracking-wider">Fleet One</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ao vivo
            </span>
          </div>

          <div className="min-h-[260px] md:min-h-[300px]">
            <AnimatePresence mode="wait">
              {view === 0 ? (
                <motion.div
                  key="overview"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {STATS.map(({ label, value, decimals, icon: Icon, prefix }) => (
                      <div key={label}>
                        <Icon className="w-4 h-4 text-blue-400 mb-2" />
                        <p className="text-xl md:text-2xl font-black font-mono text-white leading-none">
                          {prefix}
                          <CountUp value={value} decimals={decimals} />
                        </p>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mt-1.5">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="h-40 md:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={TREND}>
                        <defs>
                          <linearGradient id="showcaseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: "#0B0F19", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <Area type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2.5} fill="url(#showcaseGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="tracking"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-3 mb-6">
                    {ROTAS.map(({ placa, trecho, pct }) => (
                      <div key={placa}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="flex items-center gap-1.5 font-bold text-white">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" /> {placa}
                          </span>
                          <span className="text-slate-400">{trecho}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #60A5FA, #4ADE80)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 pt-4 space-y-2.5">
                    {ALERTAS.map(({ icon: Icon, tom, texto }) => (
                      <div key={texto} className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${tom}`} />
                        {texto}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 mt-8" aria-hidden="true">
            {VIEWS.map((label, i) => (
              <span
                key={label}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === view ? "w-6 bg-primary" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
