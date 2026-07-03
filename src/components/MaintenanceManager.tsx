import React, { useState } from "react";
import { MaintenanceLog, Vehicle } from "../types";
import {
  Wrench,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Droplet,
  Disc,
  Compass as SteeringIcon,
  Zap,
  Info
} from "lucide-react";

interface MaintenanceManagerProps {
  maintenanceLogs: MaintenanceLog[];
  vehicles: Vehicle[];
  onAddMaintenanceLog: (payload: Partial<MaintenanceLog>) => Promise<boolean>;
  onDeleteMaintenanceLog: (id: string) => Promise<boolean>;
}

type MaintenanceCategory = "Óleo e Filtros" | "Freios" | "Suspensão e Direção" | "Lubrificação" | "Elétrica" | "Outros";

const CATEGORY_META: Record<MaintenanceCategory, { icon: React.ComponentType<any>; color: string }> = {
  "Óleo e Filtros": { icon: Droplet, color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  "Freios": { icon: Disc, color: "text-red-600 bg-red-500/10 border-red-500/30" },
  "Suspensão e Direção": { icon: SteeringIcon, color: "text-blue-600 bg-blue-500/10 border-blue-500/30" },
  "Lubrificação": { icon: Wrench, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  "Elétrica": { icon: Zap, color: "text-purple-600 bg-purple-500/10 border-purple-500/30" },
  "Outros": { icon: Info, color: "text-gray-600 bg-gray-500/10 border-gray-500/30" }
};

// Checklist of common preventive maintenance items, grouped by category
const CHECKLIST_ITEMS: Record<MaintenanceCategory, string[]> = {
  "Óleo e Filtros": ["Troca de Óleo do Motor", "Filtro de Óleo", "Filtro de Ar", "Filtro de Combustível", "Filtro de Cabine"],
  "Freios": ["Lonas de Freio Dianteiras", "Lonas de Freio Traseiras", "Pastilhas de Freio", "Discos/Tambores de Freio", "Fluido de Freio"],
  "Suspensão e Direção": ["Barra de Direção", "Terminal de Direção", "Amortecedores", "Molas/Feixes de Mola", "Alinhamento e Balanceamento"],
  "Lubrificação": ["Lubrificação Geral (Graxa)", "Lubrificação de Cardan", "Lubrificação de Quinta Roda"],
  "Elétrica": ["Bateria", "Alternador", "Lâmpadas/Faróis"],
  "Outros": ["Correia Dentada", "Embreagem", "Outro Item (personalizado)"]
};

// Suggested recurring interval (km) per item, used to pre-fill "next due km"
const SUGGESTED_INTERVAL_KM: Record<string, number> = {
  "Troca de Óleo do Motor": 10000,
  "Filtro de Óleo": 10000,
  "Filtro de Ar": 20000,
  "Filtro de Combustível": 20000,
  "Filtro de Cabine": 20000,
  "Lonas de Freio Dianteiras": 40000,
  "Lonas de Freio Traseiras": 40000,
  "Pastilhas de Freio": 40000,
  "Fluido de Freio": 40000,
  "Lubrificação Geral (Graxa)": 5000,
  "Lubrificação de Cardan": 5000,
  "Lubrificação de Quinta Roda": 5000,
  "Alinhamento e Balanceamento": 20000
};

export default function MaintenanceManager({
  maintenanceLogs = [],
  vehicles = [],
  onAddMaintenanceLog,
  onDeleteMaintenanceLog
}: MaintenanceManagerProps) {
  const [vehicleFilter, setVehicleFilter] = useState("TODOS");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formVehicleId, setFormVehicleId] = useState(vehicles[0]?.id || "");
  const [formCategory, setFormCategory] = useState<MaintenanceCategory>("Óleo e Filtros");
  const [formItem, setFormItem] = useState(CHECKLIST_ITEMS["Óleo e Filtros"][0]);
  const [formCustomItem, setFormCustomItem] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formKm, setFormKm] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formNextDueKm, setFormNextDueKm] = useState("");

  const resetForm = () => {
    const defaultVehicle = vehicles[0]?.id || "";
    setFormVehicleId(defaultVehicle);
    setFormCategory("Óleo e Filtros");
    setFormItem(CHECKLIST_ITEMS["Óleo e Filtros"][0]);
    setFormCustomItem("");
    setFormDate(new Date().toISOString().split("T")[0]);
    const vehicle = vehicles.find(v => v.id === defaultVehicle);
    setFormKm(vehicle ? String(vehicle.currentMileage || 0) : "");
    setFormCost("");
    setFormNotes("");
    setFormNextDueKm("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleCategoryChange = (cat: MaintenanceCategory) => {
    setFormCategory(cat);
    setFormItem(CHECKLIST_ITEMS[cat][0]);
    const suggested = SUGGESTED_INTERVAL_KM[CHECKLIST_ITEMS[cat][0]];
    if (suggested && formKm) {
      setFormNextDueKm(String(Number(formKm) + suggested));
    }
  };

  const handleItemChange = (item: string) => {
    setFormItem(item);
    const suggested = SUGGESTED_INTERVAL_KM[item];
    if (suggested && formKm) {
      setFormNextDueKm(String(Number(formKm) + suggested));
    }
  };

  const handleVehicleChange = (id: string) => {
    setFormVehicleId(id);
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) setFormKm(String(vehicle.currentMileage || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalItem = formItem === "Outro Item (personalizado)" ? formCustomItem.trim() : formItem;
    if (!formVehicleId || !finalItem || !formKm) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const payload: Partial<MaintenanceLog> = {
      vehicleId: formVehicleId,
      item: finalItem,
      category: formCategory,
      date: formDate,
      km: Number(formKm) || 0,
      cost: Number(formCost) || 0,
      notes: formNotes,
      nextDueKm: formNextDueKm ? Number(formNextDueKm) : undefined
    };

    const ok = await onAddMaintenanceLog(payload);
    if (ok) {
      setIsAddModalOpen(false);
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
    await onDeleteMaintenanceLog(id);
    setConfirmDeleteId(null);
  };

  // Determine overdue/upcoming status for a log entry based on the vehicle's current mileage
  const getDueStatus = (log: MaintenanceLog) => {
    if (!log.nextDueKm) return null;
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    if (!vehicle) return null;
    const remaining = log.nextDueKm - (vehicle.currentMileage || 0);
    if (remaining <= 0) return { label: "Vencido", color: "bg-red-500/15 text-red-600 border-red-500/30", remaining };
    if (remaining <= 2000) return { label: `Faltam ${remaining.toLocaleString("pt-BR")} km`, color: "bg-amber-500/15 text-amber-600 border-amber-500/30", remaining };
    return { label: `Faltam ${remaining.toLocaleString("pt-BR")} km`, color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", remaining };
  };

  const filteredLogs = [...maintenanceLogs]
    .filter(log => (vehicleFilter === "TODOS" || log.vehicleId === vehicleFilter) && (categoryFilter === "TODOS" || log.category === categoryFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalCost = maintenanceLogs.reduce((sum, l) => sum + (l.cost || 0), 0);
  const overdueCount = maintenanceLogs.filter(l => {
    const st = getDueStatus(l);
    return st && st.remaining <= 0;
  }).length;
  const upcomingCount = maintenanceLogs.filter(l => {
    const st = getDueStatus(l);
    return st && st.remaining > 0 && st.remaining <= 2000;
  }).length;

  return (
    <div id="modulo-manutencao-container" className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">Total de Registros</span>
          <p className="text-xl font-black text-foreground mt-1">{maintenanceLogs.length}</p>
          <span className="text-[9px] text-muted-foreground font-medium">Manutenções cadastradas</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">Custo Total</span>
          <p className="text-xl font-black text-foreground mt-1">R$ {totalCost.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
          <span className="text-[9px] text-muted-foreground font-medium">Somatório de todas as manutenções</span>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider block">Próximas do Prazo</span>
          <p className="text-xl font-black text-amber-600 mt-1 flex items-center gap-1.5">
            {upcomingCount}
            {upcomingCount > 0 && <AlertTriangle className="w-4 h-4 animate-pulse" />}
          </p>
          <span className="text-[9px] text-amber-600/70 font-medium">Faltam 2.000 km ou menos</span>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-wider block">Vencidas</span>
          <p className="text-xl font-black text-red-600 mt-1 flex items-center gap-1.5">
            {overdueCount}
            {overdueCount > 0 && <AlertTriangle className="w-4 h-4 animate-bounce" />}
          </p>
          <span className="text-[9px] text-red-600/70 font-medium">Km atual já ultrapassou o previsto</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 border border-border rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="bg-muted border border-border text-foreground rounded-lg px-2.5 py-2 text-xs outline-none font-semibold"
          >
            <option value="TODOS">Todos Veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.brand} {v.plate}</option>
            ))}
          </select>

          <div className="flex gap-1.5 flex-wrap">
            {["TODOS", ...Object.keys(CATEGORY_META)].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrar Manutenção
        </button>
      </div>

      {/* Logs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredLogs.length === 0 ? (
          <div className="lg:col-span-2 text-center py-16 bg-card border border-border rounded-xl">
            <Wrench className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-xs font-medium">Nenhuma manutenção registrada com os filtros selecionados.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const vehicle = vehicles.find(v => v.id === log.vehicleId);
            const meta = CATEGORY_META[log.category as MaintenanceCategory] || CATEGORY_META["Outros"];
            const Icon = meta.icon;
            const dueStatus = getDueStatus(log);

            return (
              <div key={log.id} className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-lg border ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-foreground">{log.item}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {vehicle ? `${vehicle.brand} ${vehicle.plate}` : "Veículo não encontrado"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className={`p-1.5 transition-all duration-300 rounded border flex items-center gap-1 text-xs font-semibold cursor-pointer shrink-0 ${
                      confirmDeleteId === log.id
                        ? "bg-amber-500 text-white border-amber-600 px-2 animate-pulse"
                        : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                    }`}
                    title={confirmDeleteId === log.id ? "Confirmar exclusão" : "Excluir registro"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDeleteId === log.id && "Confirmar?"}
                  </button>
                </div>

                {log.notes && (
                  <p className="text-[10.5px] text-muted-foreground mt-2">{log.notes}</p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 text-[10.5px] font-mono">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {(() => { const [y, m, d] = log.date.split("-"); return y && m && d ? `${d}/${m}/${y}` : log.date; })()}
                  </span>
                  <span className="text-muted-foreground">{log.km.toLocaleString("pt-BR")} km</span>
                  <span className="font-black text-foreground">R$ {log.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>

                {dueStatus && (
                  <div className={`mt-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${dueStatus.color}`}>
                    {dueStatus.remaining <= 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    Próxima troca: {log.nextDueKm?.toLocaleString("pt-BR")} km — {dueStatus.label}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
              Registrar Manutenção Preventiva
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Veículo *</label>
                <select
                  value={formVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Categoria *</label>
                <select
                  value={formCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as MaintenanceCategory)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                >
                  {Object.keys(CATEGORY_META).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Item (Checklist) *</label>
                <select
                  value={formItem}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                >
                  {CHECKLIST_ITEMS[formCategory].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {formItem === "Outro Item (personalizado)" && (
                  <input
                    type="text"
                    required
                    placeholder="Descreva o item de manutenção..."
                    value={formCustomItem}
                    onChange={(e) => setFormCustomItem(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none mt-1.5"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Km Atual *</label>
                  <input
                    type="number"
                    required
                    value={formKm}
                    onChange={(e) => setFormKm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Próxima Troca (Km)</label>
                  <input
                    type="number"
                    placeholder="Opcional"
                    value={formNextDueKm}
                    onChange={(e) => setFormNextDueKm(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Observações</label>
                <textarea
                  placeholder="Detalhes da manutenção, oficina, peça utilizada..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
