import React, { useState } from "react";
import { Tire, Vehicle, TireChange, TireRotation } from "../types";
import SessionAnnotations from "./SessionAnnotations";
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  Trash2,
  CheckCircle,
  Truck,
  RotateCw,
  Wrench,
  AlertTriangle,
  FileText,
  Percent,
  TrendingUp,
  Info,
  Clock,
  Settings,
  AlertCircle,
  ArrowRight,
  Edit2
} from "lucide-react";

interface TiresManagerProps {
  tires: Tire[];
  vehicles: Vehicle[];
  onAddTire: (t: Partial<Tire>) => Promise<boolean>;
  onUpdateTire: (id: string, t: Partial<Tire>) => Promise<boolean>;
  onDeleteTire: (id: string) => Promise<boolean>;
  onRecordChange: (id: string, payload: any) => Promise<boolean>;
  onRecordRotation: (id: string, payload: any) => Promise<boolean>;
}

const TIRE_POSITIONS = [
  "Dianteiro Esquerdo",
  "Dianteiro Direito",
  "Eixo 1 Esquerdo Interno",
  "Eixo 1 Esquerdo Externo",
  "Eixo 1 Direito Interno",
  "Eixo 1 Direito Externo",
  "Eixo 2 Esquerdo Interno",
  "Eixo 2 Esquerdo Externo",
  "Eixo 2 Direito Interno",
  "Eixo 2 Direito Externo",
  "Eixo 3 Esquerdo Interno",
  "Eixo 3 Esquerdo Externo",
  "Eixo 3 Direito Interno",
  "Eixo 3 Direito Externo",
  "Estepe"
];

const TIRE_BRANDS = [
  "Michelin",
  "Goodyear",
  "Bridgestone",
  "Pirelli",
  "Firestone",
  "Continental",
  "Linglong",
  "XBRI"
];

const TIRE_SIZES = [
  "295/80 R22.5",
  "275/80 R22.5",
  "215/75 R17.5",
  "315/80 R22.5",
  "235/75 R17.5"
];

export default function TiresManager({
  tires,
  vehicles,
  onAddTire,
  onUpdateTire,
  onDeleteTire,
  onRecordChange,
  onRecordRotation
}: TiresManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [vehicleFilter, setVehicleFilter] = useState("TODOS");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Selection for active tire inspection
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);

  // Modal open states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);

  // Se preenchido, o modal de cadastro funciona em modo edição (atualiza em vez de criar)
  const [editingTireId, setEditingTireId] = useState<string | null>(null);

  // New Tire Form state
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [newBrand, setNewBrand] = useState("Michelin");
  const [newModel, setNewModel] = useState("");
  const [newSize, setNewSize] = useState("295/80 R22.5");
  const [newStatus, setNewStatus] = useState<Tire["status"]>("Estoque");
  const [newVehicleId, setNewVehicleId] = useState("");
  const [newPosition, setNewPosition] = useState("Dianteiro Esquerdo");
  const [newMileage, setNewMileage] = useState("");
  const [newEstimatedLife, setNewEstimatedLife] = useState("100000");

  // Tire Change Form state
  const [changeType, setChangeType] = useState<"Instalação" | "Remoção" | "Reparo" | "Recapagem" | "Descarte">("Instalação");
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split("T")[0]);
  const [changeKm, setChangeKm] = useState("");
  const [changeVehicleId, setChangeVehicleId] = useState("");
  const [changePosition, setChangePosition] = useState("Dianteiro Esquerdo");
  const [changeDescription, setChangeDescription] = useState("");
  const [changeCost, setChangeCost] = useState("");

  // Tire Rotation Form state
  const [rotDate, setRotDate] = useState(new Date().toISOString().split("T")[0]);
  const [rotKm, setRotKm] = useState("");
  const [rotToPosition, setRotToPosition] = useState("Dianteiro Direito");
  const [rotDescription, setRotDescription] = useState("");

  // Filtered Tires list
  const filteredTires = tires.filter((t) => {
    const matchesSearch =
      t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "TODOS" || t.status === statusFilter;
    const matchesVehicle =
      vehicleFilter === "TODOS" ||
      (t.status === "Em uso" && t.vehicleId === vehicleFilter);
    return matchesSearch && matchesStatus && matchesVehicle;
  });

  // Calculate high-level KPIs
  const totalTires = tires.length;
  const inUseTires = tires.filter((t) => t.status === "Em uso").length;
  const inStockTires = tires.filter((t) => t.status === "Estoque").length;
  const inRecapTires = tires.filter((t) => t.status === "Recapagem").length;
  
  // A tire is worn out/careca if its current mileage is near/above estimated life
  const criticalTires = tires.filter(
    (t) => t.status === "Em uso" && t.currentMileage >= t.estimatedLife * 0.85
  ).length;

  // Resumo: quantidade de pneus por marca + modelo (categoria)
  const tiresByBrandModel = Object.values(
    tires.reduce((acc: Record<string, { brand: string; model: string; quantity: number }>, t) => {
      const key = `${t.brand}__${t.model}`;
      acc[key] = acc[key] || { brand: t.brand, model: t.model, quantity: 0 };
      acc[key].quantity += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.quantity - a.quantity);

  const handleOpenAdd = () => {
    setEditingTireId(null);
    setNewSerialNumber("");
    setNewModel("");
    setNewBrand("Michelin");
    setNewSize("295/80 R22.5");
    setNewStatus("Estoque");
    setNewVehicleId(vehicles[0]?.id || "");
    setNewPosition("Dianteiro Esquerdo");
    setNewMileage("");
    setNewEstimatedLife("100000");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tire: Tire) => {
    setEditingTireId(tire.id);
    setNewSerialNumber(tire.serialNumber);
    setNewModel(tire.model);
    setNewBrand(tire.brand);
    setNewSize(tire.size);
    setNewStatus(tire.status);
    setNewVehicleId(tire.vehicleId || vehicles[0]?.id || "");
    setNewPosition(tire.position || "Dianteiro Esquerdo");
    setNewMileage(String(tire.currentMileage || ""));
    setNewEstimatedLife(String(tire.estimatedLife || "100000"));
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerialNumber || !newModel || !newEstimatedLife) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const normalizedSerial = newSerialNumber.trim().toUpperCase();
    const duplicate = tires.find(t => t.serialNumber.toUpperCase() === normalizedSerial && t.id !== editingTireId);
    if (duplicate) {
      alert(`Já existe um pneu cadastrado com o código de controle "${normalizedSerial}" (${duplicate.brand} ${duplicate.model}). Cada pneu deve ter um código único — não é permitido reutilizar o código de outro pneu.`);
      return;
    }

    const payload: Partial<Tire> = {
      serialNumber: newSerialNumber.toUpperCase(),
      brand: newBrand,
      model: newModel,
      size: newSize,
      status: newStatus,
      currentMileage: Number(newMileage) || 0,
      estimatedLife: Number(newEstimatedLife) || 100000
    };

    if (newStatus === "Em uso") {
      payload.vehicleId = newVehicleId;
      payload.position = newPosition;
    }

    const ok = editingTireId
      ? await onUpdateTire(editingTireId, payload)
      : await onAddTire({ ...payload, changesHistory: [], rotationsHistory: [] });

    if (ok) {
      setIsAddModalOpen(false);
      setEditingTireId(null);
    }
  };

  const handleOpenChangeModal = (tire: Tire) => {
    setSelectedTire(tire);
    setChangeType(tire.status === "Em uso" ? "Remoção" : "Instalação");
    setChangeDate(new Date().toISOString().split("T")[0]);
    setChangeKm(tire.currentMileage.toString());
    setChangeVehicleId(vehicles[0]?.id || "");
    setChangePosition("Dianteiro Esquerdo");
    setChangeDescription("");
    setChangeCost("");
    setIsChangeModalOpen(true);
  };

  const handleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTire) return;

    if (changeType === "Instalação" && !changeVehicleId) {
      alert("Selecione o veículo para instalação.");
      return;
    }

    const payload = {
      date: changeDate,
      type: changeType,
      km: Number(changeKm) || selectedTire.currentMileage,
      vehicleId: changeType === "Instalação" ? changeVehicleId : undefined,
      position: changeType === "Instalação" ? changePosition : undefined,
      description: changeDescription,
      cost: Number(changeCost) || 0
    };

    const ok = await onRecordChange(selectedTire.id, payload);
    if (ok) {
      setIsChangeModalOpen(false);
      // Refresh selected tire info to show update
      const updatedTire = tires.find(t => t.id === selectedTire.id);
      setSelectedTire(updatedTire || null);
    }
  };

  const handleOpenRotationModal = (tire: Tire) => {
    setSelectedTire(tire);
    setRotDate(new Date().toISOString().split("T")[0]);
    setRotKm(tire.currentMileage.toString());
    setRotToPosition("Dianteiro Direito");
    setRotDescription("");
    setIsRotationModalOpen(true);
  };

  const handleRotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTire) return;

    const payload = {
      date: rotDate,
      km: Number(rotKm) || selectedTire.currentMileage,
      fromPosition: selectedTire.position || "Não informada",
      toPosition: rotToPosition,
      description: rotDescription
    };

    const ok = await onRecordRotation(selectedTire.id, payload);
    if (ok) {
      setIsRotationModalOpen(false);
      const updatedTire = tires.find(t => t.id === selectedTire.id);
      setSelectedTire(updatedTire || null);
    }
  };

  const handleDeleteTire = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId(curr => curr === id ? null : curr);
      }, 4000);
      return;
    }
    const ok = await onDeleteTire(id);
    if (ok) {
      setSelectedTire(null);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div id="modulo-pneus-container" className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Total de Pneus</span>
          <p className="text-xl font-black text-gray-900 mt-1">{totalTires}</p>
          <span className="text-[9px] text-gray-500 font-medium">Cadastrados no ERP</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Pneus em Uso</span>
          <p className="text-xl font-black text-blue-600 mt-1">{inUseTires}</p>
          <span className="text-[9px] text-gray-500 font-medium">Instalados na frota</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Pneus em Estoque</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{inStockTires}</p>
          <span className="text-[9px] text-gray-500 font-medium">Prontos para instalação</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Em Recapagem</span>
          <p className="text-xl font-black text-purple-600 mt-1">{inRecapTires}</p>
          <span className="text-[9px] text-gray-500 font-medium">Renovando banda</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Alerta de Desgaste</span>
          <p className="text-xl font-black text-red-650 mt-1 flex items-center gap-1.5">
            {criticalTires}
            {criticalTires > 0 && <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />}
          </p>
          <span className="text-[9px] text-gray-500 font-medium">Vida útil acima de 85%</span>
        </div>
      </div>

      {/* Resumo por Marca / Modelo (Categoria) */}
      {tiresByBrandModel.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-3">
            Quantidade por Marca / Modelo
          </span>
          <div className="flex flex-wrap gap-2">
            {tiresByBrandModel.map((item) => (
              <div
                key={`${item.brand}-${item.model}`}
                className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg pl-3 pr-2 py-1.5"
              >
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.brand} {item.model}</span>
                <span className="text-[11px] font-black font-mono bg-blue-600 text-white rounded px-1.5 py-0.5">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Search & Filter Panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pneu por serial, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
            />
          </div>

          {/* Status filters */}
          <div className="flex gap-1.5 flex-wrap">
            {["TODOS", "Em uso", "Estoque", "Recapagem", "Descartado"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === status
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Vehicle filter */}
          <div className="w-full sm:w-auto">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-600 rounded-lg px-2.5 py-1.5 text-xs outline-none hover:bg-gray-100 transition-all cursor-pointer font-semibold"
            >
              <option value="TODOS">Todos Veículos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.plate}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          Cadastrar Novo Pneu
        </button>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tires List - Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTires.map((t) => {
              const wearPercent = Math.min((t.currentMileage / t.estimatedLife) * 100, 100);
              const remainingLife = Math.max(t.estimatedLife - t.currentMileage, 0);
              const activeVehicle = vehicles.find((v) => v.id === t.vehicleId);

              // Colors based on wear level
              let progressColor = "bg-emerald-500";
              let textWearColor = "text-emerald-600";
              if (wearPercent >= 85) {
                progressColor = "bg-red-600 animate-pulse";
                textWearColor = "text-red-600 font-bold";
              } else if (wearPercent >= 60) {
                progressColor = "bg-amber-500";
                textWearColor = "text-amber-600 font-bold";
              }

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTire(t)}
                  className={`bg-white border p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all relative ${
                    selectedTire?.id === t.id ? "ring-2 ring-blue-500 border-transparent bg-blue-50/10" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold border border-gray-150">
                        {t.serialNumber}
                      </span>
                      <h4 className="text-xs font-black text-gray-900 mt-2 font-sans">
                        {t.brand} - {t.model}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.size}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border font-mono ${
                        t.status === "Em uso" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400" :
                        t.status === "Estoque" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400" :
                        t.status === "Recapagem" ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400" :
                        "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Vehicle context */}
                  {t.status === "Em uso" && activeVehicle ? (
                    <div className="mt-3 flex items-center gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100/30 text-xs">
                      <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div className="truncate flex-1">
                        <p className="font-bold text-gray-800 leading-none">{activeVehicle.plate}</p>
                        <p className="text-[9px] text-gray-500 mt-0.5 leading-none">{t.position}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 h-8 flex items-center justify-center bg-gray-50/50 p-2 rounded-lg border border-dashed border-gray-200 text-[10px] text-gray-400 font-medium">
                      Pneu fora de operação
                    </div>
                  )}

                  {/* Wear and Life bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400">Desgaste:</span>
                      <span className={textWearColor}>{wearPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor}`} style={{ width: `${wearPercent}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-gray-400">
                      <span>Rodado: {t.currentMileage.toLocaleString()} km</span>
                      <span>Vida útil: {t.estimatedLife.toLocaleString()} km</span>
                    </div>
                  </div>

                  {/* Highlight worn limit icon */}
                  {wearPercent >= 85 && (
                    <div className="absolute right-3 top-16 text-red-500" title="Troca recomendada!">
                      <AlertCircle className="w-5 h-5 animate-bounce" />
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTires.length === 0 && (
              <div className="col-span-2 text-center py-20 bg-white border border-gray-200 rounded-xl">
                <p className="text-gray-400 text-xs font-medium">Nenhum pneu correspondente aos filtros de busca.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tire Inspection Dashboard Detail Panel - Right Column */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6 self-start">
          {selectedTire ? (
            <div className="space-y-6">
              {/* Header details */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Pneu Selecionado</span>
                  <h3 className="text-base font-black text-gray-900 mt-0.5">{selectedTire.brand} {selectedTire.model}</h3>
                  <span className="text-xs font-mono font-bold text-blue-600">{selectedTire.serialNumber}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(selectedTire)}
                    className="p-1.5 transition-all duration-300 rounded border flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    title="Editar cadastro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTire(selectedTire.id)}
                    className={`p-1.5 transition-all duration-300 rounded border flex items-center gap-1 text-xs font-semibold ${
                      confirmDeleteId === selectedTire.id
                        ? "bg-amber-500 text-white border-amber-600 px-2.5 animate-pulse"
                        : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    }`}
                    title={confirmDeleteId === selectedTire.id ? "Confirmar exclusão" : "Excluir cadastro"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDeleteId === selectedTire.id && "Confirmar?"}
                  </button>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <span className="text-[9px] font-mono uppercase text-gray-400 tracking-wide block">Quilometragem</span>
                  <p className="text-xs font-mono font-bold text-gray-800 mt-0.5">{selectedTire.currentMileage.toLocaleString()} km</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <span className="text-[9px] font-mono uppercase text-gray-400 tracking-wide block">Vida Útil Estimada</span>
                  <p className="text-xs font-mono font-bold text-gray-800 mt-0.5">{selectedTire.estimatedLife.toLocaleString()} km</p>
                </div>
              </div>

              {/* Maintenance Control Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Ações de Manutenção</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenChangeModal(selectedTire)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all border border-slate-200"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Troca / Log
                  </button>

                  <button
                    onClick={() => handleOpenRotationModal(selectedTire)}
                    disabled={selectedTire.status !== "Em uso"}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rodízio
                  </button>
                </div>
              </div>

              {/* History Timeline */}
              <div className="space-y-3.5 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Histórico de Vida do Pneu
                </h4>

                <div className="relative border-l border-gray-200 pl-4 ml-2 space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {/* Changes History */}
                  {selectedTire.changesHistory?.map((ch) => (
                    <div key={ch.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
                      <div className="font-medium text-gray-850">
                        <span className="font-bold text-gray-900">{ch.type}</span>
                        <span className="text-gray-400 text-[10px] font-mono ml-2">{ch.date}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{ch.description}</p>
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5">Km Veículo: {ch.km.toLocaleString()} km</p>
                    </div>
                  ))}

                  {/* Rotations History */}
                  {selectedTire.rotationsHistory?.map((rot) => (
                    <div key={rot.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                      <div className="font-medium text-gray-850">
                        <span className="font-bold text-gray-950">Rodízio de Pneu</span>
                        <span className="text-gray-400 text-[10px] font-mono ml-2">{rot.date}</span>
                      </div>
                      <div className="text-[10px] text-gray-600 flex items-center gap-1.5 mt-0.5 font-semibold">
                        <span>{rot.fromPosition}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{rot.toPosition}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{rot.description}</p>
                      <p className="text-[9px] font-mono text-gray-400 mt-0.5">Km: {rot.km.toLocaleString()} km</p>
                    </div>
                  ))}

                  {(!selectedTire.changesHistory?.length && !selectedTire.rotationsHistory?.length) && (
                    <p className="text-gray-400 text-[11px] italic">Nenhum evento registrado na vida deste pneu.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <Info className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs font-semibold font-sans">Selecione um pneu para ver sua ficha detalhada, histórico e operações de manutenção.</p>
            </div>
          )}
        </div>
      </div>

      <SessionAnnotations moduleKey="tires" title="Anotações & Prints de Pneus" />

      {/* CREATE NEW TIRE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              {editingTireId ? "Editar Pneu" : "Cadastrar Novo Pneu Individual"}
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Código de Controle (Serial / DOT) *</label>
                <input
                  type="text"
                  required
                  placeholder="EX: DOT-MICH-2025"
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none uppercase font-mono"
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Código único de identificação do pneu — não pode ser reutilizado em outro pneu.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Marca *</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    {TIRE_BRANDS.map((b) => (
                      <option key={b} value={b} className="dark:bg-slate-950">{b}</option>
                    ))}
                    <option value="Outra" className="dark:bg-slate-950">Outra</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Modelo Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: X Multi T2"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Dimensão *</label>
                  <select
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    {TIRE_SIZES.map((s) => (
                      <option key={s} value={s} className="dark:bg-slate-950">{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Vida Útil Estimada (km) *</label>
                  <input
                    type="number"
                    required
                    value={newEstimatedLife}
                    onChange={(e) => setNewEstimatedLife(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Km Rodado Inicial</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Estado do Pneu *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="Estoque" className="dark:bg-slate-950">Estoque (Pronto)</option>
                    <option value="Em uso" className="dark:bg-slate-950">Instalado (Em uso)</option>
                    <option value="Recapagem" className="dark:bg-slate-950">Recapagem</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Vehicle Allocation if status is selected as "Em uso" */}
              {newStatus === "Em uso" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-150 dark:border-slate-800 pt-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Veículo Alvo *</label>
                    <select
                      value={newVehicleId}
                      onChange={(e) => setNewVehicleId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id} className="dark:bg-slate-950">
                          {v.brand} {v.plate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Posição de Instalação *</label>
                    <select
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                    >
                      {TIRE_POSITIONS.map((pos) => (
                        <option key={pos} value={pos} className="dark:bg-slate-950">{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingTireId(null); }}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  {editingTireId ? "Salvar Alterações" : "Cadastrar Pneu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIRE CHANGE / MAINTENANCE LOG MODAL */}
      {isChangeModalOpen && selectedTire && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              Log de Troca ou Manutenção do Pneu
            </h3>

            <form onSubmit={handleChangeSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Tipo de Evento *</label>
                  <select
                    value={changeType}
                    onChange={(e) => setChangeType(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-bold"
                  >
                    {selectedTire.status !== "Em uso" && <option value="Instalação" className="dark:bg-slate-950">Instalação em Veículo</option>}
                    {selectedTire.status === "Em uso" && <option value="Remoção" className="dark:bg-slate-950">Remoção para Estoque</option>}
                    <option value="Reparo" className="dark:bg-slate-950">Reparo (Vulcanização / Conserto)</option>
                    <option value="Recapagem" className="dark:bg-slate-950">Enviar para Recapagem</option>
                    <option value="Descarte" className="dark:bg-slate-950">Descartar Definitivamente</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data *</label>
                  <input
                    type="date"
                    required
                    value={changeDate}
                    onChange={(e) => setChangeDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Conditional Install parameters */}
              {changeType === "Instalação" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Veículo Alvo *</label>
                    <select
                      value={changeVehicleId}
                      onChange={(e) => setChangeVehicleId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                    >
                      <option value="" className="dark:bg-slate-950">Selecione...</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id} className="dark:bg-slate-950">
                          {v.brand} {v.plate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Posição *</label>
                    <select
                      value={changePosition}
                      onChange={(e) => setChangePosition(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                    >
                      {TIRE_POSITIONS.map((p) => (
                        <option key={p} value={p} className="dark:bg-slate-950">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Quilometragem (km) *</label>
                  <input
                    type="number"
                    required
                    value={changeKm}
                    onChange={(e) => setChangeKm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Custo do Evento (R$)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={changeCost}
                    onChange={(e) => setChangeCost(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Observações / Detalhes *</label>
                <textarea
                  required
                  placeholder="Descreva detalhes como km do veículo na troca, posto ou marca da recapagem executada."
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsChangeModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Salvar Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIRE ROTATION MODAL */}
      {isRotationModalOpen && selectedTire && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              Registrar Rodízio de Pneus
            </h3>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 text-[10px] rounded-lg border border-amber-200 dark:border-amber-900/40 mb-4 font-semibold flex-shrink-0">
              Esta ação registrará a mudança de posição deste pneu no veículo atual, mantendo um log no histórico de rotação de ativos.
            </div>

            <form onSubmit={handleRotationSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data do Rodízio *</label>
                  <input
                    type="date"
                    required
                    value={rotDate}
                    onChange={(e) => setRotDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Quilometragem do Carro *</label>
                  <input
                    type="number"
                    required
                    value={rotKm}
                    onChange={(e) => setRotKm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Posição Atual</label>
                  <input
                    type="text"
                    disabled
                    value={selectedTire.position || "Sem posição"}
                    className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none text-gray-500 dark:text-gray-400 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Nova Posicao do Pneu *</label>
                  <select
                    value={rotToPosition}
                    onChange={(e) => setRotToPosition(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    {TIRE_POSITIONS.filter(pos => pos !== selectedTire.position).map((pos) => (
                      <option key={pos} value={pos} className="dark:bg-slate-950">{pos}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Descrição / Motivação *</label>
                <textarea
                  required
                  placeholder="EX: Rodízio preventivo para igualar o desgaste do par de eixos dianteiros."
                  value={rotDescription}
                  onChange={(e) => setRotDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRotationModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Confirmar Rodízio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
