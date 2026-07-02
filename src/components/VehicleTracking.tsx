import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Gauge, Navigation, Satellite, Power, RefreshCw, Clock, Route } from "lucide-react";

interface LiveVehicle {
  vehicleId: string;
  plate: string;
  model: string;
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  heading: number;
  satellites: number;
  gpsTime: string;
}

interface SpeedStats {
  current: number;
  min: number;
  max: number;
  avg: number;
  distanceKm: number;
}

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="width:34px;height:34px;border-radius:9999px;background:linear-gradient(135deg,#3b82f6,#6d28d9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 12px rgba(0,0,0,0.4);border:2px solid white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

export default function VehicleTracking() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<SpeedStats>({ current: 0, min: 0, max: 0, avg: 0, distanceKm: 0 });
  const [period, setPeriod] = useState<24 | 168>(24);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const selectedVehicle = vehicles.find(v => v.vehicleId === selectedId) || vehicles[0];

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-15.7801, -47.9292],
      zoom: 5,
      zoomControl: false
    });
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Tile layer, theme-aware
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);
  }, [vehicles.length]);

  // Fetch live positions
  const fetchLive = async () => {
    try {
      const res = await fetch("/api/tracking/live");
      const data = await res.json();
      if (data.success) {
        setVehicles(data.vehicles);
        setErrorMsg("");
        setLastUpdate(new Date());
        if (!selectedId && data.vehicles.length > 0) {
          setSelectedId(data.vehicles[0].vehicleId);
        }
      } else {
        setErrorMsg(data.message || "Falha ao consultar rastreador.");
      }
    } catch {
      setErrorMsg("Erro ao conectar com o servidor de rastreamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch speed history for the selected vehicle
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/tracking/history/${selectedId}?hours=${period}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
          const map = mapRef.current;
          if (map && data.points?.length > 0) {
            if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
            const latlngs: [number, number][] = data.points.map((p: any) => [p.lat, p.lng]);
            routeLayerRef.current = L.polyline(latlngs, { color: "#3b82f6", weight: 3, opacity: 0.6 }).addTo(map);
          }
        }
      })
      .catch(() => {});
  }, [selectedId, period]);

  // Update markers + fly to vehicle on live data change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    vehicles.forEach(v => {
      const existing = markersRef.current[v.vehicleId];
      if (existing) {
        existing.setLatLng([v.lat, v.lng]);
      } else {
        const marker = L.marker([v.lat, v.lng], { icon: truckIcon })
          .addTo(map)
          .on("click", () => setSelectedId(v.vehicleId));
        markersRef.current[v.vehicleId] = marker;
      }
      markersRef.current[v.vehicleId].bindTooltip(`${v.plate} · ${v.speed} km/h`, { direction: "top", offset: [0, -18] });
    });

    if (selectedVehicle && vehicles.length > 0) {
      map.setView([selectedVehicle.lat, selectedVehicle.lng], map.getZoom() < 6 ? 13 : map.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  return (
    <div id="tracking-container" className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-black uppercase text-foreground tracking-wider flex items-center gap-2">
            <Satellite className="w-5.5 h-5.5 text-blue-500" />
            Rastreamento em Tempo Real
          </h2>
          <p className="text-xs text-muted-foreground">
            {selectedVehicle ? `${selectedVehicle.model} · Placa ${selectedVehicle.plate}` : "Aguardando dados do rastreador..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {vehicles.length > 1 && (
            <select
              value={selectedId || ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs font-bold rounded-lg border border-border bg-background px-3 py-2"
            >
              {vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>{v.plate} - {v.model}</option>
              ))}
            </select>
          )}
          <div className="flex bg-muted rounded-lg p-1 text-[11px] font-bold">
            <button onClick={() => setPeriod(24)} className={`px-3 py-1.5 rounded-md transition-colors ${period === 24 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>24h</button>
            <button onClick={() => setPeriod(168)} className={`px-3 py-1.5 rounded-md transition-colors ${period === 168 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>7 dias</button>
          </div>
          <button onClick={fetchLive} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Atualizar agora">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Speed Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Velocidade Atual</span>
            <p className="text-lg font-black font-mono">{selectedVehicle?.speed ?? stats.current} km/h</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Mínima ({period === 24 ? "24h" : "7d"})</span>
            <p className="text-lg font-black font-mono">{stats.min} km/h</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Km Percorrido ({period === 24 ? "24h" : "7d"})</span>
            <p className="text-lg font-black font-mono">{stats.distanceKm} km</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-red-600/10 text-red-600 dark:text-red-400 rounded-lg">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Máxima ({period === 24 ? "24h" : "7d"})</span>
            <p className="text-lg font-black font-mono">{stats.max} km/h</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-card border border-border rounded-xl p-2 shadow-sm">
        <div ref={containerRef} className="w-full h-[480px] rounded-lg overflow-hidden" />
      </div>

      {/* Status footer */}
      {selectedVehicle && (
        <div className="flex flex-wrap gap-4 text-[11px] font-mono text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <Power className={`w-3.5 h-3.5 ${selectedVehicle.ignition ? "text-emerald-500" : "text-red-500"}`} />
            Ignição {selectedVehicle.ignition ? "Ligada" : "Desligada"}
          </span>
          <span className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            {selectedVehicle.satellites} satélites
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            GPS: {selectedVehicle.gpsTime}
          </span>
          {lastUpdate && (
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizado às {lastUpdate.toLocaleTimeString("pt-BR")}
            </span>
          )}
        </div>
      )}

      {!loading && vehicles.length === 0 && !errorMsg && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum veículo rastreado encontrado.</p>
      )}
    </div>
  );
}
