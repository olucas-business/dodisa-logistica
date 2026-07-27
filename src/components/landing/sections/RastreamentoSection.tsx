import { useEffect, useRef } from "react";
import L from "leaflet";
import { Satellite } from "lucide-react";
import SectionReveal from "../SectionReveal";
import { rastreamentoStops } from "../landing-mock-data";

interface SectionProps {
  reduced: boolean;
}

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:9999px;background:linear-gradient(135deg,#3b82f6,#6d28d9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 12px rgba(0,0,0,0.4);border:2px solid white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export default function RastreamentoSection({ reduced }: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [rastreamentoStops[0].lat - 4, rastreamentoStops[0].lng],
      zoom: 5,
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
    L.polyline(latlngs, { color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "6, 4" }).addTo(map);
    latlngs.forEach(([lat, lng], i) => {
      L.marker([lat, lng], { icon: truckIcon })
        .addTo(map)
        .bindTooltip(rastreamentoStops[i].label, { direction: "top", offset: [0, -16], permanent: false });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <SectionReveal reduced={reduced} className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="text-center max-w-lg mx-auto mb-10">
        <h2 className="flex items-center justify-center gap-2">
          <Satellite className="w-6 h-6 text-blue-500" />
          Você sabe onde estão seus caminhões.
        </h2>
        <p className="mt-2 text-muted-foreground">
          Rastreamento em tempo real de toda a frota, direto no painel.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-2 shadow-sm">
        <div ref={containerRef} className="w-full h-[280px] md:h-[360px] rounded-xl overflow-hidden pointer-events-none" />
      </div>
    </SectionReveal>
  );
}
