import React, { useState } from "react";
import { Refuel, Driver, Vehicle } from "../types";
import SessionAnnotations from "./SessionAnnotations";
import { ResponsiveContainer, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart, AreaChart, Area } from "recharts";
import { Plus, Search, Calendar, MapPin, Trash2, Edit2, CheckCircle, Fuel, Gauge, Route, Wallet, Droplets } from "lucide-react";

const REFUEL_CHART_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#6b7280"];

interface RefuelManagerProps {
  refuels: Refuel[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onAddRefuel: (r: Partial<Refuel>) => Promise<boolean>;
  onDeleteRefuel: (id: string) => Promise<boolean>;
}

export default function RefuelManager({
  refuels,
  drivers,
  vehicles,
  onAddRefuel,
  onDeleteRefuel
}: RefuelManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || "");
  const [driverId, setDriverId] = useState(drivers[0]?.id || "");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [gasStation, setGasStation] = useState("Posto Petrobras");
  const [odometer, setOdometer] = useState("");

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setVehicleId(vehicles[0]?.id || "");
    setDriverId(drivers[0]?.id || "");
    setLiters("");
    setPricePerLiter("");
    setGasStation("Posto Petrobras");
    setOdometer("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liters || !pricePerLiter || !gasStation) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const litersNum = Number(liters);
    const priceNum = Number(pricePerLiter);
    const total = litersNum * priceNum;

    const payload: Partial<Refuel> = {
      date,
      vehicleId,
      driverId,
      liters: litersNum,
      pricePerLiter: priceNum,
      totalValue: total,
      gasStation,
      odometer: odometer ? Number(odometer) : undefined,
      receipt: ""
    };

    const ok = await onAddRefuel(payload);
    if (ok) {
      // Also register this fuel log as an expense in the DB
      try {
        const vehiclePlate = vehicles.find(v => v.id === vehicleId)?.plate || "";
        const driverName = drivers.find(d => d.id === driverId)?.fullName || "";

        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            category: "Combustível",
            value: total,
            description: `Abastecimento de ${litersNum}L (${gasStation}) - Placa ${vehiclePlate} - Motorista ${driverName}`,
            receipt: ""
          })
        });
      } catch (err) {
        console.error("Erro ao registrar despesa de combustível:", err);
      }

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
    await onDeleteRefuel(id);
    setConfirmDeleteId(null);
  };

  const filteredRefuels = refuels.filter(r => {
    const driverName = drivers.find(d => d.id === r.driverId)?.fullName || "";
    const vehiclePlate = vehicles.find(v => v.id === r.vehicleId)?.plate || "";
    return driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gasStation.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Chart data: spend by vehicle plate, and spend by month
  const vehicleTotals = Object.values(
    refuels.reduce((acc: Record<string, { plate: string; value: number }>, r) => {
      const plate = vehicles.find(v => v.id === r.vehicleId)?.plate || "N/A";
      acc[plate] = acc[plate] || { plate, value: 0 };
      acc[plate].value += r.totalValue || 0;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.value - a.value).slice(0, 8);

  const monthlyFuelTotals = Object.values(
    refuels.reduce((acc: Record<string, { month: string; value: number }>, r) => {
      const month = (r.date || "").slice(0, 7);
      if (!month) return acc;
      acc[month] = acc[month] || { month, value: 0 };
      acc[month].value += r.totalValue || 0;
      return acc;
    }, {})
  ).sort((a: any, b: any) => a.month.localeCompare(b.month));

  // Spend/count by gas station ("onde abasteceu")
  const stationTotals = Object.values(
    refuels.reduce((acc: Record<string, { station: string; value: number; count: number }>, r) => {
      const station = r.gasStation || "Não informado";
      acc[station] = acc[station] || { station, value: 0, count: 0 };
      acc[station].value += r.totalValue || 0;
      acc[station].count += 1;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.value - a.value).slice(0, 8);

  // Fuel efficiency: compute Km rodado / Km-L between consecutive refuels of the same vehicle (requires odometer)
  const refuelsWithEfficiency = (() => {
    const byVehicle: Record<string, Refuel[]> = {};
    refuels.forEach(r => {
      byVehicle[r.vehicleId] = byVehicle[r.vehicleId] || [];
      byVehicle[r.vehicleId].push(r);
    });
    const enriched: Record<string, { kmSinceLast: number | null; kmPerLiter: number | null }> = {};
    Object.values(byVehicle).forEach(list => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < sorted.length; i++) {
        const curr = sorted[i];
        const prev = sorted[i - 1];
        if (prev && curr.odometer && prev.odometer && curr.odometer > prev.odometer) {
          const kmSinceLast = curr.odometer - prev.odometer;
          enriched[curr.id] = { kmSinceLast, kmPerLiter: curr.liters > 0 ? kmSinceLast / curr.liters : null };
        } else {
          enriched[curr.id] = { kmSinceLast: null, kmPerLiter: null };
        }
      }
    });
    return enriched;
  })();

  const efficiencyChartData = [...refuels]
    .filter(r => refuelsWithEfficiency[r.id]?.kmPerLiter)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({
      date: r.date.slice(5),
      kmPerLiter: Number((refuelsWithEfficiency[r.id]?.kmPerLiter || 0).toFixed(2)),
      liters: r.liters
    }));

  // Summary KPIs
  const totalLitersAll = refuels.reduce((sum, r) => sum + (r.liters || 0), 0);
  const totalValueAll = refuels.reduce((sum, r) => sum + (r.totalValue || 0), 0);
  const avgValuePerRefuel = refuels.length > 0 ? totalValueAll / refuels.length : 0;
  const avgLitersPerRefuel = refuels.length > 0 ? totalLitersAll / refuels.length : 0;
  const validEfficiencyEntries = Object.values(refuelsWithEfficiency).filter(e => e.kmPerLiter !== null) as { kmSinceLast: number; kmPerLiter: number }[];
  const avgKmPerLiter = validEfficiencyEntries.length > 0
    ? validEfficiencyEntries.reduce((sum, e) => sum + e.kmPerLiter, 0) / validEfficiencyEntries.length
    : null;
  const totalKmTracked = validEfficiencyEntries.reduce((sum, e) => sum + e.kmSinceLast, 0);

  return (
    <div id="modulo-abastecimento-container" className="space-y-6">
      {/* KPI Summary Row - Diesel is the company's largest expense, deserves top-level visibility */}
      {refuels.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1"><Wallet className="w-3 h-3" />Gasto Total</span>
            <p className="text-lg font-black font-mono text-gray-900 dark:text-gray-100 mt-1">R$ {totalValueAll.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1"><Droplets className="w-3 h-3" />Litros Totais</span>
            <p className="text-lg font-black font-mono text-gray-900 dark:text-gray-100 mt-1">{totalLitersAll.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} L</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1"><Route className="w-3 h-3" />Média / Abastecimento</span>
            <p className="text-lg font-black font-mono text-gray-900 dark:text-gray-100 mt-1">R$ {avgValuePerRefuel.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
            <span className="text-[9px] text-gray-400 dark:text-gray-500">{avgLitersPerRefuel.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} L em média</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1"><Gauge className="w-3 h-3" />Consumo Médio</span>
            <p className="text-lg font-black font-mono text-gray-900 dark:text-gray-100 mt-1">{avgKmPerLiter !== null ? `${avgKmPerLiter.toFixed(2)} Km/L` : "—"}</p>
            <span className="text-[9px] text-gray-400 dark:text-gray-500">{avgKmPerLiter === null ? "Informe o odômetro" : "Baseado no odômetro"}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="text-[9.5px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1"><Route className="w-3 h-3" />Km Rastreado</span>
            <p className="text-lg font-black font-mono text-gray-900 dark:text-gray-100 mt-1">{totalKmTracked.toLocaleString("pt-BR")} Km</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {refuels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-blue-500" />
              Gasto por Veículo
            </h4>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vehicleTotals} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {vehicleTotals.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={REFUEL_CHART_COLORS[index % REFUEL_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {vehicleTotals.map((item: any, index) => (
                <div key={item.plate} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REFUEL_CHART_COLORS[index % REFUEL_CHART_COLORS.length] }} />
                  <span>{item.plate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Combustível por Mês
            </h4>
            <div className="h-[220px] w-full">
              {monthlyFuelTotals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">Sem dados temporais disponíveis.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyFuelTotals} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="refuelMonthlyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="month" stroke="currentColor" className="text-gray-400" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-gray-400" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(val: any) => [`R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Combustível"]} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#refuelMonthlyGrad)" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Onde Abasteceu (Por Posto)
            </h4>
            <div className="h-[220px] w-full overflow-y-auto pr-1">
              {stationTotals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">Sem dados de postos disponíveis.</div>
              ) : (
                <div className="space-y-3.5">
                  {(() => {
                    const maxVal = Math.max(...stationTotals.map((s: any) => s.value), 1);
                    return stationTotals.map((item: any, index: number) => {
                      const color = REFUEL_CHART_COLORS[index % REFUEL_CHART_COLORS.length];
                      const pct = (item.value / maxVal) * 100;
                      return (
                        <div key={item.station} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 truncate">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="truncate">{item.station}</span>
                            </span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono shrink-0 ml-2">
                              R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: color, width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-500" />
              Consumo (Km/L) por Abastecimento
            </h4>
            <div className="h-[220px] w-full">
              {efficiencyChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 text-center px-6">Preencha o odômetro nos abastecimentos para visualizar a evolução do consumo.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={efficiencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="date" stroke="currentColor" className="text-gray-400" fontSize={9} tickLine={false} />
                    <YAxis stroke="currentColor" className="text-gray-400" fontSize={9} tickLine={false} />
                    <Tooltip formatter={(val: any) => [`${val} Km/L`, "Consumo"]} />
                    <Line type="monotone" dataKey="kmPerLiter" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 p-4 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, motorista ou posto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrar Abastecimento
        </button>
      </div>

      {/* Fuel logs list table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="p-3 pl-5">Data</th>
                <th className="p-3">Veículo / Placa</th>
                <th className="p-3">Motorista</th>
                <th className="p-3">Posto de Combustível</th>
                <th className="p-3 text-right">Liters</th>
                <th className="p-3 text-right">Preço por Litro</th>
                <th className="p-3 text-right">Consumo (Km/L)</th>
                <th className="p-3 text-right pr-5">Valor Total Pago</th>
                <th className="p-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-mono">
              {filteredRefuels.map((r) => {
                const driver = drivers.find(d => d.id === r.driverId);
                const vehicle = vehicles.find(v => v.id === r.vehicleId);

                return (
                  <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 text-gray-900 dark:text-gray-100 transition-all font-sans">
                    <td className="p-3 pl-5 font-mono text-gray-500 dark:text-gray-400">{r.date}</td>
                    <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "Sem placa"}</td>
                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{driver?.fullName || "Não vinculado"}</td>
                    <td className="p-3 text-gray-650 dark:text-gray-400 flex items-center gap-1.5 pt-4">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      {r.gasStation}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-gray-800 dark:text-gray-200">{r.liters.toLocaleString("pt-BR")} L</td>
                    <td className="p-3 text-right font-mono text-gray-500 dark:text-gray-400">R$ {r.pricePerLiter.toFixed(3)}</td>
                    <td className="p-3 text-right font-mono text-gray-500 dark:text-gray-400">
                      {refuelsWithEfficiency[r.id]?.kmPerLiter ? `${refuelsWithEfficiency[r.id]?.kmPerLiter?.toFixed(2)} Km/L` : "—"}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-red-600 dark:text-red-400 pr-5">R$ {r.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className={`p-1.5 transition-all duration-300 rounded inline-flex border items-center gap-1 text-xs font-semibold cursor-pointer ${
                          confirmDeleteId === r.id
                            ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 px-2 animate-pulse"
                            : "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-350"
                        }`}
                        title={confirmDeleteId === r.id ? "Confirmar exclusão" : "Deletar registro de abastecimento"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDeleteId === r.id && "Confirmar?"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRefuels.length === 0 && (
                <tr className="font-sans">
                  <td colSpan={9} className="text-center py-16 text-gray-400 dark:text-gray-550">Nenhum registro de abastecimento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SessionAnnotations moduleKey="refuels" title="Anotações & Prints de Combustível" />

      {/* CREATE MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              Registrar Abastecimento de Frota
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Posto de Combustível *</label>
                  <input
                    type="text"
                    required
                    value={gasStation}
                    onChange={(e) => setGasStation(e.target.value)}
                    placeholder="Posto Ipiranga / BR"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Veículo Abastecido *</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Motorista Operador *</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Litros de Diesel *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="250"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Preço por Litro (R$) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(e.target.value)}
                    placeholder="5.89"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Odômetro Atual (KM) - opcional</label>
                <input
                  type="number"
                  step="1"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="Ex: 128450"
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Preenchendo o odômetro em cada abastecimento, calculamos o consumo (Km/L) automaticamente.</p>
              </div>

              {Number(liters) > 0 && Number(pricePerLiter) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-400 text-center flex justify-between items-center">
                  <span>Valor Calculado Total:</span>
                  <strong className="text-sm font-black">R$ {(Number(liters) * Number(pricePerLiter)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              )}

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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
