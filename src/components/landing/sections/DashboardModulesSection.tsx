import { useEffect, useRef } from "react";
import L from "leaflet";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Coins, Users, Truck as TruckIcon, Wrench, Sparkles, Satellite, FileText } from "lucide-react";
import SectionReveal from "../SectionReveal";
import RadialGauge from "../../RadialGauge";
import CountUp from "../../CountUp";
import { gsap } from "../gsapSetup";
import { rastreamentoStops, combustivelStats, despesasBreakdown, motoristasPreview, freteExemplo } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:linear-gradient(135deg,#3b82f6,#6d28d9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(59,130,246,0.25),0 3px 8px rgba(0,0,0,0.4);border:2px solid white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_STYLE: Record<string, string> = {
  Pago: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
};

function MiniMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [rastreamentoStops[1].lat, rastreamentoStops[1].lng],
      zoom: 4,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });
    const isDark = document.documentElement.classList.contains("dark");
    L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      { attribution: "" }
    ).addTo(map);
    const latlngs: [number, number][] = rastreamentoStops.map((s) => [s.lat, s.lng]);
    L.polyline(latlngs, { color: "#3b82f6", weight: 2.5, opacity: 0.8 }).addTo(map);
    latlngs.forEach(([lat, lng]) => L.marker([lat, lng], { icon: truckIcon }).addTo(map));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden pointer-events-none" />;
}

export default function DashboardModulesSection({ reduced }: SectionProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !gridRef.current) return;
    const tiles = gridRef.current.querySelectorAll<HTMLElement>(".module-tile");
    const tween = gsap.fromTo(
      tiles,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 78%", toggleActions: "play none none none" },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-24 md:py-36">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2>Toda a sua empresa, organizada em um só lugar.</h2>
        <p className="mt-2 text-muted-foreground">Cada módulo do Fleet One cuida de uma parte da operação.</p>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="module-tile bg-card border border-border rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-blue-500" /> Financeiro
          </span>
          <p className="text-lg font-black font-mono mt-2">R$ {freteExemplo.valor.toLocaleString("pt-BR")}</p>
          <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_STYLE.Pago}`}>
            {freteExemplo.status}
          </span>
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500" /> Motoristas
          </span>
          <div className="flex gap-2 mt-3">
            {motoristasPreview.map((m) => (
              <div
                key={m.id}
                className="relative w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#0B3D5C] to-[#153F73] text-white font-black text-xs"
              >
                {initials(m.nome)}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-card ${m.ativo ? "bg-emerald-500" : "bg-muted-foreground"}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
            <TruckIcon className="w-3.5 h-3.5 text-blue-500" /> Frota
          </span>
          <p className="text-2xl font-black font-mono mt-2">
            <CountUp value={18} />
          </p>
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-4 flex items-center justify-center">
          <RadialGauge
            label="Km/L médio"
            value={(combustivelStats.avgKmL / 5) * 100}
            displayValue={`${combustivelStats.avgKmL.toFixed(1)} km/L`}
          />
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-500" /> Despesas
          </span>
          <div className="h-20 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={despesasBreakdown} dataKey="valor" nameKey="categoria" innerRadius={22} outerRadius={36} paddingAngle={2}>
                  {despesasBreakdown.map((d) => (
                    <Cell key={d.categoria} fill={d.cor} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> IA
          </span>
          <span className="inline-block mt-3 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 self-start">
            Ativo
          </span>
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-2 col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5 px-3 pt-2">
            <Satellite className="w-3.5 h-3.5 text-blue-500" /> Rastreamento
          </span>
          <div className="h-24 mt-1">
            <MiniMap />
          </div>
        </div>

        <div className="module-tile bg-card border border-border rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" /> Relatórios
          </span>
          <p className="text-2xl font-black font-mono mt-2">
            <CountUp value={24} />
          </p>
        </div>
      </div>
    </SectionReveal>
  );
}
