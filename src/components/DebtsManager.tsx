import React, { useState } from "react";
import { Debt } from "../types";
import SessionAnnotations from "./SessionAnnotations";
import {
  Coins,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  PlusCircle,
  FileText,
  BarChart3
} from "lucide-react";

const DEBT_CHART_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#6b7280"];

interface DebtsManagerProps {
  debts: Debt[];
  onAddDebt: (payload: Partial<Debt>) => Promise<boolean>;
  onUpdateDebt: (id: string, payload: Partial<Debt>) => Promise<boolean>;
  onDeleteDebt: (id: string) => Promise<boolean>;
}

const DEBT_CATEGORIES = [
  "Financiamento BNDES",
  "Rotativo Sicredi",
  "Empréstimos",
  "Oficina",
  "Pneus",
  "Combustível",
  "Impostos",
  "Salários",
  "Seguro",
  "Administrativo",
  "Outros"
];

export default function DebtsManager({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt
}: DebtsManagerProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // Form states
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Outros");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"Quitar Primeiro" | "Pago" | "Falta Pagar">("Falta Pagar");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setDescription("");
    setCategory("Outros");
    setValue("");
    setDueDate(new Date().toISOString().split("T")[0]);
    setStatus("Falta Pagar");
    setNotes("");
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setDescription(debt.description);
    setCategory(debt.category);
    setValue(debt.value.toString());
    setDueDate(debt.dueDate);
    setStatus(debt.status);
    setNotes(debt.notes || "");
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value || !dueDate) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const payload: Partial<Debt> = {
      description,
      category,
      value: Number(value),
      dueDate,
      status,
      notes
    };

    const success = await onAddDebt(payload);
    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !description || !value || !dueDate) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const payload: Partial<Debt> = {
      description,
      category,
      value: Number(value),
      dueDate,
      status,
      notes
    };

    const success = await onUpdateDebt(selectedDebt.id, payload);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedDebt(null);
      resetForm();
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta dívida?")) {
      await onDeleteDebt(id);
    }
  };

  const getStatusStyle = (status: Debt["status"]) => {
    if (status === "Quitar Primeiro") {
      return {
        badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
        dot: "bg-amber-500 animate-pulse",
        label: "Quitar Primeiro"
      };
    }
    if (status === "Pago") {
      return {
        badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
        dot: "bg-emerald-500",
        label: "Pago"
      };
    }
    return {
      badge: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30",
      dot: "bg-red-500",
      label: "Falta Pagar"
    };
  };

  const formatDebtDate = (dueDate: string) => {
    const [year, month, day] = dueDate.split("-");
    return year && month && day ? `${day}/${month}/${year}` : dueDate;
  };

  // Metrics calculations
  const totalDebts = debts.length;
  const sumPriority = debts.filter(d => d.status === "Quitar Primeiro").reduce((acc, curr) => acc + curr.value, 0);
  const sumPaid = debts.filter(d => d.status === "Pago").reduce((acc, curr) => acc + curr.value, 0);
  const sumPending = debts.filter(d => d.status === "Falta Pagar").reduce((acc, curr) => acc + curr.value, 0);
  const sumTotal = debts.reduce((acc, curr) => acc + curr.value, 0);

  // Filtered lists
  // Category totals for the bar chart
  const categoryTotals = DEBT_CATEGORIES.map(cat => ({
    category: cat,
    value: debts.filter(d => d.category === cat).reduce((sum, d) => sum + (d.value || 0), 0)
  })).filter(c => c.value > 0);

  const filteredDebts = debts.filter((debt) => {
    const matchesSearch = debt.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (debt.notes && debt.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      debt.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || debt.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || debt.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Group into columns by category (Kanban-style board), preserving DEBT_CATEGORIES order
  const debtColumns = DEBT_CATEGORIES.map(cat => ({
    category: cat,
    items: filteredDebts.filter(d => d.category === cat)
  })).filter(col => col.items.length > 0);

  // Any debts whose category isn't in the known list still need to be shown somewhere
  const uncategorizedDebts = filteredDebts.filter(d => !DEBT_CATEGORIES.includes(d.category));
  if (uncategorizedDebts.length > 0) {
    debtColumns.push({ category: "Outras Categorias", items: uncategorizedDebts });
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Gestão de Dívidas & Obrigações</h2>
            <p className="text-xs text-muted-foreground">Monitore, cadastre e gerencie as contas a pagar da transportadora.</p>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/15 hover:shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Dívida / Conta
        </button>
      </div>

      {/* METRIC CARD ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Metric */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Consolidado</span>
            <span className="p-1.5 bg-slate-500/10 text-slate-500 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-muted-foreground block">{totalDebts} registros cadastrados</span>
            <p className="text-2xl font-black font-mono text-foreground leading-none mt-1">
              R$ {sumTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-400 opacity-30" />
        </div>

        {/* Priority Metric (Quitar Primeiro - Yellow) */}
        <div className="bg-amber-500/5 dark:bg-amber-500/2 border border-amber-500/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">Quitar Primeiro (Prioridade)</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <AlertCircle className="w-4 h-4 animate-bounce" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-amber-600/70 dark:text-amber-400/70 block">Urgente / Juros altos</span>
            <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 leading-none mt-1">
              R$ {sumPriority.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Paid Metric (Green) */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/2 border border-emerald-500/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Pago (Liquidado)</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 block">Baixa de caixa concluída</span>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none mt-1">
              R$ {sumPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Pending Metric (Red) */}
        <div className="bg-red-500/5 dark:bg-red-500/2 border border-red-500/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400">Falta Pagar (Pendente)</span>
            <span className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs text-red-600/70 dark:text-red-400/70 block">A vencer ou agendado</span>
            <p className="text-2xl font-black font-mono text-red-600 dark:text-red-400 leading-none mt-1">
              R$ {sumPending.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </div>
      </div>

      {/* CATEGORY RANKING LIST */}
      {categoryTotals.length > 0 && (
        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Dívidas por Categoria
          </h4>
          <div className="space-y-3.5">
            {(() => {
              const maxVal = Math.max(...categoryTotals.map((c: any) => c.value), 1);
              return categoryTotals.map((item: any, index) => {
                const color = DEBT_CHART_COLORS[index % DEBT_CHART_COLORS.length];
                const pct = (item.value / maxVal) * 100;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {item.category}
                      </span>
                      <span className="text-foreground font-mono">
                        R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: color, width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por descrição, observações, categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-xs rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-xl px-2 py-1.5 text-xs text-foreground">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-foreground outline-none border-none font-bold text-xs"
            >
              <option value="All">Todos</option>
              <option value="Quitar Primeiro">Quitar Primeiro (Amarelo)</option>
              <option value="Falta Pagar">Falta Pagar (Vermelho)</option>
              <option value="Pago">Pago (Verde)</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-xl px-2 py-1.5 text-xs text-foreground">
            <span className="text-muted-foreground font-mono">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-foreground outline-none border-none font-bold text-xs"
            >
              <option value="All">Todas</option>
              {DEBT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DEBTS BOARD (COLUMNS BY CATEGORY) */}
      {debtColumns.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-xs shadow-xs">
          Nenhuma dívida ou conta a pagar encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {debtColumns.map(col => {
            const colTotal = col.items.reduce((sum, d) => sum + (d.value || 0), 0);
            return (
              <div key={col.category} className="w-[300px] flex-shrink-0 flex flex-col bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/40 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-foreground truncate" title={col.category}>{col.category}</h4>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {col.items.length}
                    </span>
                  </div>
                  <p className="text-sm font-black font-mono text-foreground mt-1">
                    R$ {colTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto max-h-[560px] custom-scrollbar">
                  {col.items.map(debt => {
                    const st = getStatusStyle(debt.status);
                    return (
                      <div key={debt.id} className="group bg-muted/30 hover:bg-muted/60 border border-border/60 rounded-xl p-3 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-foreground leading-tight">{debt.description}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => handleOpenEditModal(debt)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                              title="Editar Dívida"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(debt.id)}
                              className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                              title="Excluir Dívida"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {debt.notes && (
                          <p className="text-[10.5px] text-muted-foreground mt-1 line-clamp-2" title={debt.notes}>
                            {debt.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 mt-2 text-[10.5px] font-mono font-medium text-muted-foreground">
                          <Calendar className="w-3 h-3 text-muted-foreground/80" />
                          {formatDebtDate(debt.dueDate)}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-mono font-extrabold text-foreground">
                            R$ {debt.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SessionAnnotations moduleKey="debts" title="Anotações & Prints de Gastos" />

      {/* CREATE NEW DEBT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
              Cadastrar Nova Dívida / Compromisso
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Descrição / Credor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auto Peças Diesel Sul S/A"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              {/* Category & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    {DEBT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="dark:bg-slate-950">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Valor (R$) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Due date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Status Inicial *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="Quitar Primeiro" className="dark:bg-slate-950">Quitar Primeiro (Amarelo)</option>
                    <option value="Falta Pagar" className="dark:bg-slate-950">Falta Pagar (Vermelho)</option>
                    <option value="Pago" className="dark:bg-slate-950">Pago (Verde)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Observações / Detalhes</label>
                <textarea
                  placeholder="Adicione observações relevantes sobre taxas, juros ou condições desta obrigação financeira..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
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
                  Cadastrar Dívida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEBT MODAL */}
      {isEditModalOpen && selectedDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
              Editar Dívida / Compromisso
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Descrição / Credor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auto Peças Diesel Sul S/A"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              {/* Category & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    {DEBT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="dark:bg-slate-950">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Valor (R$) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Due date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="Quitar Primeiro" className="dark:bg-slate-950">Quitar Primeiro (Amarelo)</option>
                    <option value="Falta Pagar" className="dark:bg-slate-950">Falta Pagar (Vermelho)</option>
                    <option value="Pago" className="dark:bg-slate-950">Pago (Verde)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Observações / Detalhes</label>
                <textarea
                  placeholder="Adicione observações relevantes sobre taxas, juros ou condições desta obrigação financeira..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
