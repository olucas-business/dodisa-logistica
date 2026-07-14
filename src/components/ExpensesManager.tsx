import React, { useState, useEffect } from "react";
import { Expense } from "../types";
import { todayLocalISO } from "../utils/date";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { Plus, Search, Calendar, DollarSign, Trash2, CheckCircle, ArrowDown, PieChart as PieChartIcon, X, Settings, ChevronDown } from "lucide-react";
import SessionAnnotations from "./SessionAnnotations";
import MonthYearPicker from "./MonthYearPicker";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Combustível",
  "Pedágio",
  "Oficina",
  "Manutenção",
  "Borracheiro",
  "Pneus",
  "Chapa",
  "Boletos",
  "Multas",
  "Cartão de Crédito",
  "Impostos",
  "Seguros",
  "Outros"
];

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  "Combustível": "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400",
  "Pedágio": "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 text-teal-700 dark:text-teal-400",
  "Oficina": "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400",
  "Manutenção": "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400",
  "Borracheiro": "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400",
  "Pneus": "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-400",
  "Chapa": "bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/40 text-cyan-700 dark:text-cyan-400",
  "Boletos": "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400",
  "Multas": "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400",
  "Cartão de Crédito": "bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/40 text-pink-700 dark:text-pink-400",
  "Impostos": "bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400",
  "Seguros": "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  "Outros": "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400"
};

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (e: Partial<Expense>) => Promise<boolean>;
  onUpdateExpense: (id: string, e: Partial<Expense>) => Promise<boolean>;
  onDeleteExpense: (id: string) => Promise<boolean>;
}

export default function ExpensesManager({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}: ExpensesManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Categorias customizáveis (persistidas no servidor, com fallback local enquanto carrega)
  const [categories, setCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [categoriesPanelOpen, setCategoriesPanelOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const fetchCategories = () => {
    fetch("/api/expense-categories")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setAddingCategory(true);
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setNewCategoryName("");
      } else {
        alert(data.message || "Erro ao criar categoria.");
      }
    } catch (err) {
      alert("Erro ao criar categoria.");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (confirmDeleteCategory !== cat) {
      setConfirmDeleteCategory(cat);
      setTimeout(() => setConfirmDeleteCategory(curr => curr === cat ? null : curr), 4000);
      return;
    }
    try {
      const res = await fetch(`/api/expense-categories/${encodeURIComponent(cat)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (categoryFilter === cat) setCategoryFilter("TODOS");
      }
    } catch (err) {
      // silent
    }
    setConfirmDeleteCategory(null);
  };

  // Filtro de mês/ano: controla a tabela de lançamentos e o gráfico de categorias abaixo
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const selectedYearMonth = `${selectedYear}-${selectedMonth < 10 ? "0" + selectedMonth : selectedMonth}`;
  const expensesInSelectedMonth = expenses.filter(e => (e.date || "").startsWith(selectedYearMonth));

  // Form states
  const [date, setDate] = useState(todayLocalISO());
  const [category, setCategory] = useState("Oficina");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [isInstallmentPlan, setIsInstallmentPlan] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [installmentsPaidCount, setInstallmentsPaidCount] = useState("0");

  const resetForm = () => {
    setDate(todayLocalISO());
    setCategory(categories[0] || "Outros");
    setValue("");
    setDescription("");
    setIsInstallmentPlan(false);
    setInstallments("2");
    setInstallmentsPaidCount("0");
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

    const totalValue = Number(value);
    const totalInstallments = isInstallmentPlan ? (Number(installments) || 1) : 1;
    const paidInstallments = isInstallmentPlan ? Math.min(totalInstallments, Number(installmentsPaidCount) || 0) : 0;
    const paidAmount = paidInstallments > 0 ? (totalValue / totalInstallments) * paidInstallments : 0;

    const payload: Partial<Expense> = {
      date,
      category,
      value: totalValue,
      description,
      receipt: "",
      status: paidAmount >= totalValue - 0.01 && totalValue > 0 ? "Pago" : "Pendente",
      installments: totalInstallments,
      paidAmount: Number(paidAmount.toFixed(2))
    };

    const ok = await onAddExpense(payload);
    if (ok) {
      setIsFormOpen(false);
    }
  };

  // Pagamento (total, parcial ou por parcela) de uma despesa
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payingSubmitting, setPayingSubmitting] = useState(false);

  const handleOpenPay = (exp: Expense) => {
    setPayingExpense(exp);
    const remaining = exp.value - (exp.paidAmount || 0);
    setPayAmount(remaining.toFixed(2));
  };

  const handleQuickPayInstallment = () => {
    if (!payingExpense) return;
    const total = payingExpense.installments && payingExpense.installments > 0 ? payingExpense.installments : 1;
    setPayAmount((payingExpense.value / total).toFixed(2));
  };

  const handleQuickPayTotal = () => {
    if (!payingExpense) return;
    const remaining = payingExpense.value - (payingExpense.paidAmount || 0);
    setPayAmount(remaining.toFixed(2));
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExpense) return;
    const parsed = Number(payAmount.replace(",", "."));
    if (!parsed || parsed <= 0) {
      alert("Informe um valor de pagamento válido.");
      return;
    }
    setPayingSubmitting(true);
    const newPaidAmount = Math.min(payingExpense.value, (payingExpense.paidAmount || 0) + parsed);
    const payload: Partial<Expense> = {
      paidAmount: Number(newPaidAmount.toFixed(2)),
      status: newPaidAmount >= payingExpense.value - 0.01 ? "Pago" : "Pendente"
    };
    const ok = await onUpdateExpense(payingExpense.id, payload);
    setPayingSubmitting(false);
    if (ok) {
      setPayingExpense(null);
      setPayAmount("");
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

  const filteredExpenses = expensesInSelectedMonth.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "TODOS" || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Category totals for charts (mês selecionado)
  const categoryTotals = Object.values(
    expensesInSelectedMonth.reduce((acc: Record<string, { category: string; value: number }>, e) => {
      acc[e.category] = acc[e.category] || { category: e.category, value: 0 };
      acc[e.category].value += e.value || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);

  // Intensidade por valor: vermelho = mais grave, laranja = médio, amarelo = menor
  const maxCategoryTotal = Math.max(...categoryTotals.map(c => c.value), 1);
  const getExpenseIntensityColor = (value: number) => {
    const ratio = value / maxCategoryTotal;
    if (ratio >= 0.66) return "#ef4444";
    if (ratio >= 0.33) return "#f97316";
    return "#eab308";
  };

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
      {/* Filtro de mês/ano */}
      <div className="flex justify-end">
        <MonthYearPicker month={selectedMonth} year={selectedYear} onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} />
      </div>

      {/* Charts */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-red-500" />
              Distribuição por Categoria (Mês)
            </h4>
            {categoryTotals.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">Nenhuma despesa no mês selecionado.</div>
            ) : (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {categoryTotals.map((item, index) => (
                          <Cell key={`cell-${index}`} fill={getExpenseIntensityColor(item.value)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  {categoryTotals.map((item) => (
                    <div key={item.category} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getExpenseIntensityColor(item.value) }} />
                      <span>{item.category}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Despesas por Mês (Histórico)
            </h4>
            <div className="h-[220px] w-full">
              {monthlyTotals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">Sem dados temporais disponíveis.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTotals} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expensesMonthlyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-300 dark:text-gray-700" opacity={0.6} />
                    <XAxis dataKey="month" stroke="currentColor" className="text-gray-400" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-gray-400" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v} />
                    <Tooltip formatter={(val: any) => [`R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Despesas"]} />
                    <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2.5} fill="url(#expensesMonthlyGrad)" dot={{ r: 3 }} />
                  </AreaChart>
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(v => !v)}
              className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-red-500 cursor-pointer flex items-center gap-2 min-w-[160px] justify-between"
            >
              <span className="truncate">{categoryFilter === "TODOS" ? "Todas as categorias" : categoryFilter}</span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCategoryDropdownOpen(false)} />
                <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl w-56 max-h-72 overflow-y-auto py-1.5 animate-scale-in">
                  <button
                    onClick={() => { setCategoryFilter("TODOS"); setCategoryDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      categoryFilter === "TODOS"
                        ? "bg-red-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    Todas as categorias
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategoryFilter(cat); setCategoryDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? "bg-red-600 text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setCategoriesPanelOpen(v => !v)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              categoriesPanelOpen
                ? "bg-red-600 text-white border-red-600"
                : "bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-850"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Gerenciar Categorias
          </button>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/10 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrar Despesa
        </button>
      </div>

      {/* Painel de Gerenciamento de Categorias (colapsável) */}
      {categoriesPanelOpen && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500 tracking-wider">Categorias de Despesa</span>
            <span className="flex items-center gap-1.5">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                placeholder="Nova categoria..."
                className="w-36 bg-gray-50 dark:bg-slate-950 border border-dashed border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
                className="p-1 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-40"
                title="Adicionar categoria"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <span
                key={cat}
                className="group flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg text-xs font-semibold border bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-800"
              >
                {cat}
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  title={confirmDeleteCategory === cat ? "Confirmar exclusão da categoria" : "Excluir categoria"}
                  className={`p-0.5 rounded transition-all cursor-pointer ${
                    confirmDeleteCategory === cat
                      ? "bg-amber-500 text-white animate-pulse"
                      : "opacity-40 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expenses list Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="p-3 pl-5">Data</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Descrição da Despesa</th>
                <th className="p-3 text-right">Valor Pago</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center pr-5">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-mono">
              {filteredExpenses.map((e) => {
                const isPaid = e.status === "Pago";
                return (
                <tr key={e.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 text-gray-900 dark:text-gray-100 transition-all font-sans">
                  <td className="p-3 pl-5 font-mono text-gray-500 dark:text-gray-400">{e.date}</td>
                  <td className="p-3 font-semibold">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${CATEGORY_BADGE_STYLES[e.category] || CATEGORY_BADGE_STYLES["Outros"]}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">{e.description}</td>
                  <td className="p-3 text-right font-mono font-black text-red-600 dark:text-red-400 pt-4">
                    <div className="flex items-center justify-end gap-1">
                      <ArrowDown className="w-3.5 h-3.5 text-red-500" />
                      R$ {e.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {(e.installments || 1) > 1 && (
                      <span className="block text-[9px] font-semibold text-gray-400 dark:text-gray-500 normal-case">
                        {e.installments}x de R$ {(e.value / (e.installments || 1)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {!isPaid && (e.paidAmount || 0) > 0 && (
                      <span className="block text-[9px] font-semibold text-emerald-500 normal-case">
                        Pago: R$ {(e.paidAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => !isPaid && handleOpenPay(e)}
                      disabled={isPaid}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all inline-flex items-center gap-1 ${
                        isPaid
                          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 cursor-default"
                          : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer"
                      }`}
                      title={isPaid ? "Despesa quitada" : "Registrar pagamento"}
                    >
                      {isPaid ? <CheckCircle className="w-3 h-3" /> : null}
                      {isPaid ? "Pago" : "Pagar"}
                    </button>
                  </td>
                  <td className="p-3 text-center pr-5">
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
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr className="font-sans">
                  <td colSpan={6} className="text-center py-16 text-gray-400 dark:text-gray-550">Nenhum lançamento de despesa encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SessionAnnotations moduleKey="expenses" title="Anotações & Prints de Despesas" />

      {/* CREATE MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              Registrar Lançamento Financeiro de Despesa
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">Data *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-w-0 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full min-w-0 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Valor Total (R$) *</label>
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

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInstallmentPlan}
                  onChange={(e) => setIsInstallmentPlan(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">Esta despesa é parcelada (ex: dívida ou compra em várias vezes)</span>
              </label>

              {isInstallmentPlan && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-lg p-3">
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">Nº de Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      placeholder="2"
                      className="w-full min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none font-mono font-bold text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">Parcelas Já Pagas</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={installmentsPaidCount}
                      onChange={(e) => setInstallmentsPaidCount(e.target.value)}
                      placeholder="0"
                      className="w-full min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                </div>
              )}

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

      {/* PAY EXPENSE MODAL */}
      {payingExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in my-auto">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4">
              Registrar Pagamento
            </h3>
            <div className="mb-4 space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">{payingExpense.description}</p>
              <p className="text-lg font-black font-mono text-red-600 dark:text-red-400">
                R$ {(payingExpense.value - (payingExpense.paidAmount || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[10px] font-semibold text-gray-400 ml-1">pendente</span>
              </p>
              {(payingExpense.installments || 1) > 1 && (
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                  Parcelado em {payingExpense.installments}x de R$ {(payingExpense.value / (payingExpense.installments || 1)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {(payingExpense.installments || 1) > 1 && (
                <button
                  type="button"
                  onClick={handleQuickPayInstallment}
                  className="px-3 py-2 border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Pagar 1 Parcela
                </button>
              )}
              <button
                type="button"
                onClick={handleQuickPayTotal}
                className="px-3 py-2 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Pagar Valor Total
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Pagar Parcialmente (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono font-bold"
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Ajuste o valor acima para um pagamento parcial personalizado.</p>
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setPayingExpense(null); setPayAmount(""); }}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payingSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
