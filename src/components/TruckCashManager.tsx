import React, { useState, useMemo } from "react";
import { Driver, Vehicle, CaixaCaminhao, CaixaMovimentacao } from "../types";
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Coins, 
  ArrowLeft, 
  Folder, 
  Clock, 
  FileText, 
  User, 
  Sparkles,
  Info
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from "recharts";

interface TruckCashManagerProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  caixas: CaixaCaminhao[];
  movimentacoes: CaixaMovimentacao[];
  currentUserRole?: string;
  onDefinirSaldo: (payload: { veiculo_id: string; saldo_inicial: number; observacao?: string }) => Promise<boolean>;
  onAddGasto: (payload: { caixa_id: string; categoria: string; valor: number; descricao: string; data: string; anexo?: string; moeda?: string; valorOriginal?: number; cotacao?: number }) => Promise<boolean>;
  onUpdateGasto: (id: string, payload: { categoria: string; valor: number; descricao: string; data: string; anexo?: string; moeda?: string; valorOriginal?: number; cotacao?: number }) => Promise<boolean>;
  onDeleteGasto: (id: string) => Promise<boolean>;
}

// Currencies supported for cross-border trip expenses (Mercosul + USD)
const CURRENCIES = [
  { code: "BRL", label: "Real Brasileiro", flag: "🇧🇷" },
  { code: "USD", label: "Dólar Americano", flag: "🇺🇸" },
  { code: "ARS", label: "Peso Argentino", flag: "🇦🇷" },
  { code: "CLP", label: "Peso Chileno", flag: "🇨🇱" }
];

// Exactly the requested categories and emojis
const CATEGORIES = [
  { name: "Combustível", emoji: "⛽", color: "text-amber-500 bg-amber-500/10" },
  { name: "Pedágio", emoji: "🛣", color: "text-blue-500 bg-blue-500/10" },
  { name: "Alimentação", emoji: "🍔", color: "text-red-500 bg-red-500/10" },
  { name: "Hospedagem", emoji: "🏨", color: "text-indigo-500 bg-indigo-500/10" },
  { name: "Manutenção", emoji: "🔧", color: "text-orange-500 bg-orange-500/10" },
  { name: "Pneus", emoji: "🛞", color: "text-zinc-500 bg-zinc-500/10" },
  { name: "Oficina", emoji: "🛠", color: "text-slate-500 bg-slate-500/10" },
  { name: "Lavagem", emoji: "🚿", color: "text-cyan-500 bg-cyan-500/10" },
  { name: "Carga", emoji: "📦", color: "text-emerald-500 bg-emerald-500/10" },
  { name: "Descarga", emoji: "📤", color: "text-teal-500 bg-teal-500/10" },
  { name: "Adiantamento", emoji: "💰", color: "text-yellow-500 bg-yellow-500/10" },
  { name: "Documentação", emoji: "📄", color: "text-violet-500 bg-violet-500/10" },
  { name: "Internet", emoji: "📱", color: "text-pink-500 bg-pink-500/10" },
  { name: "Telefone", emoji: "📞", color: "text-purple-500 bg-purple-500/10" },
  { name: "Outros", emoji: "📌", color: "text-gray-500 bg-gray-500/10" }
];

export default function TruckCashManager({
  vehicles = [],
  drivers = [],
  caixas = [],
  movimentacoes = [],
  currentUserRole = "Gerente",
  onDefinirSaldo,
  onAddGasto,
  onUpdateGasto,
  onDeleteGasto
}: TruckCashManagerProps) {
  // State for selected vehicle card
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Modals state
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<CaixaMovimentacao | null>(null);

  // Criar Novo Caixa modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCaixaVehicleId, setCreateCaixaVehicleId] = useState("");
  const [createCaixaSaldoInicial, setCreateCaixaSaldoInicial] = useState("");
  const [createCaixaObservacao, setCreateCaixaObservacao] = useState("");

  const vehiclesWithoutCaixa = useMemo(() => {
    return vehicles.filter(vhc => !caixas.some(c => c.veiculo_id === vhc.id));
  }, [vehicles, caixas]);

  const handleOpenCreateModal = () => {
    const defaultVehicle = vehiclesWithoutCaixa[0]?.id || vehicles[0]?.id || "";
    setCreateCaixaVehicleId(defaultVehicle);
    setCreateCaixaSaldoInicial("");
    setCreateCaixaObservacao("");
    setIsCreateModalOpen(true);
  };

  const handleCreateCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCaixaVehicleId) {
      alert("Por favor, selecione um veículo.");
      return;
    }

    const val = parseFloat(createCaixaSaldoInicial);
    if (isNaN(val) || val < 0) {
      alert("Por favor, digite um valor de saldo válido igual ou superior a zero.");
      return;
    }

    const success = await onDefinirSaldo({
      veiculo_id: createCaixaVehicleId,
      saldo_inicial: val,
      observacao: createCaixaObservacao
    });

    if (success) {
      setIsCreateModalOpen(false);
      // Automatically select the newly created cashbox vehicle
      setSelectedVehicleId(createCaixaVehicleId);
      // Reset form fields
      setCreateCaixaVehicleId("");
      setCreateCaixaSaldoInicial("");
      setCreateCaixaObservacao("");
    }
  };

  // Form states - Saldo
  const [formSaldoInicial, setFormSaldoInicial] = useState("");
  const [formSaldoObservacao, setFormSaldoObservacao] = useState("");

  // Form states - Gasto
  const [formGastoValor, setFormGastoValor] = useState("");
  const [formGastoCategoria, setFormGastoCategoria] = useState("Combustível");
  const [formGastoDescricao, setFormGastoDescricao] = useState("");
  const [formGastoData, setFormGastoData] = useState(() => new Date().toISOString().split("T")[0]);
  const [formGastoAnexo, setFormGastoAnexo] = useState("");
  const [formGastoMoeda, setFormGastoMoeda] = useState("BRL");
  const [formGastoCotacao, setFormGastoCotacao] = useState("1");

  // Helper lookup for driver
  const getDriverForVehicle = (vehicleId: string) => {
    const fallbackMap: Record<string, string> = {
      "vhc_1": "drv_1",
      "vhc_2": "drv_2",
      "vhc_3": "drv_3",
      "vhc_4": "drv_4"
    };
    const drvId = fallbackMap[vehicleId] || "drv_1";
    const drv = drivers.find(d => d.id === drvId);
    return drv ? drv.fullName : "Motorista não designado";
  };

  // Pre-calculate statistics for the cards list (TELA PRINCIPAL)
  const vehicleCardsData = useMemo(() => {
    return vehicles.map(vhc => {
      const caixa = caixas.find(c => c.veiculo_id === vhc.id);
      const mvs = caixa ? movimentacoes.filter(m => m.caixa_id === caixa.id) : [];
      
      const totalSpent = mvs.reduce((sum, item) => sum + item.valor, 0);
      const saldoAtual = caixa ? (caixa.saldo_inicial - totalSpent) : 0;
      
      let lastMoveDate = "Nenhuma";
      if (mvs.length > 0) {
        const sorted = [...mvs].sort((a, b) => b.data.localeCompare(a.data));
        const [year, month, day] = sorted[0].data.split("-");
        lastMoveDate = year && month && day ? `${day}/${month}/${year}` : sorted[0].data;
      }

      return {
        vehicle: vhc,
        caixa,
        driverName: getDriverForVehicle(vhc.id),
        totalSpent,
        saldoAtual,
        movCount: mvs.length,
        lastMoveDate
      };
    });
  }, [vehicles, caixas, movimentacoes, drivers]);

  // Find currently active vehicle card info
  const activeCardInfo = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicleCardsData.find(item => item.vehicle.id === selectedVehicleId) || null;
  }, [selectedVehicleId, vehicleCardsData]);

  // Get movimentacoes for the currently selected vehicle caixa
  const activeMovimentacoes = useMemo(() => {
    if (!activeCardInfo || !activeCardInfo.caixa) return [];
    return movimentacoes
      .filter(m => m.caixa_id === activeCardInfo.caixa?.id)
      .sort((a, b) => b.data.localeCompare(a.data)); // chronological reverse order
  }, [activeCardInfo, movimentacoes]);

  // Resumo por categoria for the active vehicle
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      summary[cat.name] = 0;
    });
    activeMovimentacoes.forEach(m => {
      if (summary[m.categoria] !== undefined) {
        summary[m.categoria] += m.valor;
      } else {
        summary[m.categoria] = m.valor;
      }
    });
    return Object.entries(summary)
      .map(([name, value]) => {
        const catObj = CATEGORIES.find(c => c.name === name);
        return {
          name,
          value,
          emoji: catObj?.emoji || "📌",
          color: catObj?.color || "text-gray-500 bg-gray-500/10"
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeMovimentacoes]);

  // Monthly breakdown for bar chart
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const grouped: Record<string, number> = {};
    activeMovimentacoes.forEach(m => {
      const parts = m.data.split("-");
      if (parts.length === 3) {
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          const label = `${months[monthIdx]} / ${parts[0]}`;
          grouped[label] = (grouped[label] || 0) + m.valor;
        }
      }
    });
    return Object.entries(grouped).map(([month, total]) => ({ month, total }));
  }, [activeMovimentacoes]);

  // Recharts color palette
  const COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#6366f1", "#f97316", "#10b981", "#14b8a6", "#a855f7", "#ec4899", "#64748b"];

  // Open Definir Saldo Modal
  const handleOpenSaldoModal = () => {
    if (activeCardInfo && activeCardInfo.caixa) {
      setFormSaldoInicial(activeCardInfo.caixa.saldo_inicial.toString());
      setFormSaldoObservacao(activeCardInfo.caixa.observacao || "");
    } else {
      setFormSaldoInicial("");
      setFormSaldoObservacao("");
    }
    setIsSaldoModalOpen(true);
  };

  // Open Register/Edit Gasto Modal
  const handleOpenGastoModal = (gasto?: CaixaMovimentacao) => {
    if (gasto) {
      setEditingGasto(gasto);
      setFormGastoValor((gasto.valorOriginal ?? gasto.valor).toString());
      setFormGastoCategoria(gasto.categoria);
      setFormGastoDescricao(gasto.descricao);
      setFormGastoData(gasto.data);
      setFormGastoAnexo(gasto.anexo || "");
      setFormGastoMoeda(gasto.moeda || "BRL");
      setFormGastoCotacao((gasto.cotacao ?? 1).toString());
    } else {
      setEditingGasto(null);
      setFormGastoValor("");
      setFormGastoCategoria("Combustível");
      setFormGastoDescricao("");
      setFormGastoData(new Date().toISOString().split("T")[0]);
      setFormGastoAnexo("");
      setFormGastoMoeda("BRL");
      setFormGastoCotacao("1");
    }
    setIsGastoModalOpen(true);
  };

  // Handle Saldo Saving
  const handleSaveSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    
    const val = parseFloat(formSaldoInicial);
    if (isNaN(val) || val < 0) {
      alert("Por favor, digite um valor de saldo válido igual ou superior a zero.");
      return;
    }

    const success = await onDefinirSaldo({
      veiculo_id: selectedVehicleId,
      saldo_inicial: val,
      observacao: formSaldoObservacao
    });

    if (success) {
      setIsSaldoModalOpen(false);
    }
  };

  // Handle Gasto Saving
  const handleSaveGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !activeCardInfo) return;

    const valorOriginal = parseFloat(formGastoValor);
    if (isNaN(valorOriginal) || valorOriginal <= 0) {
      alert("Por favor, digite um valor de gasto válido superior a zero.");
      return;
    }
    if (!formGastoDescricao.trim()) {
      alert("Por favor, digite uma descrição para o gasto.");
      return;
    }

    const cotacao = formGastoMoeda === "BRL" ? 1 : parseFloat(formGastoCotacao);
    if (formGastoMoeda !== "BRL" && (isNaN(cotacao) || cotacao <= 0)) {
      alert("Por favor, digite uma cotação válida para conversão em Reais.");
      return;
    }
    const valorBRL = Math.round(valorOriginal * cotacao * 100) / 100;

    let success = false;
    if (editingGasto) {
      success = await onUpdateGasto(editingGasto.id, {
        categoria: formGastoCategoria,
        valor: valorBRL,
        descricao: formGastoDescricao,
        data: formGastoData,
        anexo: formGastoAnexo,
        moeda: formGastoMoeda,
        valorOriginal,
        cotacao
      });
    } else {
      if (!activeCardInfo.caixa) {
        alert("Erro: Configure o saldo inicial do caminhão antes de registrar gastos.");
        return;
      }
      success = await onAddGasto({
        caixa_id: activeCardInfo.caixa.id,
        categoria: formGastoCategoria,
        valor: valorBRL,
        descricao: formGastoDescricao,
        data: formGastoData,
        anexo: formGastoAnexo,
        moeda: formGastoMoeda,
        valorOriginal,
        cotacao
      });
    }

    if (success) {
      setIsGastoModalOpen(false);
    }
  };

  // Handle Gasto Deletion
  const handleDeleteGastoClick = async (id: string) => {
    if (confirm("Deseja realmente excluir este lançamento de gasto? O saldo será recalculado.")) {
      await onDeleteGasto(id);
    }
  };

  // Date formatter for items
  const formatMoveDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateStr === todayStr) {
      return "Hoje";
    } else if (dateStr === yesterdayStr) {
      return "Ontem";
    } else {
      const [year, month, day] = dateStr.split("-");
      return year && month && day ? `${day}/${month}/${year}` : dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TELA PRINCIPAL: Vehicle cards grid view */}
      {!selectedVehicleId ? (
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-foreground">Caixa do Caminhão</h2>
                <p className="text-xs text-muted-foreground">
                  Fundo rotativo e gastos operacionais para controle financeiro em rota de viagens de cada veículo.
                </p>
              </div>
            </div>

            <button
              id="btn-abrir-criar-caixa"
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer uppercase tracking-wider self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Caixa
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicleCardsData.map(({ vehicle, caixa, driverName, totalSpent, saldoAtual, movCount, lastMoveDate }) => {
              const isLow = caixa && (saldoAtual >= 0 && saldoAtual < 500);
              const isNegative = caixa && (saldoAtual < 0);

              return (
                <div 
                  id={`card-caminhao-${vehicle.id}`}
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className="group relative bg-card border border-border rounded-2xl p-5 hover:border-blue-500/50 cursor-pointer shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top decoration bar */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* Truck silhouette / fallback photo indicator */}
                        <div className="w-12 h-12 rounded-xl bg-muted dark:bg-muted/30 text-muted-foreground flex items-center justify-center font-bold text-lg group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors">
                          🚛
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-foreground group-hover:text-blue-600 transition-colors leading-none">
                            {vehicle.model}
                          </h3>
                          <span className="text-xs font-mono font-bold text-muted-foreground block mt-1">
                            {vehicle.plate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Driver info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                      <User className="w-3.5 h-3.5" />
                      <span>Motorista: <strong className="text-foreground">{driverName}</strong></span>
                    </div>

                    {/* Financial Values Display */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Saldo Atual</span>
                        {caixa ? (
                          <span className={`text-sm font-black font-mono leading-none ${
                            isNegative ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-500"
                          }`}>
                            R$ {saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            Definir Saldo
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Gasto</span>
                        <span className="text-sm font-black font-mono text-foreground leading-none">
                          R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="bg-muted dark:bg-muted/40 px-2 py-0.5 rounded text-foreground font-bold">
                      {movCount} {movCount === 1 ? "lançamento" : "lançamentos"}
                    </span>
                    <span>Alt: {lastMoveDate}</span>
                  </div>

                  {/* Status Indicator Badges */}
                  {!caixa ? (
                    <span className="absolute top-3 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-500/10 text-red-500 dark:bg-red-500/20 border border-red-500/30">
                      Sem Caixa
                    </span>
                  ) : isNegative ? (
                    <span className="absolute top-3 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse">
                      Negativo
                    </span>
                  ) : isLow ? (
                    <span className="absolute top-3 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
                      Baixo
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      Ativo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        
        /* DENTRO DO CAIXA: Detail view of a single truck register */
        <div className="space-y-6">
          {/* Top navigation panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-3">
              <button 
                id="btn-voltar-listagem"
                onClick={() => setSelectedVehicleId(null)}
                className="p-2.5 hover:bg-muted border border-border rounded-xl text-foreground transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xl">
                🚛
              </div>
              <div>
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  Caixa de {activeCardInfo?.vehicle.model}
                  <span className="text-xs bg-muted dark:bg-muted/40 px-2 py-0.5 rounded font-mono font-bold text-muted-foreground">
                    {activeCardInfo?.vehicle.plate}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground leading-none mt-1">
                  Motorista Responsável: <strong className="text-foreground">{activeCardInfo?.driverName}</strong>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                id="btn-definir-saldo-inicial"
                onClick={handleOpenSaldoModal}
                className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Definir Saldo Inicial
              </button>
              
              {activeCardInfo?.caixa && (
                <button
                  id="btn-registrar-gasto"
                  onClick={() => handleOpenGastoModal()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Gasto
                </button>
              )}
            </div>
          </div>

          {/* Alert messages */}
          {activeCardInfo?.caixa && (
            <>
              {activeCardInfo.saldoAtual < 0 && (
                <div id="alerta-caixa-negativo" className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-xs font-semibold">
                  <span className="text-lg leading-none">🔴</span>
                  <div>
                    <h4 className="font-bold text-sm">Caixa Negativo</h4>
                    <p className="text-xs opacity-90 mt-0.5">As despesas registradas excedem o saldo disponível neste veículo.</p>
                  </div>
                </div>
              )}
              {activeCardInfo.saldoAtual >= 0 && activeCardInfo.saldoAtual < 500 && (
                <div id="alerta-caixa-baixo" className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center gap-3 text-xs font-semibold">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-sm">Atenção</h4>
                    <p className="text-xs opacity-90 mt-0.5 font-medium">Saldo do caixa quase esgotado.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* DENTRO DO CAIXA: Resumo at the top of the view */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Saldo Inicial Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Saldo Inicial</span>
                <span className="p-2 bg-muted dark:bg-muted/40 rounded-xl text-foreground">💵</span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black font-mono text-foreground">
                  R$ {activeCardInfo?.caixa ? activeCardInfo.caixa.saldo_inicial.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
                </span>
                <p className="text-xs text-muted-foreground mt-1 truncate" title={activeCardInfo?.caixa?.observacao || "Fundo operacional"}>
                  {activeCardInfo?.caixa?.observacao || "Sem observações do saldo"}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            </div>

            {/* Total Gasto Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Total Gasto</span>
                <span className="p-2 bg-muted dark:bg-muted/40 rounded-xl text-foreground">💸</span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black font-mono text-foreground">
                  R$ {activeCardInfo?.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Soma de todas as despesas lançadas
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
            </div>

            {/* Saldo Atual Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Saldo Atual</span>
                <span className="p-2 bg-muted dark:bg-muted/40 rounded-xl text-foreground">💰</span>
              </div>
              <div className="mt-4">
                <span className={`text-2xl font-black font-mono ${(activeCardInfo?.saldoAtual || 0) < 0 ? "text-red-500 animate-pulse" : "text-emerald-500"}`}>
                  R$ {activeCardInfo?.caixa ? activeCardInfo.saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível para despesas em rota
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>
          </div>

          {!activeCardInfo?.caixa ? (
            /* Warning callout inviting to configure the initial balance */
            <div className="bg-card border border-dashed border-border p-12 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                ⚙️
              </div>
              <h3 className="text-base font-black text-foreground">Caixa Não Configurado</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Este veículo ainda não possui um saldo inicial definido. Defina o saldo inicial para começar a registrar os gastos da viagem de forma automática.
              </p>
              <button
                onClick={handleOpenSaldoModal}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-500/15 cursor-pointer transition-all"
              >
                Definir Saldo Inicial
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* HISTORICO SECTION (LEFT side on desktop) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-2xl shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Histórico de Lançamentos
                    </h3>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono font-bold text-muted-foreground">
                      {activeMovimentacoes.length} no total
                    </span>
                  </div>

                  {activeMovimentacoes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <span className="text-2xl">📝</span>
                      <p className="text-xs font-semibold mt-2">Nenhum gasto registrado neste caixa.</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">Utilize o botão "+ Registrar Gasto" no topo para começar.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {activeMovimentacoes.map(mov => {
                        const catObj = CATEGORIES.find(c => c.name === mov.categoria);
                        return (
                          <div 
                            key={mov.id}
                            className="group flex items-start justify-between p-4 rounded-xl hover:bg-muted/40 border border-border/45 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${catObj?.color || "text-gray-500 bg-gray-500/10"}`}>
                                {catObj?.emoji || "📌"}
                              </span>
                              <div>
                                <h4 className="text-xs font-black text-foreground">
                                  {mov.categoria}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {mov.descricao}
                                </p>
                                {mov.anexo && (
                                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-500 font-semibold bg-blue-500/5 px-2 py-0.5 rounded w-max">
                                    <FileText className="w-3 h-3" />
                                    <span>Anexo: {mov.anexo}</span>
                                  </div>
                                )}
                                <span className="text-[10px] text-muted-foreground/80 block mt-1 font-mono">
                                  {formatMoveDate(mov.data)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                {mov.moeda && mov.moeda !== "BRL" && (
                                  <span className="text-[10px] font-bold font-mono text-muted-foreground block leading-none mb-0.5">
                                    {CURRENCIES.find(c => c.code === mov.moeda)?.flag} {(mov.valorOriginal ?? mov.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {mov.moeda}
                                  </span>
                                )}
                                <span className="text-sm font-black font-mono text-foreground">
                                  R$ {mov.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenGastoModal(mov)}
                                  className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGastoClick(mov.id)}
                                  className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CHARTS SECTION */}
                {activeMovimentacoes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
                        Distribuição por Categoria
                      </h4>
                      <div className="h-[200px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categorySummary}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categorySummary.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legends */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center text-[10px] font-semibold text-muted-foreground">
                        {categorySummary.map((item, index) => (
                          <div key={item.name} className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span>{item.emoji} {item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="bg-card border border-border p-5 rounded-2xl shadow-xs">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
                        Gastos por Mês
                      </h4>
                      <div className="h-[200px] w-full">
                        {monthlyData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                            Sem dados temporais disponíveis.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                              <XAxis dataKey="month" stroke="currentColor" className="text-muted-foreground" fontSize={10} tickLine={false} />
                              <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={9} tickLine={false} />
                              <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RESUMO POR CATEGORIA (RIGHT side on desktop) */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl shadow-xs p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground pb-3 border-b border-border flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5" />
                    Resumo por Categoria
                  </h3>

                  {categorySummary.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-xs font-medium">
                      Nenhuma despesa para resumir.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categorySummary.map((item, index) => {
                        const percent = activeCardInfo?.totalSpent ? (item.value / activeCardInfo.totalSpent) * 100 : 0;
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-foreground">
                                <span className={`p-1 rounded-lg ${item.color}`}>
                                  {item.emoji}
                                </span>
                                {item.name}
                              </span>
                              <span className="text-foreground font-mono">
                                R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            
                            <div className="w-full bg-muted dark:bg-muted/40 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-300" 
                                style={{ 
                                  backgroundColor: COLORS[index % COLORS.length],
                                  width: `${percent}%` 
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono block text-right">
                              {percent.toFixed(1)}% do total
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PREMIUM BRANDING PLACEHOLDER */}
                <div className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 border border-blue-500/10 p-5 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <strong className="font-extrabold uppercase tracking-wider text-[10px]">Conciliação Automática</strong>
                  </div>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Sempre que você insere, edita ou remove um gasto, o saldo total disponível para o motorista deste caminhão é sincronizado de forma estrita, garantindo auditoria em tempo real das verbas de estrada.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* MODAL: Definir Saldo Inicial */}
      {isSaldoModalOpen && (
        <div id="modal-saldo-inicial" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-black text-foreground">Definir Saldo Inicial</h3>
              <button 
                id="btn-close-modal-saldo"
                onClick={() => setIsSaldoModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveSaldo} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Valor do Saldo Inicial (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-bold">R$</span>
                    <input
                      id="input-saldo-inicial-valor"
                      type="number"
                      step="0.01"
                      placeholder="20.000,00"
                      value={formSaldoInicial}
                      onChange={(e) => setFormSaldoInicial(e.target.value)}
                      required
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none font-mono font-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Observação / Destinação
                  </label>
                  <textarea
                    id="input-saldo-inicial-obs"
                    placeholder="Ex: Fundo operacional para despesas na rota BR-116..."
                    value={formSaldoObservacao}
                    onChange={(e) => setFormSaldoObservacao(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2 outline-none h-24 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-5 border-t border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSaldoModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-salvar-saldo-inicial"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-lg cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar / Editar Gasto */}
      {isGastoModalOpen && (
        <div id="modal-gasto" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-black text-foreground">
                {editingGasto ? "Editar Lançamento de Gasto" : "Registrar Novo Gasto"}
              </h3>
              <button 
                id="btn-close-modal-gasto"
                onClick={() => setIsGastoModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveGasto} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Moeda do Gasto
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CURRENCIES.map(cur => (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => {
                          setFormGastoMoeda(cur.code);
                          if (cur.code === "BRL") setFormGastoCotacao("1");
                        }}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                          formGastoMoeda === cur.code
                            ? "bg-blue-600/15 border-blue-500/60 text-blue-500"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                        }`}
                        title={cur.label}
                      >
                        <span className="text-base leading-none">{cur.flag}</span>
                        {cur.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-muted-foreground block">
                      Valor ({formGastoMoeda})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-bold">
                        {CURRENCIES.find(c => c.code === formGastoMoeda)?.flag}
                      </span>
                      <input
                        id="input-gasto-valor"
                        type="number"
                        step="0.01"
                        placeholder="350,00"
                        value={formGastoValor}
                        onChange={(e) => setFormGastoValor(e.target.value)}
                        required
                        className="w-full bg-muted border border-border text-foreground text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none font-mono font-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-muted-foreground block">
                      Data do Gasto
                    </label>
                    <input
                      id="input-gasto-data"
                      type="date"
                      value={formGastoData}
                      onChange={(e) => setFormGastoData(e.target.value)}
                      required
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2.5 outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                {formGastoMoeda !== "BRL" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-muted-foreground block">
                      Cotação (1 {formGastoMoeda} = R$)
                    </label>
                    <input
                      id="input-gasto-cotacao"
                      type="number"
                      step="0.0001"
                      placeholder="Ex: 5.35"
                      value={formGastoCotacao}
                      onChange={(e) => setFormGastoCotacao(e.target.value)}
                      required
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2.5 outline-none font-mono font-bold"
                    />
                    {formGastoValor && formGastoCotacao && !isNaN(parseFloat(formGastoValor)) && !isNaN(parseFloat(formGastoCotacao)) && (
                      <p className="text-[10.5px] text-muted-foreground font-mono pt-0.5">
                        ≈ R$ {(parseFloat(formGastoValor) * parseFloat(formGastoCotacao)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} equivalentes
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Categoria do Gasto
                  </label>
                  <select
                    id="select-gasto-categoria"
                    value={formGastoCategoria}
                    onChange={(e) => setFormGastoCategoria(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2.5 outline-none font-bold"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Descrição / Comprovante
                  </label>
                  <input
                    id="input-gasto-descricao"
                    type="text"
                    placeholder="Ex: Almoço e janta no Posto Fiscal..."
                    value={formGastoDescricao}
                    onChange={(e) => setFormGastoDescricao(e.target.value)}
                    required
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2.5 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Anexo / Comprovante Digital (Opcional)
                  </label>
                  <input
                    id="input-gasto-anexo"
                    type="text"
                    placeholder="Ex: PDF, URL ou Identificador de Recibo..."
                    value={formGastoAnexo}
                    onChange={(e) => setFormGastoAnexo(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2.5 outline-none font-medium font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-5 border-t border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGastoModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-salvar-gasto"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-lg cursor-pointer shadow-md shadow-blue-500/10"
                >
                  {editingGasto ? "Atualizar" : "Salvar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Criar Novo Caixa */}
      {isCreateModalOpen && (
        <div id="modal-criar-caixa" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[calc(100vh-2rem)]">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-black text-foreground">Criar Novo Caixa de Veículo</h3>
              </div>
              <button 
                id="btn-close-modal-criar-caixa"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateCaixa} className="flex-1 flex flex-col overflow-hidden text-left">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Selecionar Veículo / Caminhão
                  </label>
                  <select
                    id="select-criar-caixa-veiculo"
                    value={createCaixaVehicleId}
                    onChange={(e) => setCreateCaixaVehicleId(e.target.value)}
                    required
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2.5 outline-none font-bold"
                  >
                    <option value="" disabled>Selecione um veículo...</option>
                    {vehicles.map(vhc => {
                      const hasCaixa = caixas.some(c => c.veiculo_id === vhc.id);
                      return (
                        <option key={vhc.id} value={vhc.id}>
                          {hasCaixa ? "📌 [Com Caixa] " : "🚛 [Sem Caixa] "} {vhc.plate} - {vhc.model} ({vhc.brand})
                        </option>
                      );
                    })}
                  </select>
                  {createCaixaVehicleId && caixas.some(c => c.veiculo_id === createCaixaVehicleId) && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10.5px] text-amber-500 flex items-start gap-1.5 font-sans mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>Atenção:</strong> Este veículo já possui um caixa ativo. Se prosseguir, você estará redefinindo o saldo inicial e reajustando o saldo atual do veículo.
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">
                    Selecione um veículo da frota. Se o veículo já possuir um caixa ativo, o saldo inicial e observações serão atualizados.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Saldo Inicial (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-bold">R$</span>
                    <input
                      id="input-criar-caixa-saldo"
                      type="number"
                      step="0.01"
                      placeholder="10.000,00"
                      value={createCaixaSaldoInicial}
                      onChange={(e) => setCreateCaixaSaldoInicial(e.target.value)}
                      required
                      className="w-full bg-muted border border-border text-foreground text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none font-mono font-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-muted-foreground block">
                    Observação / Destinação do Fundo
                  </label>
                  <textarea
                    id="input-criar-caixa-obs"
                    placeholder="Ex: Fundo operacional para custos em viagem de rota regional..."
                    value={createCaixaObservacao}
                    onChange={(e) => setCreateCaixaObservacao(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-2 outline-none h-20 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-5 border-t border-border flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirmar-criar-caixa"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-lg cursor-pointer shadow-md shadow-blue-500/10 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Criar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
