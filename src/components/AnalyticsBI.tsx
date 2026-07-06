import { useState, useEffect } from "react";
import { Freight, Driver, Vehicle, Expense, Refuel } from "../types";
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Coins, DollarSign, Activity, Users, Truck } from "lucide-react";
import RadialGauge from "./RadialGauge";

interface AnalyticsBIProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
  expenses: Expense[];
  refuels: Refuel[];
}

export default function AnalyticsBI({ freights, drivers, vehicles, expenses, refuels }: AnalyticsBIProps) {
  // Alíquota de imposto e comissão padrão configuradas no Perfil da Empresa
  // (usadas nos anéis "Impostos" e "Comissão" — editáveis também direto no anel)
  const [taxRate, setTaxRate] = useState(0);
  const [commissionRateOverride, setCommissionRateOverride] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/company")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.company?.taxRate) setTaxRate(Number(data.company.taxRate) || 0);
          if (data.company?.commissionRate) setCommissionRateOverride(Number(data.company.commissionRate));
        }
      })
      .catch(() => {});
  }, []);

  const saveCompanyField = async (field: "taxRate" | "commissionRate", value: number) => {
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: String(value) })
      });
      const data = await res.json();
      if (data.success) {
        if (field === "taxRate") setTaxRate(value);
        else setCommissionRateOverride(value);
      }
    } catch (err) {
      // silent
    }
  };
  // 1. Prepare Month-over-Month dataset (Faturamento vs Despesas) dynamically
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const targetYear = String(new Date().getFullYear());

  const dynamicMonthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i + 1;
    const monthStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
    const yearMonth = `${targetYear}-${monthStr}`;
    
    // Sum billing for this month
    const monthFreights = freights.filter(f => f.date.startsWith(yearMonth) && f.status !== "Cancelado");
    const billing = monthFreights.reduce((sum, f) => sum + (f.financial?.value || 0), 0);
    
    // Sum direct expenses for this month
    const monthExpenses = expenses.filter(e => e.date.startsWith(yearMonth));
    const directExpensesSum = monthExpenses.reduce((sum, e) => sum + (e.value || 0), 0);
    
    // Sum refuels for this month
    const monthRefuels = refuels.filter(r => r.date.startsWith(yearMonth));
    const refuelsSum = monthRefuels.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    
    // Sum freight-specific operational costs (commission, toll, food, lodging, otherExpenses)
    const freightExpensesSum = monthFreights.reduce((sum, f) => {
      const fin = f.financial;
      if (!fin) return sum;
      return sum + (fin.commission || 0) + (fin.toll || 0) + (fin.food || 0) + (fin.lodging || 0) + (fin.otherExpenses || 0);
    }, 0);
    
    const totalMonthCosts = directExpensesSum + refuelsSum + freightExpensesSum;
    
    return {
      name: monthNames[i],
      billing,
      expenses: totalMonthCosts
    };
  });

  // Keep at least Jan to Jun visible, or up to the latest month containing any data
  const maxMonthIdx = dynamicMonthlyData.reduce((max, m, idx) => {
    if (m.billing > 0 || m.expenses > 0) {
      return Math.max(max, idx);
    }
    return max;
  }, 5); // default to June (idx 5)

  const monthsList = dynamicMonthlyData.slice(0, maxMonthIdx + 1);

  // 2. Prepare Cost breakdown by Category (for Pie Chart)
  const categorySummary: { [key: string]: number } = {
    "Combustível": 0,
    "Alimentação": 0,
    "Hospedagem": 0,
    "Pedágio": 0,
    "Oficina": 0,
    "Pneus": 0,
    "Outros": 0
  };

  // Add direct expenses
  expenses.forEach(e => {
    const cat = categorySummary[e.category] !== undefined ? e.category : "Outros";
    categorySummary[cat] += (e.value || 0);
  });

  // Add refuels under Combustível
  refuels.forEach(r => {
    categorySummary["Combustível"] += (r.totalValue || 0);
  });

  // Add freight-specific costs
  freights.filter(f => f.status !== "Cancelado").forEach(f => {
    const fin = f.financial;
    if (!fin) return;
    categorySummary["Alimentação"] += (fin.food || 0);
    categorySummary["Hospedagem"] += (fin.lodging || 0);
    categorySummary["Pedágio"] += (fin.toll || 0);
    categorySummary["Outros"] += (fin.commission || 0) + (fin.otherExpenses || 0);
  });

  // Filter out categories with 0 values to keep the Pie chart clean
  const pieData = Object.keys(categorySummary)
    .map(cat => ({
      name: cat,
      value: categorySummary[cat] || 0
    }))
    .filter(item => item.value > 0);

  const isPieDataEmpty = pieData.length === 0;
  const finalPieData = isPieDataEmpty ? [{ name: "Sem custos", value: 1 }] : pieData;

  const COLORS = ["#3b82f6", "#22c55e", "#06b6d4", "#10b981", "#0ea5e9", "#14b8a6", "#6b7280"];

  // 3. Driver Ranking (Billing generated per driver)
  const driverBilling: { [key: string]: { name: string; value: number } } = {};
  drivers.forEach(d => {
    driverBilling[d.id] = { name: d.fullName, value: 0 };
  });

  freights.filter(f => f.status === "Finalizado").forEach(f => {
    if (driverBilling[f.driverId]) {
      driverBilling[f.driverId].value += (f.financial?.value || 0);
    }
  });

  const driverRankingData = Object.values(driverBilling)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  // 4. Vehicle utilization (KM rodados per vehicle)
  const vehicleMileage: { [key: string]: { name: string; value: number } } = {};
  vehicles.forEach(v => {
    vehicleMileage[v.id] = { name: `${v.brand} ${v.plate}`, value: 0 };
  });

  freights.filter(f => f.status === "Finalizado").forEach(f => {
    if (vehicleMileage[f.vehicleId]) {
      vehicleMileage[f.vehicleId].value += (f.mileage?.total || 0);
    }
  });

  const vehicleMileageData = Object.values(vehicleMileage)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5

  // High-level metrics
  const totalFaturamento = freights
    .filter(f => f.status !== "Cancelado")
    .reduce((sum, f) => sum + (f.financial?.value || 0), 0);

  // Total real costs across ALL months
  const totalDirectExpenses = expenses.reduce((sum, e) => sum + (e.value || 0), 0);
  const totalRefuelsCost = refuels.reduce((sum, r) => sum + (r.totalValue || 0), 0);
  const totalFreightExpenses = freights
    .filter(f => f.status !== "Cancelado")
    .reduce((sum, f) => {
      const fin = f.financial;
      if (!fin) return sum;
      return sum + (fin.commission || 0) + (fin.toll || 0) + (fin.food || 0) + (fin.lodging || 0) + (fin.otherExpenses || 0);
    }, 0);

  const totalDespesas = totalDirectExpenses + totalRefuelsCost + totalFreightExpenses;

  const averageMargin = totalFaturamento > 0
    ? ((totalFaturamento - totalDespesas) / totalFaturamento * 100).toFixed(1)
    : "0.0";

  // Gauge metrics (Indicadores de Performance, acumulado)
  const totalComissao = freights
    .filter(f => f.status !== "Cancelado")
    .reduce((sum, f) => sum + (f.financial?.commission || 0), 0);
  const totalKmAcumulado = freights
    .filter(f => f.status !== "Cancelado")
    .reduce((sum, f) => sum + (f.mileage?.total || 0), 0);
  const totalLitrosAcumulado = refuels.reduce((sum, r) => sum + (r.liters || 0), 0);
  const averageKmL = totalLitrosAcumulado > 0 ? totalKmAcumulado / totalLitrosAcumulado : 0;

  const impostosPercentage = taxRate;
  // Anel do valor de Combustível usa a mesma proporção (gasto/despesas) do anel "% Gasto c/ Combustível", mas exibe o valor em R$
  const fuelSpendRingPercentage = totalDespesas > 0 ? (totalRefuelsCost / totalDespesas) * 100 : 0;
  const comissaoPercentageCalculated = totalFaturamento > 0 ? (totalComissao / totalFaturamento) * 100 : 0;
  const comissaoPercentage = commissionRateOverride !== null ? commissionRateOverride : comissaoPercentageCalculated;
  // KM/L não é um percentual: normaliza visualmente contra um teto de referência de 3.5 km/L (eficiência típica de caminhões)
  const kmLRingPercentage = Math.min(100, (averageKmL / 3.5) * 100);
  const fuelSpendPercentageOfExpenses = totalDespesas > 0 ? (totalRefuelsCost / totalDespesas) * 100 : 0;

  return (
    <div id="modulo-analytics-container" className="space-y-6">
      {/* Visual Analytics KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border text-foreground rounded-xl p-5 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="p-3.5 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/15">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400">Faturamento Acumulado 2026</span>
            <p className="text-xl font-black mt-1">R$ {totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Soma de todas as viagens concluídas</p>
          </div>
        </div>

        <div className="bg-card border border-border text-foreground rounded-xl p-5 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="p-3.5 bg-red-600/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded-xl border border-red-500/15">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400">Custos Totais Operacionais</span>
            <p className="text-xl font-black mt-1">R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-0.5">Combustíveis, pedágios e manutenção</p>
          </div>
        </div>

        <div className="bg-card border border-border text-foreground rounded-xl p-5 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="p-3.5 bg-emerald-600/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/15">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400">Margem Operacional Média</span>
            <p className="text-xl font-black mt-1">{averageMargin}%</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Retorno operacional do negócio</p>
          </div>
        </div>
      </div>

      {/* Radial Gauges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <RadialGauge label="Impostos" value={impostosPercentage} editable onEdit={(v) => saveCompanyField("taxRate", v)} />
        <RadialGauge label="Combustível" value={fuelSpendRingPercentage} displayValue={`R$ ${totalRefuelsCost.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} />
        <RadialGauge label="Comissão" value={comissaoPercentage} editable onEdit={(v) => saveCompanyField("commissionRate", v)} />
        <RadialGauge label="KM/L (média)" value={kmLRingPercentage} displayValue={`${averageKmL.toFixed(2)}`} />
        <RadialGauge label="Margem Lucro" value={Number(averageMargin)} />
        <RadialGauge label="% Gasto c/ Combustível" value={fuelSpendPercentageOfExpenses} />
      </div>

      {/* MoM Performance Chart Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-500" />
          Desempenho Financeiro da Transportadora (Acumulado)
        </h3>
        {(() => {
          const totalBilling = monthsList.reduce((sum, m) => sum + (m.billing || 0), 0);
          const totalExpenses = monthsList.reduce((sum, m) => sum + (m.expenses || 0), 0);
          const taxAmount = taxRate > 0 ? totalBilling * (taxRate / 100) : 0;
          const grandTotal = totalBilling + totalExpenses + taxAmount;
          const financialData = [
            { name: "Faturamento", value: totalBilling, color: "#3b82f6" },
            { name: "Custos Operacionais", value: totalExpenses, color: "#10b981" },
            { name: `Impostos (${taxRate}%)`, value: taxAmount, color: "#f59e0b" }
          ].filter(d => d.value > 0);

          if (financialData.length === 0) {
            return <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Nenhum dado financeiro disponível.</div>;
          }

          return (
            <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
              <div className="h-[220px] w-[220px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={financialData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                      {financialData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Total"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Total</span>
                  <span className="text-base font-black font-mono text-foreground">R$ {grandTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="space-y-3">
                {financialData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}:</span>
                    <span className="text-foreground font-mono">R$ {d.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                    <span className="text-muted-foreground font-mono">({grandTotal > 0 ? ((d.value / grandTotal) * 100).toFixed(0) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Cost category & rankings Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown (Pie) */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 mb-4">
            Distribuição de Custos
          </h3>
          <div className="h-[180px] w-full relative flex items-center justify-center font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {finalPieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isPieDataEmpty ? "#9ca3af" : COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => isPieDataEmpty ? "R$ 0" : `R$ ${Number(val).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-4 text-[11px]">
            {isPieDataEmpty ? (
              <p className="text-gray-400 text-center italic mt-4">Nenhum custo registrado.</p>
            ) : (
              pieData.map((data, idx) => (
                <div key={idx} className="flex justify-between items-center text-gray-600 font-sans">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{data.name}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">R$ {data.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top drivers ranking */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 mb-4 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            Ranking Motoristas (Faturamento)
          </h3>
          <div className="h-[220px] w-full font-sans text-xs overflow-y-auto pr-1">
            {driverRankingData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado disponível.</div>
            ) : (
              <div className="space-y-3.5">
                {(() => {
                  const maxVal = Math.max(...driverRankingData.map((d: any) => d.value), 1);
                  return driverRankingData.map((item: any) => {
                    const pct = (item.value / maxVal) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-foreground truncate">{item.name}</span>
                          <span className="text-foreground font-mono shrink-0 ml-2">R$ {Number(item.value).toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2 text-center">Motoristas que mais geraram receita líquida este ano.</p>
        </div>

        {/* Top vehicles ranking */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 mb-4 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-500" />
            Quilometragem por Veículo (Uso)
          </h3>
          <div className="h-[220px] w-full font-sans text-xs overflow-y-auto pr-1">
            {vehicleMileageData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum dado disponível.</div>
            ) : (
              <div className="space-y-3.5">
                {(() => {
                  const maxVal = Math.max(...vehicleMileageData.map((d: any) => d.value), 1);
                  return vehicleMileageData.map((item: any) => {
                    const pct = (item.value / maxVal) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-foreground truncate">{item.name}</span>
                          <span className="text-foreground font-mono shrink-0 ml-2">{Number(item.value).toLocaleString("pt-BR")} KM</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2 text-center">Desgaste e rodagem total calculados da frota.</p>
        </div>
      </div>
    </div>
  );
}
