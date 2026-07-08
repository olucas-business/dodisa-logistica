import React, { useState, useEffect } from "react";
import { User, Driver, Vehicle, Freight, TripLog, TripPhoto } from "../types";
import BrandMark from "./BrandMark";
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  Compass, 
  Camera, 
  CheckCircle, 
  LogOut, 
  Plus, 
  Check, 
  Info, 
  Maximize2, 
  X, 
  ChevronRight, 
  DollarSign, 
  FileText,
  Fuel,
  Settings,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DriverWorkspaceProps {
  user: User;
  drivers: Driver[];
  vehicles: Vehicle[];
  freights: Freight[];
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
}

// Preset realistic images for fast testing
const PRESET_IMAGES = [
  { label: "Painel Km 124k", url: "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&q=80&w=300", type: "Painel" },
  { label: "Painel Km 125k", url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=300", type: "Painel" },
  { label: "Caminhão Frente", url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=300", type: "Frente" },
  { label: "Bomba Abastecimento", url: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80&w=300", type: "Combustível" },
  { label: "Nota Fiscal Recibo", url: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300", type: "Documento" },
  { label: "Pneu Novo", url: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=300", type: "Pneu" },
  { label: "Ponto de Descarga", url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300", type: "Descarga" }
];

export default function DriverWorkspace({
  user,
  drivers,
  vehicles,
  freights,
  onLogout,
  onRefreshData
}: DriverWorkspaceProps) {
  
  // Find logged driver data
  const currentDriver = drivers.find(d => d.id === user.driverId || d.email?.toLowerCase() === user.email?.toLowerCase());
  
  // States
  const [activeFreight, setActiveFreight] = useState<Freight | null>(null);
  const [tripLogs, setTripLogs] = useState<TripLog[]>([]);
  const [tripPhotos, setTripPhotos] = useState<TripPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Forms modals
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  
  // Photo Zoom lightbox
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);
  const [zoomPhotoTitle, setZoomPhotoTitle] = useState("");

  // "Iniciar Viagem" fields
  const [startOrigin, setStartOrigin] = useState("");
  const [startDestination, setStartDestination] = useState("");
  const [startVehicleId, setStartVehicleId] = useState("");
  const [startKm, setStartKm] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  const [startPanelPhoto, setStartPanelPhoto] = useState("");
  const [startFrontPhoto, setStartFrontPhoto] = useState("");
  const [startNotes, setStartNotes] = useState("");

  // "Novo Registro" fields
  const [recordCategory, setRecordCategory] = useState<TripLog["category"]>("Abastecimento");
  const [recordDescription, setRecordDescription] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [recordPhoto, setRecordPhoto] = useState("");
  const [recordLocation, setRecordLocation] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [recordTime, setRecordTime] = useState(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));

  // "Finalizar Viagem" fields
  const [endKm, setEndKm] = useState("");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [endTime, setEndTime] = useState(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  const [endPanelPhoto, setEndPanelPhoto] = useState("");
  const [endVehiclePhoto, setEndVehiclePhoto] = useState("");
  const [endNotes, setEndNotes] = useState("");

  // Fetch driver specific logs and active trip
  const loadDriverTripData = async () => {
    if (!currentDriver) return;
    setLoading(true);
    try {
      // Find current active freight
      const active = freights.find(f => f.driverId === currentDriver.id && f.status === "Em andamento");
      setActiveFreight(active || null);

      // Fetch logs and photos from backend
      const logsRes = await fetch("/api/trip_logs");
      const logsData = await logsRes.json();
      
      const photosRes = await fetch("/api/trip_photos");
      const photosData = await photosRes.json();

      if (active) {
        const filteredLogs = logsData.filter((l: TripLog) => l.freightId === active.id);
        const filteredPhotos = photosData.filter((p: TripPhoto) => p.freightId === active.id);
        // Sort logs chronologically
        filteredLogs.sort((a: TripLog, b: TripLog) => a.createdAt.localeCompare(b.createdAt));
        setTripLogs(filteredLogs);
        setTripPhotos(filteredPhotos);
      } else {
        setTripLogs([]);
        setTripPhotos([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverTripData();
  }, [currentDriver, freights]);

  // Autofill start mileage when vehicle selection changes
  useEffect(() => {
    if (startVehicleId) {
      const v = vehicles.find(vh => vh.id === startVehicleId);
      if (v) {
        setStartKm(String(v.currentMileage || 0));
      }
    }
  }, [startVehicleId, vehicles]);

  // Set message with timeout helper
  const showMessage = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  // Convert image upload to base64 helper (used for instant local preview)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload a base64 photo to Supabase Storage, returning a lightweight URL
  const uploadPhoto = async (base64: string, folder: string): Promise<string> => {
    if (!base64 || !base64.startsWith("data:")) return base64;
    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder })
      });
      const data = await res.json();
      return data.success ? data.url : base64;
    } catch {
      return base64;
    }
  };

  // Get GPS current location simulation or browser actual
  const handleFetchGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRecordLocation(`${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`);
          showMessage("success", "Sua localização GPS atual foi capturada com sucesso.");
        },
        () => {
          // Fallback to random realistic location based on driver's city if possible
          const cities = ["São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR", "Santos, SP"];
          const randomCity = cities[Math.floor(Math.random() * cities.length)];
          setRecordLocation(randomCity);
          showMessage("success", `Localização estimada: ${randomCity}`);
        }
      );
    } else {
      setRecordLocation("São Paulo, SP");
    }
  };

  // Submit Start Trip
  const handleStartTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startOrigin || !startDestination || !startVehicleId || !startKm) {
      showMessage("error", "Preencha todos os campos obrigatórios (*)");
      return;
    }

    setLoading(true);
    try {
      const [panelPhotoUrl, frontPhotoUrl] = await Promise.all([
        uploadPhoto(startPanelPhoto, "trip-start"),
        uploadPhoto(startFrontPhoto, "trip-start")
      ]);
      const res = await fetch("/api/driver_start_trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: currentDriver?.id,
          vehicleId: startVehicleId,
          origin: startOrigin,
          destination: startDestination,
          startKm: Number(startKm),
          date: startDate,
          time: startTime,
          panelPhoto: panelPhotoUrl,
          frontPhoto: frontPhotoUrl,
          observations: startNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        showMessage("success", "Boa viagem! Sua rota foi iniciada e cadastrada no sistema.");
        setIsStartModalOpen(false);
        // Clear start form
        setStartOrigin("");
        setStartDestination("");
        setStartVehicleId("");
        setStartKm("");
        setStartPanelPhoto("");
        setStartFrontPhoto("");
        setStartNotes("");
        // Refresh
        await onRefreshData();
        await loadDriverTripData();
      } else {
        showMessage("error", data.message || "Erro ao iniciar viagem");
      }
    } catch (err) {
      showMessage("error", "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Trip Event Record
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordDescription) {
      showMessage("error", "O campo de descrição é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      const recordPhotoUrl = await uploadPhoto(recordPhoto, "trip-events");
      const res = await fetch("/api/trip_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freightId: activeFreight?.id,
          driverId: currentDriver?.id,
          category: recordCategory,
          description: recordDescription,
          value: recordValue ? Number(recordValue) : undefined,
          date: recordDate,
          time: recordTime,
          location: recordLocation,
          photos: recordPhotoUrl ? [recordPhotoUrl] : [],
          notes: recordNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        showMessage("success", "Registro lançado e enviado para o painel da empresa.");
        setIsRecordModalOpen(false);
        // Clear record form
        setRecordDescription("");
        setRecordValue("");
        setRecordNotes("");
        setRecordPhoto("");
        setRecordLocation("");
        // Refresh
        await onRefreshData();
        await loadDriverTripData();
      } else {
        showMessage("error", data.message || "Erro ao salvar registro");
      }
    } catch (err) {
      showMessage("error", "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Submit End Trip
  const handleEndTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endKm) {
      showMessage("error", "A quilometragem final é obrigatória.");
      return;
    }

    const startKmVal = activeFreight?.mileage.start || 0;
    if (Number(endKm) < startKmVal) {
      showMessage("error", `A quilometragem final (${endKm} KM) não pode ser menor do que a inicial (${startKmVal} KM).`);
      return;
    }

    setLoading(true);
    try {
      const [endPanelPhotoUrl, endVehiclePhotoUrl] = await Promise.all([
        uploadPhoto(endPanelPhoto, "trip-end"),
        uploadPhoto(endVehiclePhoto, "trip-end")
      ]);
      const res = await fetch(`/api/driver_end_trip/${activeFreight?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endKm: Number(endKm),
          date: endDate,
          time: endTime,
          panelPhoto: endPanelPhotoUrl,
          vehiclePhoto: endVehiclePhotoUrl,
          observations: endNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        showMessage("success", "Viagem finalizada com sucesso! Relatório enviado ao painel administrativo.");
        setIsEndModalOpen(false);
        // Clear end fields
        setEndKm("");
        setEndPanelPhoto("");
        setEndVehiclePhoto("");
        setEndNotes("");
        // Refresh
        await onRefreshData();
        await loadDriverTripData();
      } else {
        showMessage("error", data.message || "Erro ao finalizar viagem");
      }
    } catch (err) {
      showMessage("error", "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryEmoji = (cat: TripLog["category"]) => {
    switch(cat) {
      case "Abastecimento": return "⛽";
      case "Troca de pneus": return "🛞";
      case "Manutenção": return "🛠";
      case "Carga": return "📦";
      case "Descarga": return "📤";
      case "Alimentação": return "🍔";
      case "Hospedagem": return "🏨";
      case "Pedágio": return "🛣";
      case "Parada": return "📍";
      case "Foto": return "📷";
      default: return "📄";
    }
  };

  if (!currentDriver) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl border border-red-200 max-w-md shadow-lg space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Perfil não Vinculado</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Seu usuário com e-mail <strong>{user.email}</strong> foi cadastrado como motorista, mas as informações cadastrais do motorista ainda não foram criadas pela empresa no painel administrativo.
          </p>
          <p className="text-xs text-slate-400">
            Entre em contato com o gestor de frota para vincular seu e-mail à sua ficha de motorista.
          </p>
          <button 
            onClick={onLogout}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    );
  }

  // Linked truck info
  const linkedTruck = vehicles.find(v => v.id === currentDriver.vehicleId);

  return (
    <div id="driver-portal-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-300">
      
      {/* 1. TOP HEADER COCKPIT */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 sticky top-0 z-40 transition-colors shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size="md" />
            <div>
              <h1 className="text-sm font-black tracking-wide uppercase text-blue-600 dark:text-blue-400">Fleet One Motorista</h1>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{currentDriver.fullName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              currentDriver.status === "Em viagem" 
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
            }`}>
              ● {currentDriver.status || "Ativo"}
            </span>

            <button
              onClick={onLogout}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Sair do Portal"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* GLOBAL TOAST MESSAGE */}
      <AnimatePresence>
        {msg && (
          <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 max-w-md text-left pointer-events-auto ${
                msg.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-slate-900 dark:border-emerald-500/30 dark:text-emerald-400" 
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-slate-900 dark:border-red-500/30 dark:text-red-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${msg.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
              <p className="flex-1">{msg.text}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

        {/* 2. DRIVER INFO BAR & CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 transition-colors">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Meu Caminhão</span>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              {linkedTruck ? `${linkedTruck.brand} ${linkedTruck.model}` : "Não Vinculado"}
            </p>
            <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
              Placa: {linkedTruck?.plate || "---"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 transition-colors">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Quilometragem</span>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              {linkedTruck ? `${linkedTruck.currentMileage.toLocaleString("pt-BR")} KM` : "N/A"}
            </p>
            <span className="text-[10px] font-mono text-gray-500 block mt-0.5">Odômetro atualizado</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 transition-colors">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Viagem Atual</span>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              {activeFreight ? activeFreight.freightNumber : "Nenhuma"}
            </p>
            <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
              {activeFreight ? `${activeFreight.origin.city} ➔ ${activeFreight.destination.city}` : "Em espera"}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 transition-colors">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Meu Caixa</span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
              R$ {tripLogs.reduce((sum, l) => sum + (Number(l.value) || 0), 0).toFixed(2)}
            </p>
            <span className="text-[10px] font-mono text-gray-500 block mt-0.5">Despesas lançadas</span>
          </div>
        </div>

        {/* 3. TRIP WORKSPACE CONTAINER */}
        {!activeFreight ? (
          /* NO ACTIVE TRIP CASE */
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-sm transition-colors">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                <Compass className="w-8 h-8 animate-spin-slow" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">Pronto para a Estrada?</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Você não possui nenhuma viagem ativa registrada no momento. Ao iniciar uma viagem, o sistema criará o diário de bordo e notificará a gerência operacional da empresa em tempo real.
              </p>
              
              <button
                onClick={() => {
                  // Pre-select vehicle if driver already has one linked
                  if (currentDriver.vehicleId) {
                    setStartVehicleId(currentDriver.vehicleId);
                  }
                  setIsStartModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/30 transition-all uppercase tracking-wider cursor-pointer"
              >
                <Truck className="w-4.5 h-4.5" />
                Iniciar Nova Viagem
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE TRIP CASE */
          <div className="space-y-6">
            
            {/* TRIP STATUS BOARD */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5 text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                    Manifesto Ativo: {activeFreight.freightNumber}
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-wide mt-1">
                    {activeFreight.origin.city} ➔ {activeFreight.destination.city}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">
                    Iniciada em {activeFreight.date} às {activeFreight.departureTime} • KM Inicial: {activeFreight.mileage.start}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRecordDate(new Date().toISOString().split("T")[0]);
                      setRecordTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                      setIsRecordModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Registro
                  </button>

                  <button
                    onClick={() => {
                      setEndDate(new Date().toISOString().split("T")[0]);
                      setEndTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
                      // Prefill endKm based on vehicle's current mileage (must be equal or greater)
                      if (linkedTruck) {
                        setEndKm(String(linkedTruck.currentMileage));
                      } else {
                        setEndKm(String(activeFreight.mileage.start));
                      }
                      setIsEndModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider border border-red-500 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalizar Viagem
                  </button>
                </div>
              </div>
            </div>

            {/* TIMELINE & GALLERIES SPLIT WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* TIMELINE OF ACTIVE SHIPMENT */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 transition-colors shadow-xs">
                <h4 className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Linha do Tempo da Viagem (Diário de Bordo)
                </h4>

                {tripLogs.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 space-y-2">
                    <Info className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs">Nenhum evento registrado nesta viagem ainda.</p>
                    <p className="text-[10px] text-gray-400">Use o botão "Novo Registro" para adicionar despesas, paradas, carga ou fotos.</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-4 ml-2 space-y-6">
                    {tripLogs.map((log) => (
                      <div key={log.id} className="relative text-left">
                        {/* Timeline node icon indicator */}
                        <div className="absolute -left-[25px] top-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                          {getCategoryEmoji(log.category)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-gray-900 dark:text-white flex items-center gap-1.5 uppercase">
                              {log.description}
                              {log.value !== undefined && log.value > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  R$ {log.value.toFixed(2)}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                              {log.date} {log.time}
                            </span>
                          </div>

                          {log.location && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                              <MapPin className="w-3 h-3" />
                              {log.location}
                            </span>
                          )}

                          {log.notes && (
                            <p className="text-xs text-gray-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                              {log.notes}
                            </p>
                          )}

                          {log.photos && log.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1.5">
                              {log.photos.map((photo, pIdx) => (
                                <div 
                                  key={pIdx} 
                                  onClick={() => {
                                    setZoomPhotoUrl(photo);
                                    setZoomPhotoTitle(`${log.category} - ${log.date}`);
                                  }}
                                  className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer relative group"
                                >
                                  <img src={photo} alt="Evidência" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SAVED TRIP PHOTOS GALLERY */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 transition-colors shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Galeria de Fotos da Rota ({tripPhotos.length})
                  </h4>

                  {tripPhotos.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-gray-300" />
                      <p className="text-xs">Nenhuma foto salva ainda.</p>
                      <p className="text-[10px]">As fotos anexadas aos registros aparecerão aqui organizadas.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[320px] pr-1">
                      {tripPhotos.map((photo) => (
                        <div 
                          key={photo.id}
                          onClick={() => {
                            setZoomPhotoUrl(photo.photoUrl);
                            setZoomPhotoTitle(`${photo.category} - ${photo.date}`);
                          }}
                          className="aspect-square border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden cursor-pointer relative group shadow-sm bg-slate-50 dark:bg-slate-950"
                        >
                          <img src={photo.photoUrl} alt="Trip evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[8px] font-mono text-white p-1 truncate text-center">
                            {photo.category}
                          </div>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Helpful tips card */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 mt-6 text-left space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-black text-blue-600">Regra de Segurança</span>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Você não pode excluir ou alterar registros ou fotos após o envio. Todas as informações são homologadas pela auditoria da empresa.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ==================================================================
          MODALS ZONE
          ================================================================== */}
      
      {/* 1. START TRIP MODAL */}
      <AnimatePresence>
        {isStartModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-auto flex flex-col max-h-[calc(100vh-2rem)]"
            >
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Iniciar Nova Viagem (TMS)</h3>
                </div>
                <button 
                  onClick={() => setIsStartModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStartTripSubmit} className="flex-1 flex flex-col overflow-hidden text-left">
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  
                  {/* Select vehicle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Veículo / Caminhão *</label>
                    <select
                      value={startVehicleId}
                      onChange={(e) => setStartVehicleId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione o caminhão para a rota</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Cidade Origem *</label>
                      <input
                        type="text"
                        value={startOrigin}
                        onChange={(e) => setStartOrigin(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Cidade Destino *</label>
                      <input
                        type="text"
                        value={startDestination}
                        onChange={(e) => setStartDestination(e.target.value)}
                        placeholder="Ex: Salvador"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400">KM Inicial no Painel *</label>
                      <input
                        type="number"
                        value={startKm}
                        onChange={(e) => setStartKm(e.target.value)}
                        placeholder="Quilometragem inicial"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Hora Partida</label>
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-center outline-none"
                      />
                    </div>
                  </div>

                  {/* Photo uploads simulation */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400 block">Fotos Iniciais Obrigatórias</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Photo 1: Panel */}
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-center relative overflow-hidden flex flex-col justify-between h-32 bg-slate-50 dark:bg-slate-950">
                        {startPanelPhoto ? (
                          <>
                            <img src={startPanelPhoto} alt="Painel" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => setStartPanelPhoto("")}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="my-auto space-y-1">
                            <Camera className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-[10px] text-gray-500 font-bold block">Foto do Painel (KM)</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageFileChange(e, setStartPanelPhoto)}
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                          </div>
                        )}
                      </div>

                      {/* Photo 2: Front */}
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-center relative overflow-hidden flex flex-col justify-between h-32 bg-slate-50 dark:bg-slate-950">
                        {startFrontPhoto ? (
                          <>
                            <img src={startFrontPhoto} alt="Frente" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => setStartFrontPhoto("")}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="my-auto space-y-1">
                            <Camera className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-[10px] text-gray-500 font-bold block">Frente do Veículo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageFileChange(e, setStartFrontPhoto)}
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* PRESET SAMPLES QUICK SELECT */}
                  <div className="space-y-1.5 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-150/40">
                    <span className="text-[9px] uppercase font-mono font-black text-blue-600 block">⚡ Simulador de Fotos Rápido:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {PRESET_IMAGES.filter(img => img.type === "Painel" || img.type === "Frente").map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (img.type === "Painel") {
                              setStartPanelPhoto(img.url);
                              showMessage("success", "Painel preenchido com foto simulada.");
                            } else {
                              setStartFrontPhoto(img.url);
                              showMessage("success", "Frente preenchida com foto simulada.");
                            }
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-[10px] rounded-lg transition-all"
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Observações Iniciais</label>
                    <textarea
                      value={startNotes}
                      onChange={(e) => setStartNotes(e.target.value)}
                      placeholder="Observações de partida (ex: nível de combustível, estado geral)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500 h-16 resize-none"
                    />
                  </div>

                </div>

                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStartModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl uppercase tracking-wider"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    Iniciar Diário de Viagem 🚛
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD EVENT RECORD MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-xl overflow-hidden my-auto flex flex-col max-h-[calc(100vh-2rem)]"
            >
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Lançar Registro de Viagem</h3>
                </div>
                <button 
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordSubmit} className="flex-1 flex flex-col overflow-hidden text-left">
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  
                  {/* Category Type Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Tipo de Evento *</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["Abastecimento", "Troca de pneus", "Manutenção", "Carga", "Descarga", "Alimentação", "Hospedagem", "Pedágio", "Parada", "Observação", "Foto", "Outros"] as TripLog["category"][]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setRecordCategory(cat);
                            if (!recordDescription) {
                              setRecordDescription(cat);
                            }
                          }}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                            recordCategory === cat 
                              ? "bg-blue-600 border-blue-600 text-white" 
                              : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <span className="text-sm">{getCategoryEmoji(cat)}</span>
                          <span className="truncate max-w-[80px]">{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Descrição do Evento *</label>
                    <input
                      type="text"
                      value={recordDescription}
                      onChange={(e) => setRecordDescription(e.target.value)}
                      placeholder="Ex: Abastecimento de Diesel S10 150L"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Financial Value if needed */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Valor Gasto (R$, se aplicável)</label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        step="0.01"
                        value={recordValue}
                        onChange={(e) => setRecordValue(e.target.value)}
                        placeholder="Deixe em branco se não houver custos"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Location fetch GPS */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400 block">Localização (GPS)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={recordLocation}
                          onChange={(e) => setRecordLocation(e.target.value)}
                          placeholder="Cidade ou Coordenadas"
                          className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-3 text-xs outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleFetchGPSLocation}
                          className="p-3 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 rounded-xl border border-blue-150 flex items-center justify-center text-blue-600 dark:text-blue-400 cursor-pointer"
                          title="Capturar Localização GPS"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Hora do Registro</label>
                      <input
                        type="text"
                        value={recordTime}
                        onChange={(e) => setRecordTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-center outline-none"
                      />
                    </div>
                  </div>

                  {/* Photo attachments */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Comprovante / Foto do Registro</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden h-32 bg-slate-50 dark:bg-slate-950 flex flex-col justify-center">
                      {recordPhoto ? (
                        <>
                          <img src={recordPhoto} alt="Evidência" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => setRecordPhoto("")}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <Camera className="w-6 h-6 mx-auto text-gray-400 animate-pulse" />
                          <span className="text-[10px] text-gray-500 font-bold block">Tirar ou Anexar Foto</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageFileChange(e, setRecordPhoto)}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRESET SAMPLES QUICK SELECT */}
                  <div className="space-y-1.5 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-150/40">
                    <span className="text-[9px] uppercase font-mono font-black text-blue-600 block">⚡ Simulador de Recibo:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {PRESET_IMAGES.filter(img => img.type !== "Painel" && img.type !== "Frente").map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setRecordPhoto(img.url);
                            showMessage("success", `${img.label} simulada com sucesso.`);
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-[10px] rounded-lg transition-all"
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Notas / Observação</label>
                    <textarea
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      placeholder="Observações complementares importantes"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500 h-16 resize-none"
                    />
                  </div>

                </div>

                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl uppercase tracking-wider"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    Enviar Registro 📡
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. END TRIP MODAL */}
      <AnimatePresence>
        {isEndModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-auto flex flex-col max-h-[calc(100vh-2rem)]"
            >
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">Finalizar Viagem e Rota</h3>
                </div>
                <button 
                  onClick={() => setIsEndModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEndTripSubmit} className="flex-1 flex flex-col overflow-hidden text-left">
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-950 flex items-start gap-2.5">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Atenção:</strong> Ao finalizar a viagem, o seu diário de bordo será <strong>bloqueado permanentemente</strong>. Você não poderá adicionar novos registros ou fotos. Toda a quilometragem percorrida e custos serão consolidados no painel da empresa.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400 block">Km Inicial</label>
                      <input
                        type="text"
                        value={activeFreight?.mileage.start || 0}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-gray-500 font-black"
                        disabled
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400 block">KM Final no Painel *</label>
                      <input
                        type="number"
                        value={endKm}
                        onChange={(e) => setEndKm(e.target.value)}
                        placeholder="Quilometragem de chegada"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500 font-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Total KM Estimado</span>
                      <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                        {Math.max(0, Number(endKm) - (activeFreight?.mileage.start || 0))} KM
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Hora Chegada</label>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-center outline-none"
                      />
                    </div>
                  </div>

                  {/* Photo uploads simulation */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400 block">Fotos de Encerramento</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Photo 1: Panel */}
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-center relative overflow-hidden flex flex-col justify-between h-32 bg-slate-50 dark:bg-slate-950">
                        {endPanelPhoto ? (
                          <>
                            <img src={endPanelPhoto} alt="Painel final" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => setEndPanelPhoto("")}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="my-auto space-y-1">
                            <Camera className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-[10px] text-gray-500 font-bold block">Foto do Painel (KM)</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageFileChange(e, setEndPanelPhoto)}
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                          </div>
                        )}
                      </div>

                      {/* Photo 2: Front */}
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-center relative overflow-hidden flex flex-col justify-between h-32 bg-slate-50 dark:bg-slate-950">
                        {endVehiclePhoto ? (
                          <>
                            <img src={endVehiclePhoto} alt="Caminhão final" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              type="button" 
                              onClick={() => setEndVehiclePhoto("")}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="my-auto space-y-1">
                            <Camera className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-[10px] text-gray-500 font-bold block">Foto do Caminhão</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageFileChange(e, setEndVehiclePhoto)}
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* PRESET SAMPLES QUICK SELECT */}
                  <div className="space-y-1.5 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-150/40">
                    <span className="text-[9px] uppercase font-mono font-black text-blue-600 block">⚡ Simulador de Fotos Rápido:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {PRESET_IMAGES.filter(img => img.type === "Painel" || img.type === "Frente").map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (img.type === "Painel") {
                              setEndPanelPhoto(img.url);
                              showMessage("success", "Painel final preenchido com foto simulada.");
                            } else {
                              setEndVehiclePhoto(img.url);
                              showMessage("success", "Caminhão final preenchido com foto simulada.");
                            }
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-800 hover:border-blue-500 border border-slate-200 dark:border-slate-700 text-[10px] rounded-lg transition-all"
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-400">Observações de Fechamento</label>
                    <textarea
                      value={endNotes}
                      onChange={(e) => setEndNotes(e.target.value)}
                      placeholder="Relatório final da rota (ex: problemas na estrada, observações gerais)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs outline-none focus:border-blue-500 h-16 resize-none"
                    />
                  </div>

                </div>

                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEndModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl uppercase tracking-wider"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    Confirmar Encerramento 🏁
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. PHOTO LIGHTBOX ZOOM MODAL */}
      <AnimatePresence>
        {zoomPhotoUrl && (
          <div 
            onClick={() => setZoomPhotoUrl(null)}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 cursor-zoom-out select-none"
          >
            <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
              
              {/* Photo */}
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={zoomPhotoUrl}
                alt="Fullscreen evidence"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />

              {/* Title / Close indicators */}
              <div className="mt-4 text-center space-y-1">
                <p className="text-sm font-bold text-white uppercase tracking-wider">{zoomPhotoTitle}</p>
                <p className="text-xs text-slate-400 font-mono">Clique em qualquer lugar para fechar</p>
              </div>

              {/* Float Close button */}
              <button 
                onClick={() => setZoomPhotoUrl(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
