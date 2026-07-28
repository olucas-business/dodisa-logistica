import { motion } from "motion/react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Truck, TrendingUp, Fuel } from "lucide-react";
import CountUp from "../CountUp";

interface DashboardPreviewCardProps {
  reduced: boolean;
}

const MINI_TREND = [{ v: 30 }, { v: 45 }, { v: 38 }, { v: 52 }, { v: 60 }, { v: 55 }, { v: 68 }];

export default function DashboardPreviewCard({ reduced }: DashboardPreviewCardProps) {
  const tilt = reduced ? {} : { rotateY: -8, rotateX: 4 };

  return (
    <motion.div
      className="relative w-full max-w-sm mx-auto"
      style={{ transformStyle: "preserve-3d" }}
      initial={reduced ? false : { opacity: 0, y: 20, ...tilt }}
      animate={{ opacity: 1, y: 0, ...tilt }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { rotateY: -3, rotateX: 1, scale: 1.02 }}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        // Literal rgba (not the bg-slate-950 token, which this app's dark theme
        // inverts to near-white) so the glass card always reads as dark glass.
        className="backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5"
        style={{ backgroundColor: "rgba(2,6,23,0.7)" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-400" /> Fleet One
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ao vivo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Caminhões ativos</span>
            <p className="text-xl font-black font-mono text-white mt-1">
              <CountUp value={18} />
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Fuel className="w-3 h-3" /> Km/L médio
            </span>
            <p className="text-xl font-black font-mono text-white mt-1">2.9</p>
          </div>
        </div>

        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MINI_TREND}>
              <defs>
                <linearGradient id="heroCardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#60A5FA" strokeWidth={2} fill="url(#heroCardGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-[10px] font-bold text-slate-300">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Faturamento +12%
          </span>
          <span>Julho 2026</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
