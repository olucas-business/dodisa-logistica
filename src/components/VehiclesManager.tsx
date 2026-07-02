import React, { useState } from "react";
import { Vehicle, MaintenanceRecord, VehicleDocument } from "../types";
import { Truck, Plus, Eye, Calendar, Search, AlertTriangle, Trash2, Edit2, CheckCircle, FileText, Settings, Hammer, Upload, Download } from "lucide-react";

interface VehiclesManagerProps {
  vehicles: Vehicle[];
  onAddVehicle: (v: Partial<Vehicle>) => Promise<boolean>;
  onUpdateVehicle: (id: string, v: Partial<Vehicle>) => Promise<boolean>;
  onDeleteVehicle: (id: string) => Promise<boolean>;
}

export default function VehiclesManager({
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}: VehiclesManagerProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0] || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  // Maintenance log form state
  const [isMaintFormOpen, setIsMaintFormOpen] = useState(false);
  const [maintType, setMaintType] = useState("Oficina");
  const [maintKm, setMaintKm] = useState("");
  const [maintValue, setMaintValue] = useState("");
  const [maintDesc, setMaintDesc] = useState("");
  const [maintDate, setMaintDate] = useState("2026-06-23");

  // Vehicle form states
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("Carreta");
  const [loadCapacity, setLoadCapacity] = useState("");
  const [tankCapacity, setTankCapacity] = useState("");
  const [averageConsumption, setAverageConsumption] = useState("");
  const [renavam, setRenavam] = useState("");
  const [chassi, setChassi] = useState("");
  const [licensingExpiration, setLicensingExpiration] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [nextMaintenance, setNextMaintenance] = useState("");

  const resetForm = () => {
    setPlate("");
    setModel("");
    setBrand("");
    setYear("");
    setType("Carreta");
    setLoadCapacity("");
    setTankCapacity("");
    setAverageConsumption("");
    setRenavam("");
    setChassi("");
    setLicensingExpiration("");
    setCurrentMileage("");
    setNextMaintenance("");
    setIsEditMode(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setPlate(v.plate);
    setModel(v.model);
    setBrand(v.brand);
    setYear(v.year);
    setType(v.type);
    setLoadCapacity(v.loadCapacity);
    setTankCapacity(v.tankCapacity);
    setAverageConsumption(v.averageConsumption);
    setRenavam(v.renavam);
    setChassi(v.chassi);
    setLicensingExpiration(v.licensingExpiration);
    setCurrentMileage(String(v.currentMileage || ""));
    setNextMaintenance(String(v.nextMaintenance || ""));
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model || !brand || !currentMileage || !nextMaintenance) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const payload = {
      plate,
      model,
      brand,
      year,
      type,
      loadCapacity,
      tankCapacity,
      averageConsumption,
      renavam,
      chassi,
      licensingExpiration,
      currentMileage: Number(currentMileage) || 0,
      nextMaintenance: Number(nextMaintenance) || 0,
      photo: ""
    };

    if (isEditMode && selectedVehicle) {
      const ok = await onUpdateVehicle(selectedVehicle.id, payload);
      if (ok) {
        setIsFormOpen(false);
        setSelectedVehicle({ ...selectedVehicle, ...payload });
      }
    } else {
      const ok = await onAddVehicle(payload);
      if (ok) {
        setIsFormOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId(curr => curr === id ? null : curr);
      }, 4000);
      return;
    }
    const ok = await onDeleteVehicle(id);
    if (ok) {
      setSelectedVehicle(vehicles[0] || null);
    }
    setConfirmDeleteId(null);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVehicle) return;
    setDocUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, fileName: file.name, folder: "vehicle-documents" })
        });
        const data = await res.json();
        if (data.success) {
          const newDoc: VehicleDocument = {
            id: `doc_${Date.now()}`,
            name: file.name,
            url: data.url,
            uploadedAt: new Date().toISOString().split("T")[0]
          };
          const updatedDocs = [...(selectedVehicle.documents || []), newDoc];
          const ok = await onUpdateVehicle(selectedVehicle.id, { documents: updatedDocs });
          if (ok) setSelectedVehicle({ ...selectedVehicle, documents: updatedDocs });
        }
      } finally {
        setDocUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocDelete = async (docId: string) => {
    if (!selectedVehicle) return;
    const updatedDocs = (selectedVehicle.documents || []).filter(d => d.id !== docId);
    const ok = await onUpdateVehicle(selectedVehicle.id, { documents: updatedDocs });
    if (ok) setSelectedVehicle({ ...selectedVehicle, documents: updatedDocs });
  };

  // Record a new maintenance log in history
  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !maintKm || !maintValue || !maintDesc) {
      alert("Por favor, preencha todos os campos da manutenção.");
      return;
    }

    const newLog: MaintenanceRecord = {
      date: maintDate,
      km: Number(maintKm),
      type: maintType,
      description: maintDesc,
      value: Number(maintValue)
    };

    const updatedHistory = [...(selectedVehicle.maintenanceHistory || []), newLog];
    
    // Auto-update current mileage if maintenance mileage is higher
    const newMileage = Math.max(selectedVehicle.currentMileage, Number(maintKm));
    
    // Set next maintenance as current + 10,000 as typical standard
    const newNextMaint = newMileage + 10000;

    const payload = {
      ...selectedVehicle,
      currentMileage: newMileage,
      nextMaintenance: newNextMaint,
      maintenanceHistory: updatedHistory
    };

    const ok = await onUpdateVehicle(selectedVehicle.id, payload);
    if (ok) {
      // Also register this maintenance as an expense in our database
      try {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: maintDate,
            category: maintType === "Oficina" ? "Oficina" : maintType === "Pneus" ? "Pneus" : "Outros",
            value: Number(maintValue),
            description: `Manutenção Preventiva (${maintDesc}) - Placa ${selectedVehicle.plate}`,
            receipt: ""
          })
        });
      } catch (err) {
        console.error("Erro ao registrar despesa de manutenção:", err);
      }

      setIsMaintFormOpen(false);
      setSelectedVehicle(payload);
      // Clean form
      setMaintKm("");
      setMaintValue("");
      setMaintDesc("");
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check alerting levels for selected vehicle
  const isMaintenanceDue = selectedVehicle && selectedVehicle.nextMaintenance - selectedVehicle.currentMileage <= 1000;
  const isLicensingDue = selectedVehicle && (() => {
    const exp = new Date(selectedVehicle.licensingExpiration);
    const cur = new Date("2026-06-23");
    return exp.getTime() - cur.getTime() < 15 * 24 * 60 * 60 * 1000;
  })();

  return (
    <div id="modulo-veiculos-container" className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          Adicionar Novo Veículo
        </button>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Vehicles List */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[550px]">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-xs text-gray-700 uppercase tracking-wider">
            Frota Cadastrada ({filteredVehicles.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredVehicles.map((v) => {
              const isSelected = selectedVehicle?.id === v.id;
              const dueMaint = v.nextMaintenance - v.currentMileage <= 1000;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-all flex justify-between items-center ${
                    isSelected ? "bg-blue-50/60 border-l-4 border-blue-600 pl-3" : ""
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <p className="font-bold text-gray-950 text-xs flex items-center gap-1.5">
                      {v.brand} {v.model}
                      {dueMaint && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Manutenção preventiva próxima" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">Placa: {v.plate}</p>
                    <p className="text-[10px] text-gray-500">KM Atual: {v.currentMileage.toLocaleString("pt-BR")}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full font-mono text-[9px] font-bold text-gray-600">
                    {v.type}
                  </span>
                </div>
              );
            })}
            {filteredVehicles.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
                <p className="text-xs">Nenhum veículo cadastrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Vehicle Technical File */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVehicle ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">
                      {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 bg-gray-250 text-gray-850 font-mono font-bold rounded text-[10px] uppercase">{selectedVehicle.plate}</span>
                      • Chassi: {selectedVehicle.chassi || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenEdit(selectedVehicle)}
                    className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Ficha
                  </button>
                  <button
                    onClick={() => handleDelete(selectedVehicle.id)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 ${
                      confirmDeleteId === selectedVehicle.id
                        ? "bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white animate-pulse"
                        : "bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDeleteId === selectedVehicle.id ? "Confirmar Exclusão?" : "Excluir"}
                  </button>
                </div>
              </div>

              {/* Maintenance & Licensing Alert triggers */}
              {(isMaintenanceDue || isLicensingDue) && (
                <div className="space-y-2">
                  {isMaintenanceDue && (
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Manutenção Preventiva Requerida!</p>
                        <p className="text-gray-600">KM Atual: {selectedVehicle.currentMileage.toLocaleString()} KM | Limite Preventivo: {selectedVehicle.nextMaintenance.toLocaleString()} KM. Agendar troca de filtros e óleos.</p>
                      </div>
                    </div>
                  )}
                  {isLicensingDue && (
                    <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">Licenciamento Próximo ao Vencimento!</p>
                        <p className="text-gray-600">O licenciamento vence em {selectedVehicle.licensingExpiration}. Risco de multa e bloqueio de circulação do veículo.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Indicators (4x) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <Settings className="w-5 h-5 text-blue-600 mx-auto mb-2 animate-spin-slow" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Quilometragem</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {selectedVehicle.currentMileage.toLocaleString("pt-BR")} KM
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <Hammer className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Próxima Manutenção</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {selectedVehicle.nextMaintenance.toLocaleString("pt-BR")} KM
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <FileText className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Consumo Médio</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {selectedVehicle.averageConsumption} KM/L
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Licenciamento</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {selectedVehicle.licensingExpiration}
                  </p>
                </div>
              </div>

              {/* Technical file details */}
              <div className="bg-gray-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-xl p-4 space-y-4 text-xs">
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider border-b border-gray-250 dark:border-slate-800 pb-2">
                  Especificações Técnicas do Veículo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-gray-500 dark:text-gray-400">Placa: <strong className="text-gray-850 dark:text-slate-200 font-mono font-normal uppercase">{selectedVehicle.plate}</strong></p>
                      <p className="text-gray-500 dark:text-gray-400">Marca: <strong className="text-gray-850 dark:text-slate-200 font-normal">{selectedVehicle.brand}</strong></p>
                      <p className="text-gray-500 dark:text-gray-400">Modelo: <strong className="text-gray-850 dark:text-slate-200 font-normal">{selectedVehicle.model}</strong></p>
                      <p className="text-gray-500 dark:text-gray-400">Ano de Fabricação: <strong className="text-gray-850 dark:text-slate-200 font-normal">{selectedVehicle.year}</strong></p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-gray-500 dark:text-gray-400">Tipo de Veículo: <strong className="text-gray-850 dark:text-slate-200 font-normal">{selectedVehicle.type}</strong></p>
                      <p className="text-gray-500 dark:text-gray-400">Capacidade de Carga: <strong className="text-gray-850 dark:text-slate-200 font-normal">{selectedVehicle.loadCapacity}</strong></p>
                      <p className="text-gray-500 dark:text-gray-400">Capacidade do Tanque: <strong className="text-gray-850 dark:text-slate-200 font-normal">{selectedVehicle.tankCapacity} Litros</strong></p>
                      <p className="text-gray-500 dark:text-gray-400">Renavam: <strong className="text-gray-850 dark:text-slate-200 font-mono font-normal">{selectedVehicle.renavam || "N/A"}</strong></p>
                    </div>
                  </div>
                  
                  {/* High Quality Real Photo Card with Hover zoom, overlay gradient, and elegant frame */}
                  <div className="md:col-span-4 relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-950 h-28">
                    <img
                      src={
                        selectedVehicle.type?.toLowerCase().includes("van") ? "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=300" :
                        selectedVehicle.type?.toLowerCase().includes("tanque") ? "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&q=80&w=300" :
                        selectedVehicle.type?.toLowerCase().includes("baú") || selectedVehicle.type?.toLowerCase().includes("caminhão") ? "https://images.unsplash.com/photo-1516541196182-6bbe0b89cd23?auto=format&fit=crop&q=80&w=300" :
                        "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=300"
                      }
                      alt={selectedVehicle.model}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=300";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[8px] font-mono font-black text-white px-1.5 py-0.5 rounded bg-blue-600/80 uppercase tracking-wider">
                      FROTA ATIVA
                    </span>
                  </div>
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Histórico de Manutenções</h4>
                  <button
                    onClick={() => setIsMaintFormOpen(true)}
                    className="px-2.5 py-1 bg-gray-900 hover:bg-gray-850 text-white font-mono text-[10px] rounded transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar Oficina
                  </button>
                </div>

                <div className="border border-gray-150 rounded-xl overflow-x-auto max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 pl-4">Data</th>
                        <th className="p-2.5">KM Oficina</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5">Descrição</th>
                        <th className="p-2.5 text-right pr-4">Custo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedVehicle.maintenanceHistory?.map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-2.5 pl-4 font-mono text-gray-600">{log.date}</td>
                          <td className="p-2.5 font-mono text-gray-600">{log.km.toLocaleString()} KM</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === "Oficina" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="p-2.5 text-gray-600 font-sans italic">{log.description}</td>
                          <td className="p-2.5 text-right font-bold pr-4 text-red-600">
                            R$ {log.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                      {(!selectedVehicle.maintenanceHistory || selectedVehicle.maintenanceHistory.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400 italic">Nenhum registro de manutenção preventiva para este veículo.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vehicle Documents */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Documentos do Caminhão</h4>
                  <label className="px-2.5 py-1 bg-gray-900 hover:bg-gray-850 text-white font-mono text-[10px] rounded transition-all flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> {docUploading ? "Enviando..." : "Enviar Documento"}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleDocUpload} disabled={docUploading} />
                  </label>
                </div>
                <div className="space-y-1.5">
                  {(selectedVehicle.documents || []).length === 0 ? (
                    <p className="text-center py-4 text-xs text-gray-400 italic border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                      Nenhum documento anexado (CRLV, licenciamento, apólice de seguro, etc).
                    </p>
                  ) : (
                    selectedVehicle.documents!.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-150 dark:border-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs font-semibold truncate">{doc.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{doc.uploadedAt}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleDocDelete(doc.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-400">
              <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-xs font-semibold">Nenhum veículo selecionado.</p>
              <p className="text-[10px] text-gray-500 mt-1">Selecione uma placa na barra lateral esquerda.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE/EDIT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              {isEditMode ? "Editar Ficha de Veículo" : "Cadastrar Novo Veículo da Frota"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Placa *</label>
                    <input
                      type="text"
                      required
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="ABC-1234"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Ano *</label>
                    <input
                      type="text"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="2022"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Marca *</label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Volvo"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Modelo *</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="FH 540"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Tipo *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="Carreta">Carreta</option>
                      <option value="Truck">Truck</option>
                      <option value="ToCo">ToCo</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Capacidade de Carga</label>
                    <input
                      type="text"
                      value={loadCapacity}
                      onChange={(e) => setLoadCapacity(e.target.value)}
                      placeholder="40.000 kg"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Tanque (Litros)</label>
                    <input
                      type="text"
                      value={tankCapacity}
                      onChange={(e) => setTankCapacity(e.target.value)}
                      placeholder="800"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Consumo Médio (KM/L)</label>
                    <input
                      type="text"
                      value={averageConsumption}
                      onChange={(e) => setAverageConsumption(e.target.value)}
                      placeholder="2.5"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Renavam</label>
                    <input
                      type="text"
                      value={renavam}
                      onChange={(e) => setRenavam(e.target.value)}
                      placeholder="12345678901"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Chassi</label>
                    <input
                      type="text"
                      value={chassi}
                      onChange={(e) => setChassi(e.target.value)}
                      placeholder="9BR12345678901234"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">KM Atual *</label>
                    <input
                      type="number"
                      required
                      value={currentMileage}
                      onChange={(e) => setCurrentMileage(e.target.value)}
                      placeholder="120000"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Próx Maint. KM *</label>
                    <input
                      type="number"
                      required
                      value={nextMaintenance}
                      onChange={(e) => setNextMaintenance(e.target.value)}
                      placeholder="130000"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Licenciamento *</label>
                    <input
                      type="date"
                      required
                      value={licensingExpiration}
                      onChange={(e) => setLicensingExpiration(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TECHNICAL MAINTENANCE MODAL FORM */}
      {isMaintFormOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              Registrar Manutenção em Oficina - Placa {selectedVehicle.plate}
            </h3>

            <form onSubmit={handleAddMaintenance} className="space-y-3.5 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Tipo</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="Oficina">Oficina (Revisão)</option>
                    <option value="Pneus">Pneus (Troca/Alin.)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Data Serviço</label>
                  <input
                    type="date"
                    required
                    value={maintDate}
                    onChange={(e) => setMaintDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">KM de Registro</label>
                  <input
                    type="number"
                    required
                    value={maintKm}
                    onChange={(e) => setMaintKm(e.target.value)}
                    placeholder={String(selectedVehicle.currentMileage)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Valor Pago (R$)</label>
                  <input
                    type="number"
                    required
                    value={maintValue}
                    onChange={(e) => setMaintValue(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Descrição dos Serviços executados</label>
                <textarea
                  required
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Troca dos discos e pastilhas de freios traseiros, óleo de motor e filtros de ar..."
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none transition-all resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMaintFormOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Registrar Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
