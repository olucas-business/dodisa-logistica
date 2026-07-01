import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Freight, Driver, Vehicle } from "../types";

interface LeafletMapComponentProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedFreight: Freight | null;
  setSelectedFreight: (f: Freight | null) => void;
  hoveredFreightId: string | null;
  setHoveredFreightId: (id: string | null) => void;
  statusFilter: string;
  vehicleStatusFilter: "Todos" | "Trânsito" | "Parado" | "Alerta";
  searchQuery: string;
  mapMode: "VETOR" | "SATÉLITE" | "TOPOGRÁFICO";
  showHighways: boolean;
  showBorders: boolean;
  showRadars: boolean;
  progressTick: number;
  selectedHub: string | null;
  setSelectedHub: (hubName: string | null) => void;
}

// Real-world coordinates mapping (latitude & longitude) for Brazilian transport hubs
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

export default function LeafletMapComponent({
  freights,
  drivers,
  vehicles,
  selectedFreight,
  setSelectedFreight,
  hoveredFreightId,
  setHoveredFreightId,
  statusFilter,
  vehicleStatusFilter,
  searchQuery,
  mapMode,
  showHighways,
  showBorders,
  showRadars,
  progressTick,
  selectedHub,
  setSelectedHub,
}: LeafletMapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  // Layer groups to easily clear/add markers & polylines dynamically
  const routesGroupRef = useRef<L.FeatureGroup | null>(null);
  const hubsGroupRef = useRef<L.FeatureGroup | null>(null);
  const vehiclesGroupRef = useRef<L.FeatureGroup | null>(null);

  // Initialize Map Instance once
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    // Brazil Center coordinates
    const map = L.map(containerRef.current, {
      center: [-15.7801, -47.9292],
      zoom: 4.2,
      zoomControl: false,
      attributionControl: true
    });

    // Add zoom control at top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Initialize FeatureGroups
    const routesGroup = L.featureGroup().addTo(map);
    const hubsGroup = L.featureGroup().addTo(map);
    const vehiclesGroup = L.featureGroup().addTo(map);

    routesGroupRef.current = routesGroup;
    hubsGroupRef.current = hubsGroup;
    vehiclesGroupRef.current = vehiclesGroup;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layers on Map Mode or document class changes (dark/light)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const isDarkMode = document.documentElement.classList.contains("dark");
    let tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (mapMode === "SATÉLITE") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";
    } else if (mapMode === "TOPOGRÁFICO") {
      tileUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      attribution = "Map data: &copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors, <a href=\"http://viewfinderpanoramas.org\">SRTM</a> | Map style: &copy; <a href=\"https://opentopomap.org\">OpenTopoMap</a>";
    } else {
      // Vector - adapt based on theme
      if (isDarkMode) {
        tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
      } else {
        tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
      }
    }

    const newTileLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 18 });
    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [mapMode]);

  // Redraw Polylines, Hubs and Vehicles dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routesGroup = routesGroupRef.current;
    const hubsGroup = hubsGroupRef.current;
    const vehiclesGroup = vehiclesGroupRef.current;

    if (!map || !routesGroup || !hubsGroup || !vehiclesGroup) return;

    // Clear previous layers
    routesGroup.clearLayers();
    hubsGroup.clearLayers();
    vehiclesGroup.clearLayers();

    // Helper to get vehicle status
    const getVehicleStatus = (vehicle: Vehicle | undefined, freight: Freight | undefined): "Trânsito" | "Parado" | "Alerta" => {
      if (!vehicle) return "Parado";
      const isNearMaintenance = vehicle.nextMaintenance > 0 && (vehicle.nextMaintenance - vehicle.currentMileage <= 2000);
      const isLicensingNear = vehicle.plate === "XYZ-5678" || vehicle.plate === "LMN-3344" || vehicle.licensingExpiration?.startsWith("2026-06");
      if (isNearMaintenance || isLicensingNear) {
        return "Alerta";
      }
      return freight?.status === "Em andamento" ? "Trânsito" : "Parado";
    };

    // Filter freights locally inside map rendering for precision matching
    const activeAndFiltered = freights.filter((freight) => {
      // 1. Status Filter
      if (statusFilter !== "Todos" && freight.status !== statusFilter) return false;

      // 2. Hub Selection Filter
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
        if (vStatus !== vehicleStatusFilter) return false;
      }

      // 4. Search Filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const fNum = freight.freightNumber.toLowerCase();
        const origCity = freight.origin.city.toLowerCase();
        const destCity = freight.destination.city.toLowerCase();
        const origComp = freight.origin.company.toLowerCase();
        const destComp = freight.destination.company.toLowerCase();
        const cargoType = freight.cargo.type.toLowerCase();
        
        const driver = drivers.find((d) => d.id === freight.driverId);
        const driverName = driver ? driver.fullName.toLowerCase() : "";
        const vehicle = vehicles.find((v) => v.id === freight.vehicleId);
        const plate = vehicle ? vehicle.plate.toLowerCase() : "";

        if (
          !fNum.includes(q) &&
          !origCity.includes(q) &&
          !destCity.includes(q) &&
          !origComp.includes(q) &&
          !destComp.includes(q) &&
          !cargoType.includes(q) &&
          !driverName.includes(q) &&
          !plate.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });

    // 1. RENDER ROUTES/POLYLINES
    activeAndFiltered.forEach((freight) => {
      const start = getCityLatLng(freight.origin.city);
      const end = getCityLatLng(freight.destination.city);

      const isSelected = selectedFreight?.id === freight.id;
      const isHovered = hoveredFreightId === freight.id;
      const isEnRoute = freight.status === "Em andamento";

      let routeColor = isSelected ? "#f59e0b" : isHovered ? "#3b82f6" : isEnRoute ? "#10b981" : "#64748b";
      let routeWeight = isSelected || isHovered ? 4.5 : 2;
      let routeOpacity = isSelected || isHovered ? 0.95 : 0.6;

      const polyline = L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
        color: routeColor,
        weight: routeWeight,
        opacity: routeOpacity,
        className: isEnRoute ? "leaflet-interactive-route" : ""
      });

      // Interactive behaviors
      polyline.on("click", () => {
        setSelectedFreight(freight);
      });

      polyline.on("mouseover", () => {
        setHoveredFreightId(freight.id);
      });

      polyline.on("mouseout", () => {
        setHoveredFreightId(null);
      });

      // Tooltip
      polyline.bindTooltip(`
        <div class="text-[11px] font-mono p-1">
          <p class="font-bold text-white">${freight.freightNumber}</p>
          <p class="text-slate-400 text-[10px] mt-0.5">${freight.origin.city} → ${freight.destination.city}</p>
          <p class="text-emerald-400 text-[10px] font-semibold mt-0.5">R$ ${freight.financial.value.toLocaleString("pt-BR")}</p>
        </div>
      `, {
        direction: "top",
        sticky: true,
        className: "bg-slate-950 border border-slate-800 rounded-lg p-1"
      });

      polyline.addTo(routesGroup);
    });

    // 2. RENDER HUB MARKERS
    Object.entries(HUB_COORDINATES_LAT_LNG).forEach(([key, hub]) => {
      const hubFreights = freights.filter(f => 
        f.origin.city.toUpperCase().trim() === key || f.destination.city.toUpperCase().trim() === key
      );
      const isActiveHub = hubFreights.length > 0;
      const isSelectedHub = selectedHub === hub.name;

      // Custom Hub divIcon HTML
      const colorClass = isSelectedHub ? "bg-amber-500" : isActiveHub ? "bg-blue-500" : "bg-slate-600";
      const sizeClass = isSelectedHub ? "w-4 h-4 ring-amber-500/30" : "w-3 h-3 ring-blue-500/30";
      const labelColor = isSelectedHub ? "text-amber-400 font-extrabold" : "text-slate-300 font-bold";

      const hubHtml = `
        <div class="relative flex flex-col items-center justify-center" style="width: 64px; height: 64px;">
          ${isActiveHub ? `
            <div class="absolute rounded-full bg-blue-500/20 animate-ping" style="width: 18px; height: 18px;"></div>
          ` : ""}
          <div class="${sizeClass} rounded-full ${colorClass} ring-4 border border-slate-950 shadow-md"></div>
          <div class="absolute -top-3.5 text-[8.5px] ${labelColor} font-sans uppercase tracking-tighter whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center">
            ${hub.name}
          </div>
        </div>
      `;

      const hubIcon = L.divIcon({
        html: hubHtml,
        className: "custom-leaflet-marker",
        iconSize: [64, 64],
        iconAnchor: [32, 32]
      });

      const marker = L.marker([hub.lat, hub.lng], { icon: hubIcon });

      marker.on("click", () => {
        setSelectedHub(isSelectedHub ? null : hub.name);
        setSelectedFreight(null);
      });

      marker.bindTooltip(`
        <div class="text-[10px] font-sans p-1 text-slate-200">
          <p class="font-extrabold text-white">${hub.name} - ${hub.state}</p>
          <p class="mt-1">${hubFreights.length} Viagens Relacionadas</p>
        </div>
      `, {
        direction: "top",
        className: "bg-slate-950 border border-slate-800 rounded-lg p-1"
      });

      marker.addTo(hubsGroup);
    });

    // 3. RENDER VEHICLE MARKERS (EM TRÂNSITO)
    activeAndFiltered.forEach((freight) => {
      if (freight.status !== "Em andamento") return;

      const start = getCityLatLng(freight.origin.city);
      const end = getCityLatLng(freight.destination.city);

      // Interpolate coordinates based on tick and offset to spread vehicles
      const offset = (parseInt(freight.id.replace(/\D/g, "")) % 10) / 10;
      const currentProgress = (progressTick + offset) % 1;
      
      const currentLat = start.lat + (end.lat - start.lat) * currentProgress;
      const currentLng = start.lng + (end.lng - start.lng) * currentProgress;

      const vehicle = vehicles.find((v) => v.id === freight.vehicleId);
      const driver = drivers.find((d) => d.id === freight.driverId);
      const vehicleStatus = getVehicleStatus(vehicle, freight);

      let colorClass = "bg-emerald-500 ring-emerald-500/20";
      let animatePing = "animate-ping";
      if (vehicleStatus === "Alerta") {
        colorClass = "bg-rose-500 ring-rose-500/30";
        animatePing = "animate-pulse";
      } else if (vehicleStatus === "Parado") {
        colorClass = "bg-amber-500 ring-amber-500/20";
        animatePing = "";
      }

      const vehicleHtml = `
        <div class="relative flex items-center justify-center" style="width: 48px; height: 48px;">
          ${vehicleStatus === "Trânsito" || vehicleStatus === "Alerta" ? `
            <div class="absolute rounded-full ${colorClass} opacity-30 ${animatePing}" style="width: 28px; height: 28px; top: 10px; left: 10px;"></div>
          ` : ""}
          <div class="relative w-8 h-8 rounded-full ${colorClass} ring-4 text-white flex items-center justify-center border-2 border-slate-900 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.29-.71l-3.14-3.14a1 1 0 0 0-.71-.29H14" />
              <circle cx="7.5" cy="18.5" r="2.5" />
              <circle cx="16.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div class="absolute -bottom-4.5 left-1/2 -translate-x-1/2 bg-slate-950/95 text-white text-[8px] font-black font-mono px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap shadow-lg">
            ${vehicle?.plate || "FROTA"}
          </div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        html: vehicleHtml,
        className: "custom-leaflet-marker",
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const marker = L.marker([currentLat, currentLng], { icon: vehicleIcon });

      marker.on("click", () => {
        setSelectedFreight(freight);
      });

      marker.bindTooltip(`
        <div class="text-[11px] font-sans p-1.5 text-slate-200">
          <p class="font-extrabold text-white">${driver?.fullName || "Motorista"}</p>
          <p class="text-slate-400 text-[10px] mt-0.5">${vehicle?.brand} ${vehicle?.model} • ${vehicle?.plate || "N/A"}</p>
          <p class="text-[10px] mt-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${vehicleStatus === "Trânsito" ? "bg-emerald-400" : vehicleStatus === "Alerta" ? "bg-rose-400" : "bg-amber-400"}"></span>
            ${vehicleStatus === "Trânsito" ? "Em Trânsito (84 km/h)" : vehicleStatus === "Alerta" ? "Alerta Operacional" : "Parado"}
          </p>
        </div>
      `, {
        direction: "top",
        className: "bg-slate-950 border border-slate-800 rounded-lg p-1.5 shadow-2xl"
      });

      marker.addTo(vehiclesGroup);
    });

  }, [
    freights,
    drivers,
    vehicles,
    selectedFreight,
    hoveredFreightId,
    statusFilter,
    vehicleStatusFilter,
    searchQuery,
    progressTick,
    selectedHub
  ]);

  // Resize Observer to handle container resizing and invalidateSize
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    // Trigger immediate invalidateSize and also delayed ones to account for transition animations
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-inner border border-slate-850 bg-slate-950 relative z-10"
      style={{ height: "100%" }}
    />
  );
}
