import { motion } from "motion/react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, TrendingUp, Fuel, Compass } from "lucide-react";
import BrandMark from "../BrandMark";
import CountUp from "../CountUp";

interface DashboardPreviewCardProps {
  reduced: boolean;
}

const MINI_TREND = [{ v: 30 }, { v: 45 }, { v: 38 }, { v: 52 }, { v: 60 }, { v: 55 }, { v: 68 }, { v: 74 }];

const STATS = [
  { label: "Caminhões ativos", value: 18, icon: Compass, decimals: 0 },
  { label: "Motoristas em rota", value: 12, icon: Users, decimals: 0 },
  { label: "Km/L médio", value: 2.9, icon: Fuel, decimals: 1 },
];

export default function DashboardPreviewCard({ reduced }: DashboardPreviewCardProps) {
  const tilt = reduced ? {} : { rotateY: -8, rotateX: 4 };

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      style={{ transformStyle: "preserve-3d" }}
      initial={reduced ? false : { opacity: 0, y: 20, ...tilt }}
      animate={{ opacity: 1, y: 0, ...tilt }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { rotateY: -3, rotateX: 1, scale: 1.02 }}
    >
      {/* Ambient glow behind the card for extra depth/premium lift */}
      <div
        className="absolute -inset-6 rounded-[2rem] pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(96,165,250,0.25), transparent)" }}
      />

      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        // Literal rgba (not the bg-slate-950 token, which this app's dark theme
        // inverts to near-white) so the glass card always reads as dark glass.
        className="relative backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 md:p-7"
        style={{ backgroundColor: "rgba(2,6,23,0.72)" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <span className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="text-sm font-black text-white uppercase tracking-wider">Fleet One</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ao vivo
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {STATS.map(({ label, value, icon: Icon, decimals }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <Icon className="w-3.5 h-3.5 text-blue-400 mb-1.5" />
              <p className="text-lg font-black font-mono text-white leading-none">
                <CountUp value={value} decimals={decimals} />
              </p>
              <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold leading-tight block mt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MINI_TREND}>
              <defs>
                <linearGradient id="heroCardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2.5} fill="url(#heroCardGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Faturamento +12% este mês
          </span>
          <span className="text-slate-500">Julho 2026</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
