import React, { useState } from "react";
import { Expense } from "../types";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Plus, Search, Calendar, DollarSign, Trash2, CheckCircle, ArrowDown, PieChart as PieChartIcon } from "lucide-react";

const EXPENSE_CHART_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#6b7280"];

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (e: Partial<Expense>) => Promise<boolean>;
  onDeleteExpense: (id: string) => Promise<boolean>;
}

export default function ExpensesManager({
  expenses,
  onAddExpense,
  onDeleteExpense
}: ExpensesManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState("2026-06-23");
  const [category, setCategory] = useState("Oficina");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setDate("2026-06-23");
    setCategory("Oficina");
    setValue("");
    setDescription("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !description) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const payload: Partial<Expense> = {
      date,
      category,
      value: Number(value),
      description,
      receipt: ""
    };

    const ok = await onAddExpense(payload);
    if (ok) {
      setIsFormOpen(false);
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
    await onDeleteExpense(id);
    setConfirmDeleteId(null);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "TODOS" || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Category totals for charts
  const categoryTotals = Object.values(
    expenses.reduce((acc: Record<string, { category: string; value: number }>, e) => {
      acc[e.category] = acc[e.category] || { category: e.category, value: 0 };
      acc[e.category].value += e.value || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  // Monthly totals for the bar chart (last 6 months of data present)
  const monthlyTotals = Object.values(
    expenses.reduce((acc: Record<string, { month: string; value: number }>, e) => {
      const month = (e.date || "").slice(0, 7);
      if (!month) return acc;
      acc[month] = acc[month] || { month, value: 0 };
      acc[month].value += e.value || 0;
      return acc;
    }, {})
  ).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div id="modulo-despesas-container" className="space-y-6">
      {/* Charts */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-red-500" />
              Distribuição por Categoria
            </h4>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryTotals.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {categoryTotals.map((item, index) => (
                <div key={item.category} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXPENSE_CHART_COLORS[index % EXPENSE_CHART_COLORS.length] }} />
                  <span>{item.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Despesas por Mês
            </h4>
            <div className="h-[220px] w-full">
              {monthlyTotals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">Sem dados temporais disponíveis.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTotals}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="month" stroke="currentColor" className="text-gray-400" fontSize={10} tickLine={false} />
                    <YAxis stroke="currentColor" className="text-gray-400" fontSize={9} tickLine={false} />
                    <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar despesa por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {["TODOS", "Combustível", "Pedágio", "Oficina", "Pneus", "Impostos", "Seguros", "Outros"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                    : "bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-850"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/10 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrar Despesa
        </button>
      </div>

      {/* Expenses list Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="p-3 pl-5">Data</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Descrição da Despesa</th>
                <th className="p-3 text-right pr-5">Valor Pago</th>
                <th className="p-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-mono">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 text-gray-900 dark:text-gray-100 transition-all font-sans">
                  <td className="p-3 pl-5 font-mono text-gray-500 dark:text-gray-400">{e.date}</td>
                  <td className="p-3 font-semibold">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      e.category === "Combustível" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400" :
                      e.category === "Oficina" ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400" :
                      e.category === "Pneus" ? "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400" :
                      e.category === "Pedágio" ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 text-teal-700 dark:text-teal-400" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-405"
                    }`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">{e.description}</td>
                  <td className="p-3 text-right font-mono font-black text-red-600 dark:text-red-400 pr-5 flex items-center justify-end gap-1 pt-4">
                    <ArrowDown className="w-3.5 h-3.5 text-red-500" />
                    R$ {e.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className={`p-1.5 transition-all duration-300 rounded inline-flex border items-center gap-1 text-xs font-semibold cursor-pointer ${
                        confirmDeleteId === e.id
                          ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 px-2 animate-pulse"
                          : "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-350"
                      }`}
                      title={confirmDeleteId === e.id ? "Confirmar exclusão" : "Excluir despesa"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteId === e.id && "Confirmar?"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr className="font-sans">
                  <td colSpan={5} className="text-center py-16 text-gray-400 dark:text-gray-550">Nenhum lançamento de despesa encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              Registrar Lançamento Financeiro de Despesa
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data do Lançamento *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="Combustível">Combustível</option>
                    <option value="Pedágio">Pedágio</option>
                    <option value="Oficina">Oficina (Manutenção)</option>
                    <option value="Pneus">Pneus (Borracharia)</option>
                    <option value="Impostos">Impostos (IPVA/Taxas)</option>
                    <option value="Seguros">Seguros de Carga/Frota</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Valor Pago (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 dark:text-gray-500 text-xs font-bold font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="120.00"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs outline-none font-mono font-bold text-red-600 dark:text-red-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Descrição Detalhada *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Pagamento de pedágio viagem Recife a Maceió Km 80 - Rota de escoamento."
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none transition-all resize-none"
                />
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
