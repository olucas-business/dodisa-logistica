import React, { useState } from "react";
import { Freight, Driver, Vehicle, Refuel } from "../types";
import { todayLocalISO } from "../utils/date";
import SessionAnnotations from "./SessionAnnotations";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Truck, Plus, Search, Calendar, MapPin, Navigation, Coins, Trash2, Edit2, CheckCircle, Clock, PieChart as PieChartIcon, Upload, Fuel } from "lucide-react";

const MERCOSUL_COUNTRIES = ["Brasil", "Argentina", "Chile", "Paraguai", "Peru", "Uruguai"];

interface FreightsManagerProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onAddFreight: (f: Partial<Freight>) => Promise<boolean>;
  onUpdateFreight: (id: string, f: Partial<Freight>) => Promise<boolean>;
  onDeleteFreight: (id: string) => Promise<boolean>;
  onAddRefuel?: (r: Partial<Refuel>) => Promise<boolean>;
}

export default function FreightsManager({
  freights,
  drivers,
  vehicles,
  onAddFreight,
  onUpdateFreight,
  onDeleteFreight,
  onAddRefuel
}: FreightsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFreightId, setSelectedFreightId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Abastecimento em rota: registrar reabastecimento no meio da viagem, direto pelo manifesto
  const [refuelingFreight, setRefuelingFreight] = useState<Freight | null>(null);
  const [routeRefuelLiters, setRouteRefuelLiters] = useState("");
  const [routeRefuelPrice, setRouteRefuelPrice] = useState("");
  const [routeRefuelStation, setRouteRefuelStation] = useState("");
  const [routeRefuelDate, setRouteRefuelDate] = useState(todayLocalISO());
  const [submittingRouteRefuel, setSubmittingRouteRefuel] = useState(false);

  const handleOpenRouteRefuel = (f: Freight) => {
    setRefuelingFreight(f);
    setRouteRefuelLiters("");
    setRouteRefuelPrice("");
    setRouteRefuelStation("");
    setRouteRefuelDate(todayLocalISO());
  };

  const handleSubmitRouteRefuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refuelingFreight || !onAddRefuel) return;
    const litersNum = Number(routeRefuelLiters);
    const priceNum = Number(routeRefuelPrice);
    if (!litersNum || !priceNum || !routeRefuelStation) {
      alert("Preencha litros, preço por litro e o posto.");
      return;
    }
    setSubmittingRouteRefuel(true);
    const ok = await onAddRefuel({
      date: routeRefuelDate,
      vehicleId: refuelingFreight.vehicleId,
      driverId: refuelingFreight.driverId,
      liters: litersNum,
      pricePerLiter: priceNum,
      totalValue: litersNum * priceNum,
      gasStation: routeRefuelStation,
      receipt: ""
    });
    setSubmittingRouteRefuel(false);
    if (ok) {
      setRefuelingFreight(null);
    }
  };

  // Form states
  const [date, setDate] = useState(todayLocalISO());
  const [departureTime, setDepartureTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("18:00");
  const [status, setStatus] = useState<"Pendente" | "Em andamento" | "Finalizado" | "Cancelado">("Pendente");
  const [driverId, setDriverId] = useState(drivers[0]?.id || "");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || "");

  // Origem / Destino
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("PE");
  const [originCountry, setOriginCountry] = useState("Brasil");
  const [originAddress, setOriginAddress] = useState("");
  const [originCompany, setOriginCompany] = useState("");

  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("AL");
  const [destCountry, setDestCountry] = useState("Brasil");
  const [destAddress, setDestAddress] = useState("");
  const [destCompany, setDestCompany] = useState("");

  // Carga
  const [cargoType, setCargoType] = useState("");
  const [cargoDesc, setCargoDesc] = useState("");
  const [cargoQty, setCargoQty] = useState("");
  const [cargoUnit, setCargoUnit] = useState<"Quilos" | "Toneladas" | "Litros" | "Sacos" | "Caixas" | "Paletes">("Toneladas");

  // Financeiro
  const [value, setValue] = useState("");
  const [commission, setCommission] = useState("");
  const [commissionPaid, setCommissionPaid] = useState("");
  const [commissionPending, setCommissionPending] = useState("");
  const [commissionReceiptUrl, setCommissionReceiptUrl] = useState("");
  const [uploadingCommissionReceipt, setUploadingCommissionReceipt] = useState(false);
  const [toll, setToll] = useState("");
  const [food, setFood] = useState("");
  const [lodging, setLodging] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [advance, setAdvance] = useState("");
  const [balance, setBalance] = useState("");
  const [balanceStatus, setBalanceStatus] = useState<"Pendente" | "Pago">("Pendente");

  // KM
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");

  const resetForm = () => {
    setDate(todayLocalISO());
    setDepartureTime("08:00");
    setArrivalTime("18:00");
    setStatus("Pendente");
    setDriverId(drivers[0]?.id || "");
    setVehicleId(vehicles[0]?.id || "");

    setOriginCity("");
    setOriginState("PE");
    setOriginCountry("Brasil");
    setOriginAddress("");
    setOriginCompany("");

    setDestCity("");
    setDestState("AL");
    setDestCountry("Brasil");
    setDestAddress("");
    setDestCompany("");

    setCargoType("");
    setCargoDesc("");
    setCargoQty("");
    setCargoUnit("Toneladas");

    setValue("");
    setCommission("");
    setCommissionPaid("");
    setCommissionPending("");
    setCommissionReceiptUrl("");
    setToll("");
    setFood("");
    setLodging("");
    setOtherExpenses("");
    setAdvance("");
    setBalance("");
    setBalanceStatus("Pendente");

    setStartKm("");
    setEndKm("");
    setIsEditMode(false);
    setSelectedFreightId(null);
  };

  const handleCommissionChange = (valStr: string) => {
    setCommission(valStr);
    const val = Number(valStr) || 0;
    setCommissionPaid("0");
    setCommissionPending(String(val));
  };

  const handleUploadCommissionReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCommissionReceipt(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: dataUrl, fileName: file.name, folder: "commission-receipts" })
        });
        const data = await res.json();
        if (data.success) {
          setCommissionReceiptUrl(data.url);
        } else {
          alert(data.message || "Erro ao enviar comprovante.");
        }
        setUploadingCommissionReceipt(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Erro ao enviar comprovante.");
      setUploadingCommissionReceipt(false);
    }
    e.target.value = "";
  };

  const handleValueChange = (valStr: string) => {
    setValue(valStr);
    const val = Number(valStr) || 0;
    setAdvance(String(Math.round(val * 0.7)));
    setBalance(String(Math.round(val * 0.3)));
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (f: Freight) => {
    setSelectedFreightId(f.id);
    setDate(f.date);
    setDepartureTime(f.departureTime);
    setArrivalTime(f.arrivalTime);
    setStatus(f.status);
    setDriverId(f.driverId);
    setVehicleId(f.vehicleId);

    setOriginCity(f.origin.city);
    setOriginState(f.origin.state);
    setOriginCountry(f.origin.country || "Brasil");
    setOriginAddress(f.origin.address);
    setOriginCompany(f.origin.company);

    setDestCity(f.destination.city);
    setDestState(f.destination.state);
    setDestCountry(f.destination.country || "Brasil");
    setDestAddress(f.destination.address);
    setDestCompany(f.destination.company);

    setCargoType(f.cargo.type);
    setCargoDesc(f.cargo.description);
    setCargoQty(String(f.cargo.qty));
    setCargoUnit(f.cargo.unit);

    setValue(String(f.financial.value));
    setCommission(String(f.financial.commission));
    setCommissionPaid(String(f.financial.commissionPaid !== undefined ? f.financial.commissionPaid : 0));
    setCommissionPending(String(f.financial.commissionPending !== undefined ? f.financial.commissionPending : f.financial.commission));
    setCommissionReceiptUrl(f.financial.commissionReceiptUrl || "");
    setToll(String(f.financial.toll || ""));
    setFood(String(f.financial.food || ""));
    setLodging(String(f.financial.lodging || ""));
    setOtherExpenses(String(f.financial.otherExpenses || ""));
    setAdvance(String(f.financial.advance !== undefined ? f.financial.advance : Math.round(f.financial.value * 0.7)));
    setBalance(String(f.financial.balance !== undefined ? f.financial.balance : Math.round(f.financial.value * 0.3)));
    setBalanceStatus(f.financial.balanceStatus || "Pendente");

    setStartKm(String(f.mileage.start || ""));
    setEndKm(String(f.mileage.end || ""));

    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originCity || !destCity || !cargoType || !value || !commission) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const start = Number(startKm) || 0;
    const end = Number(endKm) || 0;
    const totalDist = end > start ? (end - start) : 0;

    const payload: Partial<Freight> = {
      date,
      departureTime,
      arrivalTime,
      status,
      driverId,
      vehicleId,
      origin: {
        city: originCity,
        state: originState,
        country: originCountry,
        address: originAddress,
        company: originCompany
      },
      destination: {
        city: destCity,
        state: destState,
        country: destCountry,
        address: destAddress,
        company: destCompany
      },
      cargo: {
        type: cargoType,
        description: cargoDesc,
        qty: Number(cargoQty) || 1,
        unit: cargoUnit
      },
      financial: {
        value: Number(value) || 0,
        commission: Number(commission) || 0,
        commissionPaid: Number(commissionPaid) || 0,
        commissionPending: Number(commissionPending) || 0,
        commissionReceiptUrl,
        toll: Number(toll) || 0,
        food: Number(food) || 0,
        lodging: Number(lodging) || 0,
        otherExpenses: Number(otherExpenses) || 0,
        advance: Number(advance) || 0,
        balance: Number(balance) || 0,
        balanceStatus
      },
      mileage: {
        start,
        end,
        total: totalDist
      }
    };

    if (isEditMode && selectedFreightId) {
      const ok = await onUpdateFreight(selectedFreightId, payload);
      if (ok) setIsFormOpen(false);
    } else {
      const ok = await onAddFreight(payload);
      if (ok) setIsFormOpen(false);
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
    await onDeleteFreight(id);
    setConfirmDeleteId(null);
  };

  const filteredFreights = freights.filter(f => {
    const driverName = drivers.find(d => d.id === f.driverId)?.fullName || "";
    const vehiclePlate = vehicles.find(v => v.id === f.vehicleId)?.plate || "";
    
    const matchesSearch = f.freightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.origin.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.destination.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "TODOS" || f.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Cost breakdown across all freights (toll, food, lodging, commission, other)
  const activeFreightsForCost = freights.filter(f => f.status !== "Cancelado");
  const costBreakdown = [
    { name: "Pedágio", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.toll || 0), 0) },
    { name: "Alimentação", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.food || 0), 0) },
    { name: "Hospedagem", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.lodging || 0), 0) },
    { name: "Comissão", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.commission || 0), 0) },
    { name: "Outros", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.otherExpenses || 0), 0) }
  ].filter(c => c.value > 0);

  // Cores fixas por natureza do custo: azul = pedágio, verde = comissão, vermelho = demais custos
  const getCostIntensityColor = (_value: number, name?: string) => {
    if (name === "Pedágio") return "#3b82f6";
    if (name === "Comissão") return "#10b981";
    return "#ef4444";
  };

  return (
    <div id="modulo-fretes-container" className="space-y-6">
      {/* Cost Breakdown Chart */}
      {costBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
            <PieChartIcon className="w-4 h-4 text-red-500" />
            Custos Operacionais dos Fretes
          </h4>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-[180px] w-full sm:w-[220px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {costBreakdown.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={getCostIntensityColor(item.value, item.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              {costBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCostIntensityColor(item.value, item.name) }} />
                  <span>{item.name}: R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por Nº, Origem, Destino, Placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["TODOS", "Pendente", "Em andamento", "Finalizado", "Cancelado"].map((statusOption) => (
              <button
                key={statusOption}
                onClick={() => setStatusFilter(statusOption)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === statusOption
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrar Novo Frete
        </button>
      </div>

      {/* Freights List Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200">
              <tr>
                <th className="p-3 pl-5">Nº do Frete</th>
                <th className="p-3">Data</th>
                <th className="p-3">Motorista / Veículo</th>
                <th className="p-3">Origem → Destino</th>
                <th className="p-3">Carga / Qtde</th>
                <th className="p-3">Km Total</th>
                <th className="p-3">Faturamento</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFreights.map((f) => {
                const driver = drivers.find(d => d.id === f.driverId);
                const vehicle = vehicles.find(v => v.id === f.vehicleId);

                return (
                  <tr key={f.id} className="hover:bg-gray-50/70 transition-all">
                    <td className="p-3 pl-5 font-mono font-bold text-blue-600">{f.freightNumber}</td>
                    <td className="p-3 text-gray-500 font-mono">{f.date}</td>
                    <td className="p-3">
                      <p className="font-bold text-gray-950">{driver?.fullName || "Não vinculado"}</p>
                      <p className="text-[10px] font-mono text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "Sem placa"}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        {f.origin.city}-{f.origin.state}
                        {f.origin.country && f.origin.country !== "Brasil" && (
                          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-0.5 ml-0.5">{f.origin.country}</span>
                        )}
                      </p>
                      <p className="font-semibold text-gray-850 flex items-center gap-1 mt-0.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        {f.destination.city}-{f.destination.state}
                        {f.destination.country && f.destination.country !== "Brasil" && (
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 ml-0.5">{f.destination.country}</span>
                        )}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-800">{f.cargo.type}</p>
                      <p className="text-[10px] text-gray-500">{f.cargo.qty} {f.cargo.unit}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-mono font-bold text-gray-800">{(f.mileage?.total || 0).toLocaleString("pt-BR")} KM</p>
                    </td>
                    <td className="p-3">
                      <p className="font-black text-emerald-700">R$ {f.financial.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
                      {(() => {
                        const adv = f.financial.advance !== undefined ? f.financial.advance : Math.round(f.financial.value * 0.7);
                        const bal = f.financial.balance !== undefined ? f.financial.balance : Math.round(f.financial.value * 0.3);
                        const balStatus = f.financial.balanceStatus || "Pendente";
                        return (
                          <div className="text-[10px] space-y-0.5 mt-0.5 text-gray-500 font-sans">
                            <p className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Adiantamento: <strong className="text-blue-700">R$ {adv.toLocaleString("pt-BR")}</strong>
                            </p>
                            <p className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Saldo: <strong className="text-red-700">R$ {bal.toLocaleString("pt-BR")}</strong>
                              <span className={`px-1 rounded-sm text-[8px] font-bold uppercase ${
                                balStatus === "Pago" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                              }`}>{balStatus === "Pago" ? "Pago" : "Pendente"}</span>
                            </p>
                          </div>
                        );
                      })()}
                      <p className="text-[9px] font-mono text-gray-400 mt-1">Comissão: R$ {f.financial.commission.toLocaleString("pt-BR")}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        f.status === "Finalizado" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400" :
                        f.status === "Em andamento" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-400" :
                        f.status === "Pendente" ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400"
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-5 space-x-1">
                      {onAddRefuel && (
                        <button
                          onClick={() => handleOpenRouteRefuel(f)}
                          className="p-1.5 border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-all inline-flex"
                          title="Registrar abastecimento em rota"
                        >
                          <Fuel className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="p-1.5 border border-gray-150 hover:bg-gray-100 text-gray-700 hover:text-black rounded transition-all inline-flex"
                        title="Editar frete"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className={`p-1.5 transition-all duration-300 rounded inline-flex border items-center gap-1 text-xs font-semibold ${
                          confirmDeleteId === f.id
                            ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 px-2 animate-pulse"
                            : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700"
                        }`}
                        title={confirmDeleteId === f.id ? "Confirmar exclusão" : "Excluir faturamento"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDeleteId === f.id && "Confirmar?"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredFreights.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-20 text-gray-400">
                    <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
                    <p className="text-xs">Nenhum frete correspondente encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SessionAnnotations moduleKey="freights" title="Anotações & Prints de Fretes" />

      {/* CREATE / EDIT REGISTER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-3xl border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-gray-100 border-b border-gray-150 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              {isEditMode ? "Editar Ficha Operacional de Frete" : "Registrar Novo Manifesto de Carga e Frete"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
              {/* General details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/60 dark:bg-slate-950/40 p-3 rounded-lg border border-gray-150 dark:border-slate-850">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data do Manifesto</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Hora Saída</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="06:00"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Hora Chegada</label>
                  <input
                    type="text"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    placeholder="14:30"
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Status Carga *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Assignment (Driver & Vehicle) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Motorista Designado *</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id} className="dark:bg-slate-950">{d.fullName} (CNH: {d.cnhCategory})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Veículo / Placa *</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id} className="dark:bg-slate-950">{v.brand} {v.model} ({v.plate})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Origem e Destino */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origem */}
                <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Ponto de Origem
                  </h4>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">País (Rota Mercosul)</label>
                    <select
                      value={originCountry}
                      onChange={(e) => setOriginCountry(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    >
                      {MERCOSUL_COUNTRIES.map((c) => (
                        <option key={c} value={c} className="dark:bg-slate-950">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        placeholder="Recife"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">UF/Prov.</label>
                      <input
                        type="text"
                        value={originState}
                        onChange={(e) => setOriginState(e.target.value)}
                        placeholder={originCountry === "Brasil" ? "PE" : "Mendoza"}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Empresa Carregadora</label>
                    <input
                      type="text"
                      value={originCompany}
                      onChange={(e) => setOriginCompany(e.target.value)}
                      placeholder="Empresa Emissora"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Endereço de Carga</label>
                    <input
                      type="text"
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      placeholder="Av. do Porto, KM 5"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Destino */}
                <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Ponto de Destino
                  </h4>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">País (Rota Mercosul)</label>
                    <select
                      value={destCountry}
                      onChange={(e) => setDestCountry(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    >
                      {MERCOSUL_COUNTRIES.map((c) => (
                        <option key={c} value={c} className="dark:bg-slate-950">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Cidade *</label>
                      <input
                        type="text"
                        required
                        value={destCity}
                        onChange={(e) => setDestCity(e.target.value)}
                        placeholder="Maceió"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">UF/Prov.</label>
                      <input
                        type="text"
                        value={destState}
                        onChange={(e) => setDestState(e.target.value)}
                        placeholder={destCountry === "Brasil" ? "AL" : "Mendoza"}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Empresa Recebedora</label>
                    <input
                      type="text"
                      value={destCompany}
                      onChange={(e) => setDestCompany(e.target.value)}
                      placeholder="Empresa Destinatária"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Endereço de Descarga</label>
                    <input
                      type="text"
                      value={destAddress}
                      onChange={(e) => setDestAddress(e.target.value)}
                      placeholder="Zona Industrial, Galpão 3"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Informações da Carga */}
              <div className="bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Informações da Mercadoria / Carga</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Tipo de Mercadoria *</label>
                    <input
                      type="text"
                      required
                      value={cargoType}
                      onChange={(e) => setCargoType(e.target.value)}
                      placeholder="Alimentos / Grãos / Bebidas"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Volume / Qtde *</label>
                    <input
                      type="number"
                      required
                      value={cargoQty}
                      onChange={(e) => setCargoQty(e.target.value)}
                      placeholder="35"
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Unidade</label>
                    <select
                      value={cargoUnit}
                      onChange={(e) => setCargoUnit(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs outline-none"
                    >
                      <option value="Quilos">Quilos</option>
                      <option value="Toneladas">Toneladas</option>
                      <option value="Litros">Litros</option>
                      <option value="Sacos">Sacos</option>
                      <option value="Caixas">Caixas</option>
                      <option value="Paletes">Paletes</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Descrição Detalhada dos Itens</label>
                  <input
                    type="text"
                    value={cargoDesc}
                    onChange={(e) => setCargoDesc(e.target.value)}
                    placeholder="ex: Carga lacrada de açúcar cristal ensacado em paletes de madeira."
                    className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded p-1.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Financeiro e KM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financeiro */}
                <div className="bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Balanço Financeiro da Viagem
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Valor Bruto Frete *</label>
                      <input
                        type="number"
                        required
                        value={value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder="7500"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs outline-none font-bold text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Comissão Motorista *</label>
                      <input
                        type="number"
                        required
                        value={commission}
                        onChange={(e) => handleCommissionChange(e.target.value)}
                        placeholder="750"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs outline-none font-semibold text-blue-700 dark:text-blue-400"
                      />
                    </div>
                  </div>

                  {/* Comissão do Motorista: paga vs pendente + comprovante */}
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3 space-y-2.5">
                    <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">Pagamento da Comissão</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">🟢 Comissão Paga (R$)</label>
                        <input
                          type="number"
                          value={commissionPaid}
                          onChange={(e) => setCommissionPaid(e.target.value)}
                          placeholder="0"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1 text-xs outline-none font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">🟠 Comissão Pendente (R$)</label>
                        <input
                          type="number"
                          value={commissionPending}
                          onChange={(e) => setCommissionPending(e.target.value)}
                          placeholder="750"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1 text-xs outline-none font-mono text-amber-600 dark:text-amber-450 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Comprovante de Pagamento</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded p-1.5 text-[10px] font-semibold cursor-pointer hover:border-emerald-500 transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingCommissionReceipt ? "Enviando..." : commissionReceiptUrl ? "Trocar arquivo" : "Enviar comprovante"}
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadCommissionReceipt} disabled={uploadingCommissionReceipt} />
                        </label>
                        {commissionReceiptUrl && (
                          <a href={commissionReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
                            Ver anexo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adiantamento (Frete Pago) & Saldo (Frete Não Pago) */}
                  <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 space-y-2.5">
                    <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">Partição de Faturamento por Frete</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Frete Pago (Adiant.) (R$)</label>
                        <input
                          type="number"
                          value={advance}
                          onChange={(e) => setAdvance(e.target.value)}
                          placeholder="5250"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1 text-xs outline-none font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Frete Não Pago (Saldo) (R$)</label>
                        <input
                          type="number"
                          value={balance}
                          onChange={(e) => setBalance(e.target.value)}
                          placeholder="2250"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1 text-xs outline-none font-mono text-amber-600 dark:text-amber-450 font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Status do Recebimento do Saldo</label>
                      <select
                        value={balanceStatus}
                        onChange={(e) => setBalanceStatus(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1 text-xs outline-none text-xs font-semibold"
                      >
                        <option value="Pendente" className="text-amber-500">Pendente (Demora para receber)</option>
                        <option value="Pago" className="text-emerald-500">Pago / Recebido</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500 block truncate">Pedágios</label>
                      <input
                        type="number"
                        value={toll}
                        onChange={(e) => setToll(e.target.value)}
                        placeholder="150"
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500 block truncate">Alimentação</label>
                      <input
                        type="number"
                        value={food}
                        onChange={(e) => setFood(e.target.value)}
                        placeholder="120"
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500 block truncate">Hospedagem</label>
                      <input
                        type="number"
                        value={lodging}
                        onChange={(e) => setLodging(e.target.value)}
                        placeholder="0"
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500 block truncate">Outros custos</label>
                      <input
                        type="number"
                        value={otherExpenses}
                        onChange={(e) => setOtherExpenses(e.target.value)}
                        placeholder="50"
                        className="w-full min-w-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* KM */}
                <div className="bg-gray-50 dark:bg-slate-950/40 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Telemetria de Quilometragem</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Insira os odômetros inicial e final para o cálculo automático.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Odômetro Inicial</label>
                      <input
                        type="number"
                        value={startKm}
                        onChange={(e) => setStartKm(e.target.value)}
                        placeholder="123650"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono font-bold text-gray-400 dark:text-gray-500">Odômetro Final</label>
                      <input
                        type="number"
                        value={endKm}
                        onChange={(e) => setEndKm(e.target.value)}
                        placeholder="123910"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded p-1.5 text-xs outline-none font-mono"
                      />
                    </div>
                  </div>

                  {Number(endKm) > Number(startKm) && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded text-xs font-mono text-center flex justify-between items-center text-blue-800 dark:text-blue-300">
                      <span>Total Percorrido Calculado:</span>
                      <strong className="text-sm font-bold">{Number(endKm) - Number(startKm)} KM</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
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
                  Salvar Frete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABASTECIMENTO EM ROTA (meio da viagem) */}
      {refuelingFreight && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in my-auto">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-orange-500" />
              Abastecimento em Rota
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">
              Registro de reabastecimento no meio da viagem do frete <strong className="text-gray-800 dark:text-gray-200">{refuelingFreight.freightNumber}</strong>. Será somado ao módulo de Combustível normalmente.
            </p>
            <form onSubmit={handleSubmitRouteRefuel} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data *</label>
                  <input
                    type="date"
                    required
                    value={routeRefuelDate}
                    onChange={(e) => setRouteRefuelDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Posto *</label>
                  <input
                    type="text"
                    required
                    value={routeRefuelStation}
                    onChange={(e) => setRouteRefuelStation(e.target.value)}
                    placeholder="Posto Ipiranga"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Litros *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={routeRefuelLiters}
                    onChange={(e) => setRouteRefuelLiters(e.target.value)}
                    placeholder="250"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Preço/Litro (R$) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={routeRefuelPrice}
                    onChange={(e) => setRouteRefuelPrice(e.target.value)}
                    placeholder="5.89"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>
              {Number(routeRefuelLiters) > 0 && Number(routeRefuelPrice) > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 p-3 rounded-lg text-xs font-semibold text-orange-800 dark:text-orange-400 text-center flex justify-between items-center">
                  <span>Valor Calculado:</span>
                  <strong className="text-sm font-black">R$ {(Number(routeRefuelLiters) * Number(routeRefuelPrice)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRefuelingFreight(null)}
                  className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingRouteRefuel}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  Registrar Abastecimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
