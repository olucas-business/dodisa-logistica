import { Freight, Driver, Vehicle, Expense, Refuel } from "../types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { TrendingUp, Coins, DollarSign, Activity, Users, Truck } from "lucide-react";

function RadialGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const data = [{ value: Math.min(100, Math.max(0, value)) }];
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={8}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} fill={color} background={{ fill: "var(--muted)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black font-mono" style={{ color }}>{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

interface AnalyticsBIProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
  expenses: Expense[];
  refuels: Refuel[];
}

export default function AnalyticsBI({ freights, drivers, vehicles, expenses, refuels }: AnalyticsBIProps) {
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

  const COLORS = ["#ef4444", "#f97316", "#06b6d4", "#8b5cf6", "#6b7280", "#10b981", "#ec4899"];

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

  // Gauge metrics
  const pctFretesFinalizados = freights.length > 0
    ? (freights.filter(f => f.status === "Finalizado").length / freights.length) * 100
    : 0;
  const pctFrotaAtiva = vehicles.length > 0
    ? (vehicles.filter(v => v.status === "Ativo" || v.status === "Em Viagem").length / vehicles.length) * 100
    : 0;
  const pctMotoristasAtivos = drivers.length > 0
    ? (drivers.filter(d => d.status === "Ativo" || d.status === "Em Viagem").length / drivers.length) * 100
    : 0;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RadialGauge label="Margem Operacional" value={Number(averageMargin)} color="#10b981" />
        <RadialGauge label="Fretes Finalizados" value={pctFretesFinalizados} color="#3b82f6" />
        <RadialGauge label="Frota Ativa" value={pctFrotaAtiva} color="#06b6d4" />
        <RadialGauge label="Motoristas Ativos" value={pctMotoristasAtivos} color="#22c55e" />
      </div>

      {/* MoM Performance Chart Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-500" />
          Desempenho Financeiro da Transportadora (MoM)
        </h3>
        <div className="h-[300px] w-full font-sans text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthsList} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(val) => `R$ ${val/1000}k`} tickLine={false} />
              <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, ""]} />
              <Legend />
              <Area type="monotone" name="Faturamento" dataKey="billing" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBilling)" />
              <Area type="monotone" name="Custos Operacionais" dataKey="expenses" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
          <div className="h-[220px] w-full font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driverRankingData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDriverBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} width={80} />
                <Tooltip formatter={(val) => `R$ ${Number(val).toLocaleString()}`} />
                <Bar dataKey="value" name="Faturamento" fill="url(#colorDriverBar)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2 text-center">Motoristas que mais geraram receita líquida este ano.</p>
        </div>

        {/* Top vehicles ranking */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-2.5 mb-4 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-500" />
            Quilometragem por Veículo (Uso)
          </h3>
          <div className="h-[220px] w-full font-sans text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleMileageData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVehicleBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} width={80} />
                <Tooltip formatter={(val) => `${Number(val).toLocaleString()} KM`} />
                <Bar dataKey="value" name="Uso (KM)" fill="url(#colorVehicleBar)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2 text-center">Desgaste e rodagem total calculados da frota.</p>
        </div>
      </div>
    </div>
  );
}
