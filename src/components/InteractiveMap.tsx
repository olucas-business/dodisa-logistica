import { useState, useMemo, useEffect, useRef } from "react";
import { line, curveCardinal } from "d3";
import { motion, AnimatePresence } from "motion/react";
import { Freight, Driver, Vehicle } from "../types";
import LeafletMapComponent from "./LeafletMapComponent";
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Compass, 
  Search, 
  Filter, 
  TrendingUp, 
  Package, 
  Coins, 
  Globe,
  Radio,
  Clock,
  Gauge,
  CloudSun,
  Map,
  X,
  Users
} from "lucide-react";

interface InteractiveMapProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

interface CityCoords {
  [key: string]: { x: number; y: number; name: string; state: string };
}

// Google Maps API key exposure from AI Studio secrets
const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== "YOUR_API_KEY";

// Real-world coordinates (latitude & longitude) for Brazilian transport hubs
const HUB_COORDINATES_LAT_LNG: Record<string, { lat: number; lng: number; name: string; state: string }> = {
  "RECIFE": { lat: -8.0578, lng: -34.8829, name: "Recife", state: "PE" },
  "MACEIÓ": { lat: -9.6658, lng: -35.7350, name: "Maceió", state: "AL" },
  "JOÃO PESSOA": { lat: -7.1150, lng: -34.8631, name: "João Pessoa", state: "PB" },
  "SÃO PAULO": { lat: -23.5505, lng: -46.6333, name: "São Paulo", state: "SP" },
  "CAMPINAS": { lat: -22.9056, lng: -47.0608, name: "Campinas", state: "SP" },
  "RIO DE JANEIRO": { lat: -22.9068, lng: -43.1729, name: "Rio de Janeiro", state: "RJ" },
  "NITERÓI": { lat: -22.8858, lng: -43.1153, name: "Niterói", state: "RJ" },
  "PETRÓPOLIS": { lat: -22.5049, lng: -43.1803, name: "Petrópolis", state: "RJ" },
  "DUQUE DE CAXIAS": { lat: -22.7856, lng: -43.3117, name: "Duque de Caxias", state: "RJ" },
  "BELO HORIZONTE": { lat: -19.9191, lng: -43.9378, name: "Belo Horizonte", state: "MG" },
  "BRASÍLIA": { lat: -15.7801, lng: -47.9292, name: "Brasília", state: "DF" },
  "SALVADOR": { lat: -12.9777, lng: -38.5016, name: "Salvador", state: "BA" },
  "PORTO ALEGRE": { lat: -30.0346, lng: -51.2177, name: "Porto Alegre", state: "RS" },
  "FORTALEZA": { lat: -3.7319, lng: -38.5267, name: "Fortaleza", state: "CE" }
};

const interpolateLatLng = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number
) => {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t
  };
};

const getCityLatLng = (cityName: string) => {
  const key = cityName.toUpperCase().trim();
  if (HUB_COORDINATES_LAT_LNG[key]) return HUB_COORDINATES_LAT_LNG[key];
  for (const hubKey of Object.keys(HUB_COORDINATES_LAT_LNG)) {
    if (key.includes(hubKey) || hubKey.includes(key)) {
      return HUB_COORDINATES_LAT_LNG[hubKey];
    }
  }
  if (key.includes("RJ")) return { ...HUB_COORDINATES_LAT_LNG["RIO DE JANEIRO"], name: cityName };
  if (key.includes("SP")) return { ...HUB_COORDINATES_LAT_LNG["SÃO PAULO"], name: cityName };
  if (key.includes("MG")) return { ...HUB_COORDINATES_LAT_LNG["BELO HORIZONTE"], name: cityName };
  if (key.includes("PE")) return { ...HUB_COORDINATES_LAT_LNG["RECIFE"], name: cityName };
  if (key.includes("AL")) return { ...HUB_COORDINATES_LAT_LNG["MACEIÓ"], name: cityName };
  if (key.includes("PB")) return { ...HUB_COORDINATES_LAT_LNG["JOÃO PESSOA"], name: cityName };
  if (key.includes("CE")) return { ...HUB_COORDINATES_LAT_LNG["FORTALEZA"], name: cityName };
  if (key.includes("BA")) return { ...HUB_COORDINATES_LAT_LNG["SALVADOR"], name: cityName };
  if (key.includes("RS")) return { ...HUB_COORDINATES_LAT_LNG["PORTO ALEGRE"], name: cityName };
  
  return { lat: -15.7801, lng: -47.9292, name: cityName, state: "" };
};

const getGoogleMapTypeId = (mode: "VETOR" | "SATÉLITE" | "TOPOGRÁFICO") => {
  switch (mode) {
    case "VETOR":
      return "roadmap";
    case "SATÉLITE":
      return "hybrid";
    case "TOPOGRÁFICO":
      return "terrain";
    default:
      return "roadmap";
  }
};

// Custom Polyline Component for Google Maps
interface CustomPolylineProps {
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  visible?: boolean;
}

function CustomPolyline({ path, strokeColor = "#3b82f6", strokeOpacity = 0.8, strokeWeight = 3, visible = true }: CustomPolylineProps) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      visible,
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, path, strokeColor, strokeOpacity, strokeWeight, visible]);

  return null;
}

// Premium dark mode theme styles for Google Maps
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#06201c" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#10b981" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e3a8a" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e40af" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }]
  }
];

// Coordinate mapping for major Brazilian transport hubs inside a 500x500 box
const HUB_COORDINATES: CityCoords = {
  "RECIFE": { x: 420, y: 150, name: "Recife", state: "PE" },
  "MACEIÓ": { x: 410, y: 175, name: "Maceió", state: "AL" },
  "JOÃO PESSOA": { x: 430, y: 135, name: "João Pessoa", state: "PB" },
  "SÃO PAULO": { x: 280, y: 380, name: "São Paulo", state: "SP" },
  "CAMPINAS": { x: 260, y: 365, name: "Campinas", state: "SP" },
  "RIO DE JANEIRO": { x: 320, y: 360, name: "Rio de Janeiro", state: "RJ" },
  "NITERÓI": { x: 330, y: 355, name: "Niterói", state: "RJ" },
  "PETRÓPOLIS": { x: 325, y: 345, name: "Petrópolis", state: "RJ" },
  "DUQUE DE CAXIAS": { x: 315, y: 350, name: "Duque de Caxias", state: "RJ" },
  "BELO HORIZONTE": { x: 300, y: 310, name: "Belo Horizonte", state: "MG" },
  "BRASÍLIA": { x: 250, y: 240, name: "Brasília", state: "DF" },
  "SALVADOR": { x: 380, y: 210, name: "Salvador", state: "BA" },
  "PORTO ALEGRE": { x: 190, y: 460, name: "Porto Alegre", state: "RS" },
  "FORTALEZA": { x: 380, y: 90, name: "Fortaleza", state: "CE" }
};

export default function InteractiveMap({ freights, drivers, vehicles }: InteractiveMapProps) {
  const [selectedFreight, setSelectedFreight] = useState<Freight | null>(null);
  const [hoveredFreightId, setHoveredFreightId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<"Todos" | "Trânsito" | "Parado" | "Alerta">("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [telemetrySim, setTelemetrySim] = useState<boolean>(true);
  const [mapMode, setMapMode] = useState<"VETOR" | "SATÉLITE" | "TOPOGRÁFICO">("VETOR");
  const [showHighways, setShowHighways] = useState<boolean>(true);
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [showRadars, setShowRadars] = useState<boolean>(true);
  const [useGoogleMaps, setUseGoogleMaps] = useState<boolean>(hasValidKey);

  // Animated crawl progress state
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();
    
    const updateProgress = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 30000; // 30 seconds for a full loop
      lastTime = now;
      setProgressTick(prev => (prev + delta) % 1);
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Helper to calculate point on a quadratic Bezier curve
  const getBezierPoint = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  };

  const getControlPoint = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    // Calculate orthogonal offset for curve depth
    const offsetX = -(dy / len) * (len * 0.16);
    const offsetY = (dx / len) * (len * 0.16);
    return {
      x: midX + offsetX,
      y: midY + offsetY - 18
    };
  };

  const getVehicleStatus = (vehicle: Vehicle | undefined, freight: Freight | undefined): "Trânsito" | "Parado" | "Alerta" => {
    if (!vehicle) return "Parado";
    
    // Check if next maintenance is within 2000km, or licensing is near/expired (e.g. June 2026)
    const isNearMaintenance = vehicle.nextMaintenance > 0 && (vehicle.nextMaintenance - vehicle.currentMileage <= 2000);
    const isLicensingNear = vehicle.plate === "XYZ-5678" || vehicle.plate === "LMN-3344" || vehicle.licensingExpiration?.startsWith("2026-06");
    
    if (isNearMaintenance || isLicensingNear) {
      return "Alerta";
    }
    
    if (freight && freight.status === "Em andamento") {
      return "Trânsito";
    }
    
    return "Parado";
  };

  const getFreightProgress = (freightId: string) => {
    let hash = 0;
    for (let i = 0; i < freightId.length; i++) {
      hash = freightId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const offset = Math.abs(hash % 100) / 100;
    return (progressTick + offset) % 1;
  };

  const getStopPointsForFreight = (freight: Freight, start: { x: number; y: number }, end: { x: number; y: number }, control: { x: number; y: number }, currentProgress: number) => {
    return [
      {
        id: `${freight.id}-stop-1`,
        name: `Posto Graal ${freight.origin.city}`,
        type: "Posto de Combustível",
        t: 0.3,
        coords: getBezierPoint(start, control, end, 0.3),
        status: freight.status === "Finalizado" ? "Concluído" : (freight.status === "Em andamento" && currentProgress > 0.3) ? "Concluído" : "Pendente",
        forecast: "03h após partida",
        description: "Ponto de abastecimento e checagem de pneus."
      },
      {
        id: `${freight.id}-stop-2`,
        name: `Posto Fiscal ${freight.destination.city}`,
        type: "Posto Fiscal & Descanso",
        t: 0.7,
        coords: getBezierPoint(start, control, end, 0.7),
        status: freight.status === "Finalizado" ? "Concluído" : (freight.status === "Em andamento" && currentProgress > 0.7) ? "Concluído" : (freight.status === "Em andamento" && currentProgress > 0.3 && currentProgress <= 0.7) ? "Em andamento" : "Pendente",
        forecast: "07h após partida",
        description: "Ponto de descanso obrigatório do motorista e fiscalização de nota fiscal."
      }
    ];
  };

  const getD3CurvePath = (start: { x: number; y: number }, end: { x: number; y: number }, control: { x: number; y: number }) => {
    const points: [number, number][] = [
      [start.x, start.y],
      [control.x, control.y],
      [end.x, end.y]
    ];
    const pathGenerator = line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(curveCardinal.tension(0.15));
    return pathGenerator(points) || "";
  };

  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    type: "driver" | "stop" | "hub";
    x: number;
    y: number;
    title: string;
    subtitle: string;
    details: { label: string; value: string; colorClass?: string }[];
    footer?: string;
  } | null>(null);

  // Helper to normalize city names for coordinate matching
  const getCityCoords = (cityName: string) => {
    const key = cityName.toUpperCase().trim();
    if (HUB_COORDINATES[key]) return HUB_COORDINATES[key];
    
    // Fuzzy matching for states/suburbs
    for (const hubKey of Object.keys(HUB_COORDINATES)) {
      if (key.includes(hubKey) || hubKey.includes(key)) {
        return HUB_COORDINATES[hubKey];
      }
    }
    
    // Default fallback to central hubs depending on state
    if (key.includes("RJ")) return { ...HUB_COORDINATES["RIO DE JANEIRO"], name: cityName };
    if (key.includes("SP")) return { ...HUB_COORDINATES["SÃO PAULO"], name: cityName };
    if (key.includes("MG")) return { ...HUB_COORDINATES["BELO HORIZONTE"], name: cityName };
    if (key.includes("PE")) return { ...HUB_COORDINATES["RECIFE"], name: cityName };
    if (key.includes("AL")) return { ...HUB_COORDINATES["MACEIÓ"], name: cityName };
    if (key.includes("PB")) return { ...HUB_COORDINATES["JOÃO PESSOA"], name: cityName };
    if (key.includes("CE")) return { ...HUB_COORDINATES["FORTALEZA"], name: cityName };
    if (key.includes("BA")) return { ...HUB_COORDINATES["SALVADOR"], name: cityName };
    if (key.includes("RS")) return { ...HUB_COORDINATES["PORTO ALEGRE"], name: cityName };
    
    // Default safe coordinates in the middle of Brazil
    return { x: 270, y: 300, name: cityName, state: "" };
  };

  // Filter freights based on Search, Status & Hub Node Selection
  const filteredFreights = useMemo(() => {
    return freights.filter((freight) => {
      // 1. Status Filter
      if (statusFilter !== "Todos" && freight.status !== statusFilter) {
        return false;
      }

      // 2. Selected Hub Node Filter
      if (selectedHub) {
        const originKey = freight.origin.city.toUpperCase().trim();
        const destKey = freight.destination.city.toUpperCase().trim();
        const hubKey = selectedHub.toUpperCase().trim();
        if (!originKey.includes(hubKey) && !destKey.includes(hubKey) && !hubKey.includes(originKey) && !hubKey.includes(destKey)) {
          return false;
        }
      }

      // 3. Vehicle Status Filter
      if (vehicleStatusFilter !== "Todos") {
        const vehicle = vehicles.find((v) => v.id === freight.vehicleId);
        const vStatus = getVehicleStatus(vehicle, freight);
        if (vStatus !== vehicleStatusFilter) {
          return false;
        }
      }

      // 4. Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const fNumber = freight.freightNumber.toLowerCase();
        const originCompany = freight.origin.company.toLowerCase();
        const originCity = freight.origin.city.toLowerCase();
        const destCompany = freight.destination.company.toLowerCase();
        const destCity = freight.destination.city.toLowerCase();
        const cargoType = freight.cargo.type.toLowerCase();

        const driver = drivers.find((d) => d.id === freight.driverId);
        const driverName = driver ? driver.fullName.toLowerCase() : "";
        const vehicle = vehicles.find((v) => v.id === freight.vehicleId);
        const vehiclePlate = vehicle ? vehicle.plate.toLowerCase() : "";

        return (
          fNumber.includes(query) ||
          originCompany.includes(query) ||
          originCity.includes(query) ||
          destCompany.includes(query) ||
          destCity.includes(query) ||
          cargoType.includes(query) ||
          driverName.includes(query) ||
          vehiclePlate.includes(query)
        );
      }

      return true;
    });
  }, [freights, statusFilter, vehicleStatusFilter, selectedHub, searchQuery, drivers, vehicles]);

  // Map operational KPIs
  const mapStats = useMemo(() => {
    const active = freights.filter((f) => f.status === "Em andamento");
    const finished = freights.filter((f) => f.status === "Finalizado");
    
    const activeValue = active.reduce((sum, f) => sum + f.financial.value, 0);
    const activeWeight = active.reduce((sum, f) => {
      if (f.cargo.unit === "Toneladas") return sum + f.cargo.qty;
      if (f.cargo.unit === "Quilos") return sum + (f.cargo.qty / 1000);
      return sum + (f.cargo.qty * 0.05); // Estimate standard cargo weight in tons
    }, 0);

    const activeKm = active.reduce((sum, f) => sum + f.mileage.total, 0);

    return {
      activeCount: active.length,
      finishedCount: finished.length,
      activeValue,
      activeWeight,
      activeKm
    };
  }, [freights]);

  // Find Driver and Vehicle names for display
  const getFreightDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.fullName || "Motorista não escalado";
  };

  const getFreightVehiclePlate = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId)?.plate || "Sem veículo";
  };

  return (
    <div id="mapa-logistico-container" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
      {/* Title Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Painel do Mapa de Escoamento Multimodal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreamento e escoamento de frotas, fluxos interestaduais e indicadores de trânsito em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {selectedHub && (
            <button
              onClick={() => setSelectedHub(null)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hub: {selectedHub}</span>
            </button>
          )}

          {/* Freight Status Filters */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider hidden sm:inline">Fluxos:</span>
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
              {["Todos", "Em andamento", "Finalizado", "Pendente"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === status 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {status === "Todos" ? "Todos" : status === "Em andamento" ? "Em trânsito" : status}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Status Filters */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider hidden sm:inline">Veículos:</span>
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
              {([
                { key: "Todos", label: "Todos", dotColor: "bg-blue-500" },
                { key: "Trânsito", label: "Em Trânsito", dotColor: "bg-emerald-500" },
                { key: "Parado", label: "Parados", dotColor: "bg-amber-500" },
                { key: "Alerta", label: "Alertas", dotColor: "bg-rose-500" }
              ] as const).map(({ key, label, dotColor }) => (
                <button
                  key={key}
                  onClick={() => setVehicleStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    vehicleStatusFilter === key 
                      ? key === "Trânsito" 
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50 shadow-sm" 
                        : key === "Parado" 
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50 shadow-sm"
                          : key === "Alerta"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-900/50 shadow-sm animate-pulse"
                            : "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map KPIs Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Viagens Ativas</p>
            <p className="text-xl font-black font-mono text-emerald-400 mt-0.5">
              {mapStats.activeCount}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Carga sob Rodas</p>
            <p className="text-xl font-black font-mono text-white mt-0.5">
              R$ {mapStats.activeValue.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volume em Trânsito</p>
            <p className="text-xl font-black font-mono text-white mt-0.5">
              {mapStats.activeWeight.toFixed(1)} Ton
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distância em Trânsito</p>
            <p className="text-xl font-black font-mono text-white mt-0.5">
              {mapStats.activeKm.toLocaleString("pt-BR")} KM
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Map Section */}
        <div id="map-canvas-container" className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-2xl flex flex-col p-4 min-h-[480px] overflow-hidden group/map transition-all duration-300">
          
          {/* Latitude & Longitude Coordinate Frame lines */}
          <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-600 select-none">Lat: 5.16° N / Lon: 73.98° W</div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-600 select-none">Lat: 33.75° S / Lon: 34.79° W</div>

          {/* Real-time Satellite telemetry HUD overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 select-none">
            <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-2 text-[9px] font-mono">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">SATÉLITE LOCK: <strong className="text-emerald-400">CONECTADO</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">LAT: <strong className="text-slate-200">14.23° S</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">LON: <strong className="text-slate-200">51.92° W</strong></span>
            </div>
            
            {/* View Layer Selector Controls */}
            <div className="flex gap-1.5 pointer-events-auto items-center">
              <button
                onClick={() => setUseGoogleMaps(!useGoogleMaps)}
                className={`px-2 py-1 rounded-lg border text-[8px] font-extrabold tracking-wider transition-all flex items-center gap-1.5 shadow-lg cursor-pointer ${
                  useGoogleMaps
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                    : "border-slate-800 text-slate-400 bg-slate-950/90 backdrop-blur-md hover:text-slate-200"
                }`}
              >
                <Globe className="w-3 h-3" />
                {useGoogleMaps ? "GOOGLE MAPS: ATIVO" : "ATIVAR GOOGLE MAPS"}
              </button>

              <div className="bg-slate-950/90 backdrop-blur-md p-0.5 rounded-lg border border-slate-800/80 flex gap-0.5 shadow-lg">
                {(["VETOR", "SATÉLITE", "TOPOGRÁFICO"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMapMode(mode)}
                    className={`px-2 py-1 rounded text-[8px] font-extrabold tracking-wider transition-all cursor-pointer ${
                      mapMode === mode
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Layer visibility toggle panel (bottom-left overlay) */}
          <div className="absolute bottom-3 left-3 flex gap-1 pointer-events-auto z-20 select-none">
            <button
              onClick={() => setShowHighways(!showHighways)}
              className={`px-2 py-1 rounded bg-slate-950/90 backdrop-blur border text-[8px] font-mono transition-all flex items-center gap-1.5 shadow-md ${
                showHighways 
                  ? "border-blue-500/50 text-blue-400 bg-blue-500/5" 
                  : "border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${showHighways ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
              Rodovias
            </button>
            <button
              onClick={() => setShowBorders(!showBorders)}
              className={`px-2 py-1 rounded bg-slate-950/90 backdrop-blur border text-[8px] font-mono transition-all flex items-center gap-1.5 shadow-md ${
                showBorders 
                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/5" 
                  : "border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${showBorders ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              Fronteiras
            </button>
            <button
              onClick={() => setShowRadars(!showRadars)}
              className={`px-2 py-1 rounded bg-slate-950/90 backdrop-blur border text-[8px] font-mono transition-all flex items-center gap-1.5 shadow-md ${
                showRadars 
                  ? "border-purple-500/50 text-purple-400 bg-purple-500/5" 
                  : "border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${showRadars ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`} />
              Radares
            </button>
          </div>

          {/* Compass rose decorative overlay */}
          <div className="absolute top-10 right-6 opacity-[0.03] pointer-events-none text-blue-500">
            <Compass className="w-32 h-32 animate-spin-slow" />
          </div>

          {/* Map Grid dots overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
          
          {/* Main Map Canvas SVG or Real Google Maps */}
          {useGoogleMaps ? (
            !hasValidKey ? (
              <div className="w-full h-[400px] sm:h-[480px] lg:h-[520px] relative z-10 select-none flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/80 backdrop-blur-md">
                <div className="w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 animate-pulse">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Chave de API do Google Maps Necessária</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5 max-w-xs">
                  Para carregar o Google Maps real de alta precisão com ruas, rodovias brasileiras, relevo e satélite, configure a sua chave nas configurações do AI Studio.
                </p>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-left mt-3 space-y-1.5 text-[9px] text-slate-300 font-sans w-full">
                  <p><strong>1. Obter Chave:</strong> Acesse o <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Google Maps Console</a>.</p>
                  <p><strong>2. Menu do AI Studio:</strong> Clique no ícone de engrenagem ⚙️ (canto superior direito).</p>
                  <p><strong>3. Salvar:</strong> Vá em <strong>Secrets</strong>, digite <code>GOOGLE_MAPS_PLATFORM_KEY</code> e cole a chave.</p>
                </div>
                
                <button
                  onClick={() => setUseGoogleMaps(false)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-200 transition-all cursor-pointer"
                >
                  Voltar para o Mapa Vetorial
                </button>
              </div>
            ) : (
              <div className="w-full h-[400px] sm:h-[480px] lg:h-[520px] relative z-10 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
                  <GoogleMap
                    defaultCenter={{ lat: -15.7801, lng: -47.9292 }}
                    defaultZoom={4.2}
                    mapId="DEMO_MAP_ID"
                    mapTypeId={getGoogleMapTypeId(mapMode)}
                    options={{
                      styles: document.documentElement.classList.contains("dark") ? DARK_MAP_STYLE : [],
                      disableDefaultUI: false,
                      zoomControl: true,
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: false,
                    }}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Render Hub Markers */}
                    {Object.entries(HUB_COORDINATES_LAT_LNG).map(([key, hub]) => {
                      const hubFreights = freights.filter(f => 
                        f.origin.city.toUpperCase().trim() === key || f.destination.city.toUpperCase().trim() === key
                      );
                      const isActiveHub = hubFreights.length > 0;
                      const hasEnRouteFreight = hubFreights.some(f => f.status === "Em andamento");
                      const isSelectedHub = selectedHub === hub.name;

                      return (
                        <AdvancedMarker
                          key={`g-hub-${key}`}
                          position={{ lat: hub.lat, lng: hub.lng }}
                          onClick={() => {
                            setSelectedHub(isSelectedHub ? null : hub.name);
                            setSelectedFreight(null);
                          }}
                        >
                          <div className="relative flex items-center justify-center cursor-pointer group/node" style={{ transform: "translate(0%, 0%)" }}>
                            {hasEnRouteFreight && (
                              <div className="absolute w-6 h-6 rounded-full border border-emerald-500/50 animate-ping opacity-60 pointer-events-none" />
                            )}
                            <div className={`w-3 h-3 rounded-full border border-white flex items-center justify-center transition-all ${
                              isSelectedHub ? "bg-amber-500 scale-125" : isActiveHub ? "bg-blue-500" : "bg-slate-600"
                            }`}>
                              <div className="w-1 h-1 bg-white rounded-full" />
                            </div>
                            <span className="absolute top-4 bg-slate-950/90 border border-slate-800 text-[8px] font-mono font-bold text-slate-300 px-1 py-0.5 rounded shadow whitespace-nowrap opacity-90">
                              {hub.name}
                            </span>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                    {/* Render active freight route polylines and vehicle status trucks */}
                    {filteredFreights.map((freight) => {
                      const start = getCityLatLng(freight.origin.city);
                      const end = getCityLatLng(freight.destination.city);
                      const isSelected = selectedFreight?.id === freight.id;
                      const isHovered = hoveredFreightId === freight.id;
                      const isEnRoute = freight.status === "Em andamento";
                      const isConcluded = freight.status === "Finalizado";
                      const isPending = freight.status === "Pendente";

                      let routeColor = "#3b82f6";
                      if (isSelected || isHovered) {
                        routeColor = "#f59e0b";
                      } else if (isEnRoute) {
                        routeColor = "#10b981";
                      } else if (isConcluded) {
                        routeColor = "#3b82f6";
                      } else if (isPending) {
                        routeColor = "#64748b";
                      }

                      const currentProgress = getFreightProgress(freight.id);
                      
                      let vehiclePos = interpolateLatLng(start, end, currentProgress);
                      if (freight.status === "Pendente") {
                        vehiclePos = start;
                      } else if (freight.status === "Finalizado") {
                        vehiclePos = end;
                      }

                      const currentDriver = drivers.find(d => d.id === freight.driverId);
                      const currentVehicle = vehicles.find(v => v.id === freight.vehicleId);
                      const vehicleStatus = getVehicleStatus(currentVehicle, freight);

                      const path = [start, end];

                      return (
                        <div key={`g-route-group-${freight.id}`}>
                          {/* Real Polyline */}
                          <CustomPolyline
                            path={path}
                            strokeColor={routeColor}
                            strokeWeight={isSelected || isHovered ? 4 : 2}
                            strokeOpacity={isSelected || isHovered || isEnRoute ? 0.9 : 0.4}
                          />

                          {/* Stop Points */}
                          {(isSelected || isHovered || isEnRoute) && [
                            { id: 'stop-1', t: 0.3, name: `Posto Graal ${freight.origin.city}` },
                            { id: 'stop-2', t: 0.7, name: `Posto Fiscal ${freight.destination.city}` }
                          ].map((stop, sIdx) => {
                            const stopPos = interpolateLatLng(start, end, stop.t);
                            return (
                              <AdvancedMarker
                                key={`g-stop-${freight.id}-${sIdx}`}
                                position={stopPos}
                              >
                                <div className="w-2 h-2 rounded-full bg-slate-950 border border-white flex items-center justify-center shadow" style={{ transform: "translate(0%, 0%)" }}>
                                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                                </div>
                              </AdvancedMarker>
                            );
                          })}

                          {/* Vehicle Badge */}
                          {(isEnRoute || isSelected || isHovered) && (
                            <AdvancedMarker
                              position={vehiclePos}
                              onClick={() => setSelectedFreight(freight)}
                            >
                              <div 
                                className="relative flex items-center justify-center cursor-pointer" 
                                style={{ transform: "translate(0%, 0%)" }}
                              >
                                <div className={`absolute w-5 h-5 rounded-full border animate-ping opacity-60 pointer-events-none ${
                                  vehicleStatus === "Trânsito" ? "border-emerald-500" : vehicleStatus === "Alerta" ? "border-rose-500" : "border-amber-500"
                                }`} />
                                <div className={`w-4 h-4 rounded-full border border-white flex items-center justify-center shadow-md ${
                                  vehicleStatus === "Trânsito" ? "bg-emerald-500" : vehicleStatus === "Alerta" ? "bg-rose-500" : "bg-amber-500"
                                }`}>
                                  <Truck className="w-2.5 h-2.5 text-white" />
                                </div>
                              </div>
                            </AdvancedMarker>
                          )}
                        </div>
                      );
                    })}
                  </GoogleMap>
                </APIProvider>
              </div>
            )
          ) : (
            <div className="w-full h-[400px] sm:h-[480px] lg:h-[520px] relative z-10 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
              <LeafletMapComponent
                freights={freights}
                drivers={drivers}
                vehicles={vehicles}
                selectedFreight={selectedFreight}
                setSelectedFreight={setSelectedFreight}
                hoveredFreightId={hoveredFreightId}
                setHoveredFreightId={setHoveredFreightId}
                statusFilter={statusFilter}
                vehicleStatusFilter={vehicleStatusFilter}
                searchQuery={searchQuery}
                mapMode={mapMode}
                showHighways={showHighways}
                showBorders={showBorders}
                showRadars={showRadars}
                progressTick={progressTick}
                selectedHub={selectedHub}
                setSelectedHub={setSelectedHub}
              />
            </div>
          )}

          {false && (
            <svg viewBox="0 0 500 500" className="w-full max-w-[440px] aspect-square relative z-10 select-none">
            
            {/* Definitions for Glow Filters */}
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-strong" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Gradients for terrain styling */}
              <linearGradient id="satellite-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#091b24" />
                <stop offset="60%" stopColor="#0b3121" />
                <stop offset="100%" stopColor="#022030" />
              </linearGradient>
              <linearGradient id="topographic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#111827" />
                <stop offset="50%" stopColor="#1f2937" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
            </defs>

            {/* Ocean Bathymetry Depth Lines */}
            {mapMode !== "VETOR" && (
              <g className="opacity-20 pointer-events-none">
                <path d="M 330,30 L 360,50 L 410,100 L 470,160 L 485,220 L 470,300 L 420,380 L 380,450" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="4 8" />
                <path d="M 350,20 L 390,45 L 440,110 L 495,195 L 500,270 L 450,360 L 410,440" fill="none" stroke="#2563eb" strokeWidth="0.8" strokeDasharray="2 12" />
                <text x="410" y="300" transform="rotate(38 410 300)" className="text-[6px] font-mono fill-blue-500/40 tracking-widest font-extrabold uppercase">Oceano Atlântico</text>
              </g>
            )}

            {/* Radar coverage ranges */}
            {showRadars && (
              <g className="pointer-events-none">
                {/* São Paulo Coverage */}
                <circle cx="280" cy="380" r="50" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 8" className="opacity-25" />
                <circle cx="280" cy="380" r="90" fill="none" stroke="#3b82f6" strokeWidth="0.4" strokeDasharray="1 15" className="opacity-15 animate-pulse" />
                
                {/* Brasília Coverage */}
                <circle cx="250" cy="240" r="60" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 8" className="opacity-25" />
                
                {/* Recife Coverage */}
                <circle cx="420" cy="150" r="45" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 8" className="opacity-20" />
              </g>
            )}

            {/* Realistic stylized geographic outline of Brazil */}
            <path
              d="M 170,65 L 220,55 L 255,45 L 290,52 L 315,68 L 335,62 L 370,82 L 380,90 L 410,105 L 435,112 L 452,130 L 460,150 L 440,205 L 425,225 L 395,245 L 380,270 L 350,300 L 335,335 L 325,355 L 295,390 L 280,410 L 260,425 L 230,445 L 195,475 L 180,470 L 190,445 L 175,415 L 155,385 L 130,370 L 105,340 L 75,310 L 55,275 L 45,230 L 52,190 L 75,155 L 100,140 L 135,115 L 155,95 Z"
              fill={
                mapMode === "SATÉLITE" 
                  ? "url(#satellite-gradient)" 
                  : mapMode === "TOPOGRÁFICO" 
                    ? "url(#topographic-gradient)" 
                    : "#111827"
              }
              fillOpacity={mapMode === "SATÉLITE" ? "0.95" : "0.5"}
              stroke={mapMode === "SATÉLITE" ? "#0f766e" : "#1e293b"}
              strokeWidth="2.5"
              className="transition-all duration-500"
            />

            {/* Thin highlighted boundary path */}
            <path
              d="M 170,65 L 220,55 L 255,45 L 290,52 L 315,68 L 335,62 L 370,82 L 380,90 L 410,105 L 435,112 L 452,130 L 460,150 L 440,205 L 425,225 L 395,245 L 380,270 L 350,300 L 335,335 L 325,355 L 295,390 L 280,410 L 260,425 L 230,445 L 195,475"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.2"
              className="opacity-40"
            />

            {/* Internal Regional / State Borders */}
            {showBorders && (
              <g className="opacity-25 pointer-events-none transition-all duration-300">
                {/* RS/SC boundary */}
                <line x1="170" y1="440" x2="215" y2="440" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* SP/PR/SC division */}
                <path d="M 230,410 L 250,420 L 265,395" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* SP/MG border */}
                <path d="M 260,370 L 275,360 L 295,370" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* MG/RJ/ES borders */}
                <path d="M 305,350 L 320,340 L 335,348" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* BA/MG border */}
                <path d="M 280,290 L 330,290 L 350,275" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* BA/GO/DF/TO border */}
                <path d="M 240,220 L 275,210 L 310,230 L 340,215" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* PE/BA/AL/SE border lines */}
                <path d="M 360,170 L 385,170 L 405,160" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                <path d="M 370,145 L 400,145 L 425,145" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" />
                {/* DF district borders */}
                <rect x="246" y="236" width="8" height="8" fill="none" stroke="#10b981" strokeWidth="0.8" strokeDasharray="1 2" className="opacity-75" />
              </g>
            )}

            {/* Major Federal Logistical Corridors (Highway corridors) */}
            {showHighways && (
              <g className="opacity-35 pointer-events-none transition-all duration-300">
                {/* BR-116 Spine */}
                <path
                  d="M 190,460 Q 240,430 280,380 T 320,360 T 300,310 T 380,210 T 420,150 T 380,90"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.2"
                  strokeDasharray="4 6"
                />
                <text x="210" y="415" transform="rotate(-30 210 415)" className="text-[5px] font-mono fill-blue-400 font-bold opacity-60">BR-116</text>
                
                {/* BR-101 Coastal Corridor */}
                <path
                  d="M 190,460 Q 230,420 280,380 T 320,360 T 380,210 T 410,175 T 420,150 T 430,135 T 380,90"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="0.9"
                  strokeDasharray="2 4"
                />
                <text x="360" y="245" transform="rotate(45 360 245)" className="text-[5px] font-mono fill-sky-400 font-bold opacity-60">BR-101</text>
                
                {/* BR-040 Central Spine */}
                <path
                  d="M 320,360 L 300,310 L 250,240"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />
                <text x="285" y="275" transform="rotate(-55 285 275)" className="text-[5px] font-mono fill-indigo-400 font-bold opacity-60">BR-040</text>
                
                {/* BR-153 / BR-050 Interior Spine */}
                <path
                  d="M 280,380 L 260,365 L 250,240"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />
                <text x="245" y="310" transform="rotate(80 245 310)" className="text-[5px] font-mono fill-emerald-400 font-bold opacity-60">BR-153</text>
              </g>
            )}

            {/* Geographical State Initials (Aesthetic background tags) */}
            <g className="opacity-25 font-mono text-[7px] font-extrabold fill-slate-500 pointer-events-none">
              <text x="262" y="395">SP</text>
              <text x="340" y="372">RJ</text>
              <text x="312" y="325">MG</text>
              <text x="234" y="255">DF</text>
              <text x="365" y="225">BA</text>
              <text x="440" y="165">PE</text>
              <text x="395" y="105">CE</text>
              <text x="175" y="475">RS</text>
            </g>

            {/* Graphic scale in bottom-right of the map canvas */}
            <g transform="translate(365, 465)" className="opacity-35 select-none pointer-events-none">
              <text x="0" y="-5" className="text-[6px] font-mono fill-slate-400 font-bold uppercase tracking-wider">Escala Gráfica</text>
              <line x1="0" y1="0" x2="80" y2="0" stroke="#64748b" strokeWidth="1.2" />
              <line x1="0" y1="-2" x2="0" y2="2" stroke="#64748b" strokeWidth="1" />
              <line x1="40" y1="-2" x2="40" y2="2" stroke="#64748b" strokeWidth="1" />
              <line x1="80" y1="-2" x2="80" y2="2" stroke="#64748b" strokeWidth="1" />
              <text x="0" y="7" className="text-[5px] font-mono fill-slate-500">0</text>
              <text x="35" y="7" className="text-[5px] font-mono fill-slate-500">250 km</text>
              <text x="75" y="7" className="text-[5px] font-mono fill-slate-500">500 km</text>
            </g>

            {/* Active shipping flows / routes */}
            <AnimatePresence>
              {filteredFreights.map((freight) => {
                const start = getCityCoords(freight.origin.city);
                const end = getCityCoords(freight.destination.city);
                const control = getControlPoint(start, end);
                const isSelected = selectedFreight?.id === freight.id;
                const isHovered = hoveredFreightId === freight.id;
                const isEnRoute = freight.status === "Em andamento";
                const isConcluded = freight.status === "Finalizado";
                const isPending = freight.status === "Pendente";

                const pathString = getD3CurvePath(start, end, control);
                const currentProgress = getFreightProgress(freight.id);
                const driverPos = getBezierPoint(start, control, end, currentProgress);

                // Determine route color
                let routeColor = "#3b82f6"; // Blue
                if (isSelected || isHovered) {
                  routeColor = "#f59e0b"; // Vibrant Amber
                } else if (isEnRoute) {
                  routeColor = "#10b981"; // Neon Green
                } else if (isConcluded) {
                  routeColor = "#3b82f6"; // Classic Blue
                } else if (isPending) {
                  routeColor = "#64748b"; // Muted Slate
                }

                const stopPoints = getStopPointsForFreight(freight, start, end, control, currentProgress);
                const currentDriver = drivers.find(d => d.id === freight.driverId);
                const currentVehicle = vehicles.find(v => v.id === freight.vehicleId);
                const vehicleStatus = getVehicleStatus(currentVehicle, freight);

                // Determine coordinate position for the vehicle badge
                let markerPos = driverPos;
                if (freight.status === "Pendente") {
                  markerPos = start;
                } else if (freight.status === "Finalizado") {
                  markerPos = end;
                }

                // Determine marker status color
                let markerColor = "#10b981"; // Green for "Trânsito"
                if (vehicleStatus === "Alerta") {
                  markerColor = "#f43f5e"; // Red for "Alerta"
                } else if (vehicleStatus === "Parado") {
                  markerColor = "#f59e0b"; // Amber for "Parado"
                }

                return (
                  <motion.g 
                    key={freight.id} 
                    onClick={() => setSelectedFreight(freight)} 
                    onMouseEnter={() => setHoveredFreightId(freight.id)}
                    onMouseLeave={() => setHoveredFreightId(null)}
                    className="cursor-pointer group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Thick invisible click helper path */}
                    <path
                      d={pathString}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="15"
                    />

                    {/* Behind glowing trail for highlights */}
                    {(isSelected || isHovered || isEnRoute) && (
                      <motion.path
                        key={`glow-${freight.id}`}
                        d={pathString}
                        fill="none"
                        stroke={routeColor}
                        strokeWidth={isSelected || isHovered ? "6" : "3"}
                        className="opacity-20 transition-all duration-300"
                        filter="url(#glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    )}

                    {/* Core Route Path Line with transition on d and pathLength drawing */}
                    <motion.path
                      key={`core-${freight.id}`}
                      d={pathString}
                      fill="none"
                      stroke={routeColor}
                      strokeWidth={isSelected || isHovered ? "3.5" : "1.8"}
                      strokeDasharray={isEnRoute ? "6 4" : "0"}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />

                    {/* Stop Points Rendered on Path */}
                    {(isSelected || isHovered || isEnRoute) && stopPoints.map((stop) => {
                      const stopColor = stop.status === "Concluído" ? "#3b82f6" : stop.status === "Em andamento" ? "#10b981" : "#475569";
                      return (
                        <g
                          key={stop.id}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            setActiveTooltip({
                              id: stop.id,
                              type: "stop",
                              x: stop.coords.x,
                              y: stop.coords.y,
                              title: stop.name,
                              subtitle: stop.type,
                              details: [
                                { label: "Status", value: stop.status === "Concluído" ? "Concluído" : stop.status === "Em andamento" ? "Em Atendimento" : "Pendente", colorClass: stop.status === "Concluído" ? "text-blue-400 font-bold" : stop.status === "Em andamento" ? "text-emerald-400 font-bold" : "text-slate-400" },
                                { label: "Previsão", value: stop.forecast },
                                { label: "Descrição", value: stop.description }
                              ],
                              footer: "Ponto de controle e parada regulamentar"
                            });
                          }}
                          onMouseLeave={() => setActiveTooltip(null)}
                          className="transition-all duration-300 hover:scale-125"
                        >
                          {/* Outer protective ring for contrast */}
                          <circle
                            cx={stop.coords.x}
                            cy={stop.coords.y}
                            r="5.5"
                            fill="#09090b"
                            stroke="#ffffff"
                            strokeWidth="1"
                          />
                          {/* Core Stop Circle */}
                          <circle
                            cx={stop.coords.x}
                            cy={stop.coords.y}
                            r="3.5"
                            fill={stopColor}
                            className="transition-all duration-300"
                          />
                        </g>
                      );
                    })}

                    {/* Vehicle Status Marker (Crawl Avatar / Truck Badge) */}
                    {(isEnRoute || isSelected || isHovered) && (
                      <motion.g
                        key={`vehicle-${freight.id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, x: markerPos.x, y: markerPos.y }}
                        transition={{ type: "spring", stiffness: 120, damping: 14 }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setActiveTooltip({
                            id: `${freight.id}-driver`,
                            type: "driver",
                            x: markerPos.x,
                            y: markerPos.y,
                            title: currentDriver?.fullName || "Motorista Escalado",
                            subtitle: currentVehicle ? `${currentVehicle.brand} ${currentVehicle.model} • ${currentVehicle.plate}` : "Veículo de Frota",
                            details: [
                              { 
                                label: "Status Veículo", 
                                value: vehicleStatus === "Trânsito" ? "Em Trânsito (84 km/h)" : vehicleStatus === "Alerta" ? "Alerta Operacional!" : "Parado", 
                                colorClass: vehicleStatus === "Trânsito" ? "text-emerald-400 font-bold" : vehicleStatus === "Alerta" ? "text-rose-400 font-bold animate-pulse" : "text-amber-400 font-bold" 
                              },
                              { label: "Placa", value: currentVehicle?.plate || "Sem Placa" },
                              { label: "Carga", value: `${freight.cargo.type} (${freight.cargo.qty} ${freight.cargo.unit})` },
                              { label: "Posição Atual", value: vehicleStatus === "Trânsito" ? "Em Rodovia" : vehicleStatus === "Alerta" ? "Parada para Verificação" : "Pátio da Empresa" },
                              ...(vehicleStatus === "Alerta" ? [{ label: "Aviso", value: currentVehicle && (currentVehicle.currentMileage >= currentVehicle.nextMaintenance - 2000) ? "Manutenção próxima!" : "Licenciamento Crítico!", colorClass: "text-rose-400 font-extrabold" }] : [])
                            ],
                            footer: vehicleStatus === "Trânsito" ? "Rastreamento por satélite ativo" : "Estacionado / Desconectado"
                          });
                        }}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="cursor-pointer"
                        whileHover={{ scale: 1.25 }}
                      >
                        {/* Pulsing beacon behind vehicle marker */}
                        <circle
                          cx="0"
                          cy="0"
                          r="10"
                          fill="none"
                          stroke={markerColor}
                          strokeWidth="1.5"
                          className={`opacity-70 ${vehicleStatus === "Trânsito" ? "animate-ping" : vehicleStatus === "Alerta" ? "animate-pulse" : ""}`}
                        />
                        
                        {/* Vehicle Marker Circle Background */}
                        <circle
                          cx="0"
                          cy="0"
                          r="7"
                          fill={markerColor}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          filter="url(#glow)"
                        />

                        {/* Small center core */}
                        <circle
                          cx="0"
                          cy="0"
                          r="2.5"
                          fill="#ffffff"
                        />
                      </motion.g>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>

            {/* Hub node points on top */}
            {Object.entries(HUB_COORDINATES).map(([key, hub]) => {
              // Verify active freight volume linked to this hub
              const hubFreights = freights.filter(f => 
                f.origin.city.toUpperCase().trim() === key || f.destination.city.toUpperCase().trim() === key
              );
              const isActiveHub = hubFreights.length > 0;
              const hasEnRouteFreight = hubFreights.some(f => f.status === "Em andamento");
              const isSelectedHub = selectedHub === hub.name;

              const departingCount = freights.filter(f => f.origin.city.toUpperCase().trim() === key && f.status === "Em andamento").length;
              const arrivingCount = freights.filter(f => f.destination.city.toUpperCase().trim() === key && f.status === "Em andamento").length;
              const totalHubValue = hubFreights.reduce((sum, f) => sum + f.financial.value, 0);

              return (
                <g 
                  key={key} 
                  onClick={() => {
                    setSelectedHub(isSelectedHub ? null : hub.name);
                    setSelectedFreight(null);
                  }}
                  onMouseEnter={() => {
                    setActiveTooltip({
                      id: `hub-${key}`,
                      type: "hub",
                      x: hub.x,
                      y: hub.y,
                      title: `${hub.name} - ${hub.state}`,
                      subtitle: "Hub Logístico Multimodal",
                      details: [
                        { label: "Em trânsito (Partindo)", value: `${departingCount} veículos`, colorClass: departingCount > 0 ? "text-emerald-400 font-bold" : "text-slate-400" },
                        { label: "Em trânsito (Chegando)", value: `${arrivingCount} veículos`, colorClass: arrivingCount > 0 ? "text-blue-400 font-bold" : "text-slate-400" },
                        { label: "Operação Total", value: `R$ ${totalHubValue.toLocaleString("pt-BR")}` }
                      ],
                      footer: "Clique para filtrar fretes desta região"
                    });
                  }}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="cursor-pointer group/node"
                >
                  {/* Radar pulse around active cities */}
                  {hasEnRouteFreight && (
                    <circle
                      cx={hub.x}
                      cy={hub.y}
                      r="14"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.2"
                      className="animate-ping opacity-40"
                    />
                  )}

                  {/* Secondary anchor glow */}
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isSelectedHub ? "9" : isActiveHub ? "6.5" : "4.5"}
                    fill={isSelectedHub ? "#f59e0b" : isActiveHub ? "#3b82f6" : "#475569"}
                    className="transition-all duration-300 group-hover/node:fill-amber-400 group-hover/node:scale-125"
                    filter={isSelectedHub ? "url(#glow)" : ""}
                  />

                  {/* Small core element */}
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r="2"
                    fill="#ffffff"
                  />

                  {/* Permanent short state tags on major nodes, full name on hover */}
                  <text
                    x={hub.x}
                    y={hub.y - 12}
                    textAnchor="middle"
                    className="font-mono text-[9px] fill-slate-400 tracking-tighter pointer-events-none transition-all font-bold opacity-75 group-hover/node:opacity-100 group-hover/node:fill-white group-hover/node:text-[11px]"
                  >
                    {hub.name}
                  </text>
                </g>
              );
            })}
          </svg>
          )}

          {/* Floating Tooltip Component */}
          {activeTooltip && (
            <div 
              className="absolute z-50 bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-left pointer-events-none transition-all duration-200 backdrop-blur-md min-w-[240px]"
              style={{
                left: `${(activeTooltip.x / 500) * 100}%`,
                top: `${(activeTooltip.y / 500) * 100}%`,
                transform: "translate(-50%, -112%)",
              }}
            >
              {/* Header */}
              <div className="border-b border-slate-800 pb-1.5 mb-2">
                <p className="text-xs font-black text-white">{activeTooltip.title}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{activeTooltip.subtitle}</p>
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-[11px] font-mono">
                {activeTooltip.details.map((detail, index) => (
                  <div key={index} className="flex justify-between gap-4">
                    <span className="text-slate-500">{detail.label}:</span>
                    <span className={`text-right ${detail.colorClass || "text-slate-300"}`}>
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {activeTooltip.footer && (
                <div className="border-t border-slate-800 mt-2 pt-1.5 text-[9px] text-slate-500 italic">
                  {activeTooltip.footer}
                </div>
              )}

              {/* Tooltip Arrow Tail */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-slate-950/95" />
            </div>
          )}

          {/* Interactive Legend Box */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-blue-400" />
              <span className="text-slate-300">Hubs Principais</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-emerald-400 animate-pulse" />
              <span className="text-slate-300">Fluxo em Trânsito</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
              <span className="text-slate-300">Rota Concluída</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-500 rounded-full" />
              <span className="text-slate-300">Pendente</span>
            </div>
            <div className="text-slate-500 text-[10px] hidden md:block">
              *Clique em uma cidade para isolar rotas da região.
            </div>
          </div>
        </div>

        {/* Dynamic Operations Command Center Panel */}
        <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Active details header */}
          <div className="p-4.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
              Central de Monitoramento Real
            </h3>
            {selectedFreight && (
              <button 
                onClick={() => setSelectedFreight(null)}
                className="text-slate-400 hover:text-white transition-all p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[440px]">
            {selectedFreight ? (() => {
              const currentDriver = drivers.find(d => d.id === selectedFreight.driverId);
              const currentVehicle = vehicles.find(v => v.id === selectedFreight.vehicleId);

              return (
                <div className="space-y-4">
                  {/* Freight Header Info */}
                  <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="px-2.5 py-1 text-xs font-mono font-black rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {selectedFreight.freightNumber}
                      </span>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-wider rounded-lg ${
                          selectedFreight.status === "Finalizado" ? "bg-blue-500/15 text-blue-400" :
                          selectedFreight.status === "Em andamento" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" : 
                          selectedFreight.status === "Pendente" ? "bg-amber-500/15 text-amber-400 border border-amber-500/10" : "bg-slate-800 text-slate-400"
                        }`}>
                          {selectedFreight.status}
                        </span>

                        {/* Vehicle Status Badge */}
                        {(() => {
                          const vStatus = getVehicleStatus(currentVehicle, selectedFreight);
                          return (
                            <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded flex items-center gap-1 border ${
                              vStatus === "Trânsito" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : vStatus === "Alerta"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                vStatus === "Trânsito" ? "bg-emerald-400" : vStatus === "Alerta" ? "bg-rose-400" : "bg-amber-400"
                              }`} />
                              Veículo: {vStatus === "Trânsito" ? "Em Trânsito" : vStatus === "Alerta" ? "Alerta" : "Parado"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 mt-3 border-t border-slate-900 pt-2.5">
                      <div>Partida: <span className="text-slate-300 font-bold">{selectedFreight.departureTime || "--:--"}</span></div>
                      <div>Previsão: <span className="text-slate-300 font-bold">{selectedFreight.arrivalTime || "--:--"}</span></div>
                    </div>
                  </div>

                  {/* Routing Flow Line */}
                  <div className="relative pl-6 space-y-4.5 bg-slate-900/20 border border-slate-900 p-4 rounded-2xl">
                    {/* Vertical connector line */}
                    <div className="absolute left-[21px] top-6 bottom-6 w-0.5 border-l border-dashed border-slate-700" />

                    {/* Origin */}
                    <div className="relative flex items-start gap-3">
                      <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 border-2 border-slate-950 flex-shrink-0 mt-1" />
                      <div className="text-left">
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Origem</p>
                        <p className="text-xs font-extrabold text-slate-200 mt-0.5">{selectedFreight.origin.company}</p>
                        <p className="text-[11px] text-slate-400">{selectedFreight.origin.city}, {selectedFreight.origin.state}</p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="relative flex items-start gap-3">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 border-2 border-slate-950 flex-shrink-0 mt-1" />
                      <div className="text-left">
                        <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Destino</p>
                        <p className="text-xs font-extrabold text-slate-200 mt-0.5">{selectedFreight.destination.company}</p>
                        <p className="text-[11px] text-slate-400">{selectedFreight.destination.city}, {selectedFreight.destination.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Driver Profile & Status */}
                  {currentDriver ? (
                    <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {currentDriver.photo ? (
                            <img 
                              src={currentDriver.photo} 
                              alt={currentDriver.fullName} 
                              className="w-11 h-11 rounded-xl object-cover border border-slate-700/60"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-black text-white">
                              {currentDriver.fullName.charAt(0)}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase font-mono font-black text-emerald-400 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            GPS Ativo / Online
                          </span>
                          <h4 className="text-xs font-black text-white truncate mt-0.5">{currentDriver.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">CNH: {currentDriver.cnh} ({currentDriver.cnhCategory})</p>
                        </div>
                      </div>

                      {/* Speedometer & Climate Telemetry Widgets */}
                      {selectedFreight.status === "Em andamento" && (
                        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-slate-800/60">
                          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-900 flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-emerald-400" />
                            <div>
                              <p className="text-[8px] text-slate-500 font-mono uppercase">Velocidade</p>
                              <p className="text-xs font-black text-white font-mono mt-0.5">84 km/h</p>
                            </div>
                          </div>

                          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-900 flex items-center gap-2">
                            <CloudSun className="w-4 h-4 text-amber-400" />
                            <div>
                              <p className="text-[8px] text-slate-500 font-mono uppercase">Clima Rota</p>
                              <p className="text-xs font-black text-white mt-0.5">Ensolarado</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-5 text-center text-slate-500">
                      <Users className="w-7 h-7 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">Nenhum Motorista Escalado</p>
                      <p className="text-[10px] text-slate-600 mt-1">Este frete ainda não possui condutor designado nas planilhas do ERP.</p>
                    </div>
                  )}

                  {/* Operational details card */}
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 font-mono text-[11px] space-y-2.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Carga:</span>
                      <span className="text-slate-200 font-sans font-bold">{selectedFreight.cargo.type} ({selectedFreight.cargo.qty} {selectedFreight.cargo.unit})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">KM Total Rota:</span>
                      <span className="text-blue-400 font-bold">{selectedFreight.mileage.total} KM</span>
                    </div>
                    {currentVehicle && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Veículo:</span>
                        <span className="text-slate-300 font-sans">{currentVehicle.brand} {currentVehicle.model} ({currentVehicle.year})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor do Frete:</span>
                      <span className="text-emerald-400 font-sans font-black text-sm">
                        R$ {selectedFreight.financial.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-slate-800/80 my-2 pt-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Placa Cavalo:</span>
                      <span className="bg-slate-950 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-850 text-[10px]">
                        {getFreightVehiclePlate(selectedFreight.vehicleId)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              /* Searchable Freight Fleet Feed */
              <div className="space-y-3.5 h-full flex flex-col text-left">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por placa, cidade, carga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 text-white rounded-xl py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Operations Feed List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px] scrollbar-thin text-left">
                  {filteredFreights.length > 0 ? (
                    filteredFreights.map((freight) => {
                      const isHovered = hoveredFreightId === freight.id;
                      const isEnRoute = freight.status === "Em andamento";
                      const isConcluded = freight.status === "Finalizado";

                      const currentVehicle = vehicles.find(v => v.id === freight.vehicleId);
                      const vehicleStatus = getVehicleStatus(currentVehicle, freight);

                      let dotColor = "bg-emerald-500";
                      let statusText = "Em trânsito";
                      if (vehicleStatus === "Alerta") {
                        dotColor = "bg-rose-500 animate-pulse";
                        statusText = "Alerta";
                      } else if (vehicleStatus === "Parado") {
                        dotColor = "bg-amber-500";
                        statusText = "Parado";
                      }

                      return (
                        <div
                          key={freight.id}
                          onClick={() => setSelectedFreight(freight)}
                          onMouseEnter={() => setHoveredFreightId(freight.id)}
                          onMouseLeave={() => setHoveredFreightId(null)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isHovered 
                              ? "bg-slate-900 border-amber-500/50 scale-[1.01]" 
                              : "bg-slate-900/40 border-slate-800 hover:bg-slate-900"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono font-black text-slate-200">
                              {freight.freightNumber}
                            </span>
                            <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full ${
                              isConcluded ? "bg-blue-500/10 text-blue-400" :
                              isEnRoute ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {freight.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 gap-1 mt-1 font-sans">
                            <span className="truncate max-w-[100px] font-semibold text-slate-300">{freight.origin.city}</span>
                            <span className="text-slate-600 font-mono">→</span>
                            <span className="truncate max-w-[100px] text-right font-semibold text-slate-300">{freight.destination.city}</span>
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                            <span className="font-sans text-slate-400 font-semibold">R$ {freight.financial.value.toLocaleString("pt-BR")}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} title={`Veículo ${statusText}`} />
                              <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 text-[9px] font-black">{getFreightVehiclePlate(freight.vehicleId)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      <Map className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-400">Nenhum fluxo encontrado</p>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">Tente ajustar seus filtros ou termos de pesquisa na central.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer controls for current view status */}
          <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between items-center">
            <span>Visualizando: {filteredFreights.length} de {freights.length} rotas</span>
            {selectedFreight && (
              <button
                onClick={() => setSelectedFreight(null)}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Voltar ao feed
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

