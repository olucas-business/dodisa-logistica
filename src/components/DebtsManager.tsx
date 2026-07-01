import React, { useState } from "react";
import { Debt } from "../types";
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
  FileText
} from "lucide-react";

interface DebtsManagerProps {
  debts: Debt[];
  onAddDebt: (payload: Partial<Debt>) => Promise<boolean>;
  onUpdateDebt: (id: string, payload: Partial<Debt>) => Promise<boolean>;
  onDeleteDebt: (id: string) => Promise<boolean>;
}

const DEBT_CATEGORIES = [
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

  // Metrics calculations
  const totalDebts = debts.length;
  const sumPriority = debts.filter(d => d.status === "Quitar Primeiro").reduce((acc, curr) => acc + curr.value, 0);
  const sumPaid = debts.filter(d => d.status === "Pago").reduce((acc, curr) => acc + curr.value, 0);
  const sumPending = debts.filter(d => d.status === "Falta Pagar").reduce((acc, curr) => acc + curr.value, 0);
  const sumTotal = debts.reduce((acc, curr) => acc + curr.value, 0);

  // Filtered lists
  const filteredDebts = debts.filter((debt) => {
    const matchesSearch = debt.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (debt.notes && debt.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      debt.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || debt.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || debt.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

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

      {/* DEBTS GRID / TABLE */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] font-mono uppercase font-black text-muted-foreground">
                <th className="p-4">Dívida / Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Valor (R$)</th>
                <th className="p-4">Prioridade / Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma dívida ou conta a pagar encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  // Style based on status
                  let statusBadgeClass = "";
                  let statusDotClass = "";
                  let statusLabel = "";

                  if (debt.status === "Quitar Primeiro") {
                    statusBadgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30";
                    statusDotClass = "bg-amber-500 animate-pulse";
                    statusLabel = "Quitar Primeiro";
                  } else if (debt.status === "Pago") {
                    statusBadgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30";
                    statusDotClass = "bg-emerald-500";
                    statusLabel = "Pago";
                  } else {
                    statusBadgeClass = "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30";
                    statusDotClass = "bg-red-500";
                    statusLabel = "Falta Pagar";
                  }

                  const formattedValue = debt.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  
                  // Format Date to PT-BR
                  const [year, month, day] = debt.dueDate.split("-");
                  const formattedDate = year && month && day ? `${day}/${month}/${year}` : debt.dueDate;

                  return (
                    <tr key={debt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{debt.description}</div>
                        {debt.notes && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 max-w-sm truncate" title={debt.notes}>
                            {debt.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded-md text-[10px] border border-border">
                          {debt.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                          {formattedDate}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-extrabold text-foreground text-sm">
                        R$ {formattedValue}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${statusBadgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(debt)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Editar Dívida"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(debt.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                            title="Excluir Dívida"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
