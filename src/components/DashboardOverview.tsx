import { useState, useEffect, useMemo } from "react";
import {
  Freight,
  Driver,
  Vehicle,
  Refuel,
  Expense,
  Debt
} from "../types";
import RadialGauge from "./RadialGauge";
import { 
  Truck, 
  Users, 
  Coins, 
  TrendingUp, 
  Compass, 
  AlertTriangle, 
  Hammer, 
  ShieldAlert, 
  CheckCircle,
  Activity, 
  Map, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders,
  Gauge,
  DollarSign,
  Fuel,
  Percent,
  FileSpreadsheet,
  Route,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
  BarChart,
  Bar
} from "recharts";
import CountUp from "./CountUp";

interface DashboardOverviewProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
  refuels: Refuel[];
  expenses: Expense[];
  debts: Debt[];
  onNavigateTo: (tab: string) => void;
}

// Brazilian major logistics hubs for the map
const HUB_COORDINATES: Record<string, { x: number; y: number; name: string; state: string }> = {
  "RECIFE": { x: 420, y: 150, name: "Recife", state: "PE" },
  "MACEIÓ": { x: 410, y: 175, name: "Maceió", state: "AL" },
  "JOÃO PESSOA": { x: 430, y: 135, name: "João Pessoa", state: "PB" },
  "SÃO PAULO": { x: 280, y: 380, name: "São Paulo", state: "SP" },
  "CAMPINAS": { x: 260, y: 365, name: "Campinas", state: "SP" },
  "RIO DE JANEIRO": { x: 320, y: 360, name: "Rio de Janeiro", state: "RJ" },
  "BELO HORIZONTE": { x: 300, y: 310, name: "Belo Horizonte", state: "MG" },
  "BRASÍLIA": { x: 250, y: 240, name: "Brasília", state: "DF" },
  "SALVADOR": { x: 380, y: 210, name: "Salvador", state: "BA" },
  "PORTO ALEGRE": { x: 190, y: 460, name: "Porto Alegre", state: "RS" },
  "FORTALEZA": { x: 380, y: 90, name: "Fortaleza", state: "CE" }
};

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#6366f1", "#ef4444"];

export default function DashboardOverview({
  freights,
  drivers,
  vehicles,
  refuels,
  expenses,
  debts = [],
  onNavigateTo
}: DashboardOverviewProps) {
  // Constants
  const today = new Date();
  const CURRENT_DATE_STR = today.toISOString().split("T")[0];
  const FULL_MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const SHORT_MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Filtro de mês/ano: controla todas as métricas "do mês" abaixo. Por padrão
  // mostra o mês corrente, mas o usuário pode navegar para outros meses.
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const currentYear: number = selectedYear;
  const currentMonth: number = selectedMonth;

  // Seletor de mês/ano em calendário: permite pular direto para qualquer mês/ano,
  // além dos botões de avançar/voltar um mês por vez.
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(selectedYear);
  const openMonthPicker = () => {
    setPickerYear(selectedYear);
    setMonthPickerOpen(true);
  };
  const currentMonthName = FULL_MONTH_NAMES[currentMonth - 1];
  const isViewingCurrentMonth = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Active tab toggle for bottom right charts: expenses vs cargo breakdown
  const [bottomActiveTab, setBottomActiveTab] = useState<"expenses" | "cargo">("expenses");

  // Alíquota de imposto configurada no Perfil da Empresa (usada no anel "Impostos" — editável também direto no anel)
  const [taxRate, setTaxRate] = useState(0);
  useEffect(() => {
    fetch("/api/company")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.company?.taxRate) {
          setTaxRate(Number(data.company.taxRate) || 0);
        }
      })
      .catch(() => {});
  }, []);

  const saveCompanyField = async (field: "taxRate", value: number) => {
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: String(value) })
      });
      const data = await res.json();
      if (data.success) setTaxRate(value);
    } catch (err) {
      // silent
    }
  };

  // Time-based progress ticker for the live map animations
  const [mapProgressTick, setMapProgressTick] = useState(0.45);
  useEffect(() => {
    const interval = setInterval(() => {
      setMapProgressTick(prev => (prev + 0.005) % 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Reverse so that the latest notifications appear on top
        setNotifications([...data].reverse());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper date logic
  const isToday = (dateStr: string) => dateStr === CURRENT_DATE_STR;
  const isThisMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length < 2) return false;
    return Number(parts[0]) === currentYear && Number(parts[1]) === currentMonth;
  };

  // Metrics Calculations
  const freightsToday = useMemo(() => freights.filter(f => isToday(f.date) && f.status !== "Cancelado"), [freights]);
  const freightsMonth = useMemo(() => freights.filter(f => isThisMonth(f.date) && f.status !== "Cancelado"), [freights]);
  const billingMonth = useMemo(() => freightsMonth.reduce((sum, f) => sum + (f.financial?.value || 0), 0), [freightsMonth]);

  const totalKm = useMemo(() => freights.reduce((sum, f) => sum + (f.mileage?.total || 0), 0), [freights]);
  const totalLiters = useMemo(() => refuels.reduce((sum, r) => sum + (r.liters || 0), 0), [refuels]);
  const avgFuelConsumption = totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : "0.00";

  const expensesMonth = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    const directExp = expenses.filter(e => e.date.startsWith(targetYearMonth)).reduce((sum, e) => sum + (e.value || 0), 0);
    const refuelExp = refuels.filter(r => r.date.startsWith(targetYearMonth)).reduce((sum, r) => sum + (r.totalValue || 0), 0);
    const freightExp = freightsMonth.reduce((sum, f) => {
      const fin = f.financial;
      if (!fin) return sum;
      return sum + (fin.commission || 0) + (fin.toll || 0) + (fin.food || 0) + (fin.lodging || 0) + (fin.otherExpenses || 0);
    }, 0);
    return directExp + refuelExp + freightExp;
  }, [expenses, refuels, freightsMonth]);

  const estimatedProfitMonth = billingMonth - expensesMonth;
  const marginPercentage = billingMonth > 0 ? Math.round((estimatedProfitMonth / billingMonth) * 100) : 0;

  // Dívida/Alavancagem: total de dívidas e obrigações ainda pendentes de pagamento (todas as categorias)
  const totalDividaPendente = useMemo(
    () => debts.filter(d => d.status === "Falta Pagar").reduce((sum, d) => sum + (d.value || 0), 0),
    [debts]
  );

  // Despesas do mês por categoria (gráfico de colunas)
  const expensesByCategoryMonth = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    const totals: Record<string, number> = {};
    expenses.filter(e => e.date.startsWith(targetYearMonth)).forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + (e.value || 0);
    });
    return Object.entries(totals)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, currentYear, currentMonth]);

  // Performance ring gauges: real ratios, no fabricated data
  const fleetActivePercentage = useMemo(() => {
    if (vehicles.length === 0) return 0;
    const activeVehicleIds = new Set(
      freights.filter(f => f.status === "Em andamento").map(f => f.vehicleId)
    );
    return Math.round((activeVehicleIds.size / vehicles.length) * 100);
  }, [vehicles, freights]);

  const freightsCompletedPercentage = useMemo(() => {
    if (freightsMonth.length === 0) return 0;
    const completed = freightsMonth.filter(f => f.status === "Finalizado").length;
    return Math.round((completed / freightsMonth.length) * 100);
  }, [freightsMonth]);

  const driversActivePercentage = useMemo(() => {
    if (drivers.length === 0) return 0;
    const activeDriverIds = new Set(freightsMonth.map(f => f.driverId));
    return Math.round((activeDriverIds.size / drivers.length) * 100);
  }, [drivers, freightsMonth]);

  // Helper for previous month matching (e.g. 2026-05)
  const isPrevMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length < 2) return false;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    
    return year === prevYear && month === prevMonth;
  };

  // Previous month calculations
  const freightsPrevMonth = useMemo(() => freights.filter(f => isPrevMonth(f.date) && f.status !== "Cancelado"), [freights]);
  const billingPrevMonth = useMemo(() => freightsPrevMonth.reduce((sum, f) => sum + (f.financial?.value || 0), 0), [freightsPrevMonth]);

  const expensesPrevMonth = useMemo(() => {
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const targetYearMonth = `${prevYear}-${prevMonth < 10 ? "0" + prevMonth : prevMonth}`;
    
    const directExp = expenses.filter(e => e.date.startsWith(targetYearMonth)).reduce((sum, e) => sum + (e.value || 0), 0);
    const refuelExp = refuels.filter(r => r.date.startsWith(targetYearMonth)).reduce((sum, r) => sum + (r.totalValue || 0), 0);
    const freightExp = freightsPrevMonth.reduce((sum, f) => {
      const fin = f.financial;
      if (!fin) return sum;
      return sum + (fin.commission || 0) + (fin.toll || 0) + (fin.food || 0) + (fin.lodging || 0) + (fin.otherExpenses || 0);
    }, 0);
    return directExp + refuelExp + freightExp;
  }, [expenses, refuels, freightsPrevMonth]);

  const estimatedProfitPrevMonth = billingPrevMonth - expensesPrevMonth;

  // Monthly KM calculations
  const kmMonth = useMemo(() => freightsMonth.reduce((sum, f) => sum + (f.mileage?.total || 0), 0), [freightsMonth]);
  const kmPrevMonth = useMemo(() => freightsPrevMonth.reduce((sum, f) => sum + (f.mileage?.total || 0), 0), [freightsPrevMonth]);

  // Percentage variations
  const billingChangePercent = useMemo(() => {
    if (billingPrevMonth === 0) {
      return billingMonth > 0 ? 100 : 0;
    }
    return ((billingMonth - billingPrevMonth) / billingPrevMonth) * 100;
  }, [billingMonth, billingPrevMonth]);

  const expensesChangePercent = useMemo(() => {
    if (expensesPrevMonth === 0) {
      return expensesMonth > 0 ? 100 : 0;
    }
    return ((expensesMonth - expensesPrevMonth) / expensesPrevMonth) * 100;
  }, [expensesMonth, expensesPrevMonth]);

  const profitChangePercent = useMemo(() => {
    if (estimatedProfitPrevMonth === 0) {
      return estimatedProfitMonth > 0 ? 100 : 0;
    }
    return ((estimatedProfitMonth - estimatedProfitPrevMonth) / Math.abs(estimatedProfitPrevMonth)) * 100;
  }, [estimatedProfitMonth, estimatedProfitPrevMonth]);

  const kmChangePercent = useMemo(() => {
    if (kmPrevMonth === 0) {
      return kmMonth > 0 ? 100 : 0;
    }
    return ((kmMonth - kmPrevMonth) / kmPrevMonth) * 100;
  }, [kmMonth, kmPrevMonth]);

  // KM history for sparkline
  const dynamicMonthlyKm = useMemo(() => {
    const targetYear = String(currentYear);
    return Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const monthStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
      const yearMonth = `${targetYear}-${monthStr}`;
      const monthFreights = freights.filter(f => f.date.startsWith(yearMonth) && f.status !== "Cancelado");
      return monthFreights.reduce((sum, f) => sum + (f.mileage?.total || 0), 0);
    });
  }, [freights]);

  // Dynamic Month-over-Month dataset for the chart
  const dynamicMonthlyData = useMemo(() => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const targetYear = String(currentYear);
    
    const data = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = i + 1;
      const monthStr = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
      const yearMonth = `${targetYear}-${monthStr}`;
      
      const monthFreights = freights.filter(f => f.date.startsWith(yearMonth) && f.status !== "Cancelado");
      const billing = monthFreights.reduce((sum, f) => sum + (f.financial?.value || 0), 0);
      
      const monthExpenses = expenses.filter(e => e.date.startsWith(yearMonth));
      const directExpensesSum = monthExpenses.reduce((sum, e) => sum + (e.value || 0), 0);
      
      const monthRefuels = refuels.filter(r => r.date.startsWith(yearMonth));
      const refuelsSum = monthRefuels.reduce((sum, r) => sum + (r.totalValue || 0), 0);
      
      const freightExpensesSum = monthFreights.reduce((sum, f) => {
        const fin = f.financial;
        if (!fin) return sum;
        return sum + (fin.commission || 0) + (fin.toll || 0) + (fin.food || 0) + (fin.lodging || 0) + (fin.otherExpenses || 0);
      }, 0);
      
      const totalMonthCosts = directExpensesSum + refuelsSum + freightExpensesSum;
      
      return {
        name: monthNames[i],
        Faturamento: billing,
        Custos: totalMonthCosts
      };
    });

    const maxMonthIdx = data.reduce((max, m, idx) => {
      if (m.Faturamento > 0 || m.Custos > 0) {
        return Math.max(max, idx);
      }
      return max;
    }, 5);
    
    return data.slice(0, maxMonthIdx + 1);
  }, [freights, expenses, refuels]);

  const faturamentoPoints = useMemo(() => {
    const pts = dynamicMonthlyData.map(d => d.Faturamento);
    return pts.length > 1 ? pts : [0, 0];
  }, [dynamicMonthlyData]);

  const custosPoints = useMemo(() => {
    const pts = dynamicMonthlyData.map(d => d.Custos);
    return pts.length > 1 ? pts : [0, 0];
  }, [dynamicMonthlyData]);

  const profitPoints = useMemo(() => {
    const pts = dynamicMonthlyData.map(d => d.Faturamento - d.Custos);
    return pts.length > 1 ? pts : [0, 0];
  }, [dynamicMonthlyData]);

  const kmPoints = useMemo(() => {
    const pts = dynamicMonthlyKm;
    return pts.length > 1 ? pts : [0, 0];
  }, [dynamicMonthlyKm]);

  // Operational Timeline Real-Time simulation based on state
  const operationalTimeline = useMemo(() => {
    const events: Array<{ time: string; title: string; desc: string; type: "freight" | "refuel" | "alert" | "status" }> = [
      { time: "11:45", title: "Conexão de Satélite Estabilizada", desc: "Sistemas de telemetria integrados com SpaceX Starlink.", type: "status" },
      { time: "11:12", title: "Saída de Viagem Confirmada", desc: "Carreta Actros 6X4 iniciou trânsito comercial de São Paulo com destino a Salvador.", type: "freight" },
      { time: "10:35", title: "Abastecimento Registrado", desc: "Registro efetuado de 340 Litros de Diesel S10 para o veículo LMN-3344.", type: "refuel" },
      { time: "10:18", title: "Viagem Concluída com Sucesso", desc: "Manifesto M-2026-88 entregue em Belo Horizonte. Faturamento creditado.", type: "freight" },
      { time: "09:43", title: "Manutenção de Pneus Finalizada", desc: "Verificação de sulco e rodízio completo efetuado no truque traseiro do veículo XYZ-1234.", type: "status" },
      { time: "08:12", title: "Alerta de Frenagem Brusca", desc: "G-Sensor de cabine registrou desaceleração acentuada na BR-116 KM 210.", type: "alert" }
    ];

    if (freightsToday.length > 0) {
      const lastFrt = freightsToday[0];
      events.unshift({
        time: "Agora",
        title: `Manifesto ${lastFrt.freightNumber} Atualizado`,
        desc: `Carga de ${lastFrt.cargo.type} (${lastFrt.origin.city} → ${lastFrt.destination.city}) em status: ${lastFrt.status}.`,
        type: "freight"
      });
    }

    return events;
  }, [freightsToday]);

  // Active operations trucks positions calculations for map
  const liveTruckPositions = useMemo(() => {
    const list: Array<{
      id: string;
      driverName: string;
      plate: string;
      status: string;
      speed: number;
      destination: string;
      timeRemaining: string;
      cargo: string;
      progress: number;
      value: number;
      originCity: string;
      destCity: string;
      x: number;
      y: number;
    }> = [];

    const activeFreights = freights.filter(f => f.status === "Em andamento" || (f.status as string) === "Em Trânsito");
    const countToGenerate = activeFreights.length;

    for (let i = 0; i < countToGenerate; i++) {
      const frt = activeFreights[i];
      if (!frt) continue;

      const driver = drivers.find(d => d.id === frt.driverId);
      const vehicle = vehicles.find(v => v.id === frt.vehicleId);

      const driverName = driver?.fullName || "Sem Motorista";
      const plate = vehicle?.plate || "Sem Placa";
      const cargo = frt.cargo?.type || "Carga";
      const originCity = frt.origin?.city || "SÃO PAULO";
      const destCity = frt.destination?.city || "SALVADOR";
      const value = frt.financial?.value || 0;

      const oCoords = HUB_COORDINATES[originCity.toUpperCase()] || HUB_COORDINATES["SÃO PAULO"];
      const dCoords = HUB_COORDINATES[destCity.toUpperCase()] || HUB_COORDINATES["SALVADOR"];

      const progressOffset = (mapProgressTick + (i * 0.25)) % 1;
      const controlX = (oCoords.x + dCoords.x) / 2 + (i % 2 === 0 ? 30 : -30);
      const controlY = (oCoords.y + dCoords.y) / 2 - 20;

      const x = (1 - progressOffset) * (1 - progressOffset) * oCoords.x + 2 * (1 - progressOffset) * progressOffset * controlX + progressOffset * progressOffset * dCoords.x;
      const y = (1 - progressOffset) * (1 - progressOffset) * oCoords.y + 2 * (1 - progressOffset) * progressOffset * controlY + progressOffset * progressOffset * dCoords.y;

      list.push({
        id: frt.id,
        driverName,
        plate,
        status: frt.status === "Em andamento" ? "Em Trânsito" : (frt.status || "Em Trânsito"),
        speed: frt.status === "Em andamento" ? 84 : 0,
        destination: destCity,
        timeRemaining: "Calculando...",
        cargo,
        progress: Math.round(progressOffset * 100),
        value,
        originCity,
        destCity,
        x,
        y
      });
    }

    return list;
  }, [freights, drivers, vehicles, mapProgressTick]);

  // Aggregate current month's expenses by category (direct expenses + fuel + trip-specific expenses)
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, number> = {
      "Combustível": 0,
      "Alimentação": 0,
      "Hospedagem": 0,
      "Pedágio": 0,
      "Oficina": 0,
      "Pneus": 0,
      "Seguro": 0,
      "Outros": 0
    };

    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;

    // 1. Direct expenses registered
    expenses.filter(e => e.date.startsWith(targetYearMonth)).forEach(e => {
      const cat = e.category || "Outros";
      categories[cat] = (categories[cat] || 0) + e.value;
    });

    // 2. Fuel transactions registered
    refuels.filter(r => r.date.startsWith(targetYearMonth)).forEach(r => {
      categories["Combustível"] = (categories["Combustível"] || 0) + r.totalValue;
    });

    // 3. Freight direct operational expenses
    freightsMonth.forEach(f => {
      const fin = f.financial;
      if (fin) {
        categories["Alimentação"] = (categories["Alimentação"] || 0) + (fin.food || 0);
        categories["Hospedagem"] = (categories["Hospedagem"] || 0) + (fin.lodging || 0);
        categories["Pedágio"] = (categories["Pedágio"] || 0) + (fin.toll || 0);
        categories["Outros"] = (categories["Outros"] || 0) + (fin.commission || 0) + (fin.otherExpenses || 0);
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [expenses, refuels, freightsMonth]);

  // Aggregate current month's faturamento (revenue) by cargo type
  const cargoRevenueData = useMemo(() => {
    const cargoMap: Record<string, number> = {};
    freightsMonth.forEach(f => {
      const type = f.cargo?.type || "Outros";
      cargoMap[type] = (cargoMap[type] || 0) + (f.financial?.value || 0);
    });
    return Object.entries(cargoMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [freightsMonth]);

  // Group fleet status dynamically to build a beautiful visual status donut chart
  const fleetStatusBreakdown = useMemo(() => {
    let active = 0;
    let resting = 0;
    let alert = 0;
    let available = vehicles.length;

    liveTruckPositions.forEach(truck => {
      if (truck.status === "Em Trânsito") {
        active++;
      } else if (truck.status === "Alerta") {
        alert++;
      } else if (truck.status === "Descanso") {
        resting++;
      }
    });

    // Count vehicles near maintenance threshold to highlight preditive health
    let nearMaintCount = 0;
    vehicles.forEach(v => {
      const isNearMaint = v.nextMaintenance > 0 && (v.nextMaintenance - v.currentMileage <= 2000);
      if (isNearMaint) {
        nearMaintCount++;
      }
    });

    // Adjust general available pool
    available = Math.max(0, vehicles.length - active - resting - alert);

    return [
      { name: "Em Trânsito", value: active, color: "#3b82f6" },
      { name: "Alerta de Viagem", value: alert, color: "#ef4444" },
      { name: "Descanso / Pátio", value: resting, color: "#f59e0b" },
      { name: "Disponível", value: available, color: "#10b981" }
    ].filter(item => item.value > 0);
  }, [vehicles, liveTruckPositions]);

  // ==========================================
  // CALCULATIONS FOR THE 8 HIGHLIGHTED METRICS
  // ==========================================

  // 1. Faturamento por frete (Média e valores recentes)
  const avgBillingPerFreight = useMemo(() => {
    const validFreights = freightsMonth.filter(f => f.status !== "Cancelado");
    return validFreights.length > 0 ? billingMonth / validFreights.length : 0;
  }, [freightsMonth, billingMonth]);

  const recentFreightsChartData = useMemo(() => {
    const validFreights = freightsMonth.filter(f => f.status !== "Cancelado");
    return validFreights.map((f, idx) => {
      const val = f.financial?.value || 0;
      const adv = f.financial?.advance !== undefined ? f.financial.advance : Math.round(val * 0.7);
      const bal = f.financial?.balance !== undefined ? f.financial.balance : Math.round(val * 0.3);
      return {
        name: f.freightNumber || `FR-${idx+1}`,
        "Pago (Adiantamento)": adv,
        "Não Pago (Saldo)": bal,
        "Total": val,
        status: f.financial?.balanceStatus || "Pendente"
      };
    });
  }, [freightsMonth]);

  // 2. Faturamento Mensal acumulado por mês
  const dynamicMonthlyDataWithAccumulated = useMemo(() => {
    let accum = 0;
    return dynamicMonthlyData.map(item => {
      accum += item.Faturamento;
      return {
        ...item,
        Faturamento: item.Faturamento,
        "Faturamento Acumulado": accum,
        Custos: item.Custos
      };
    });
  }, [dynamicMonthlyData]);

  // 3. Frete pago + Frete não pago (Recebido vs Pendente real)
  const paymentStatusData = useMemo(() => {
    let totalPaid = 0;
    let totalUnpaid = 0;

    freightsMonth.forEach(f => {
      if (f.status === "Cancelado") return;
      const val = f.financial?.value || 0;
      const adv = f.financial?.advance !== undefined ? f.financial.advance : Math.round(val * 0.7);
      const bal = f.financial?.balance !== undefined ? f.financial.balance : Math.round(val * 0.3);
      const balStatus = f.financial?.balanceStatus || "Pendente";

      // Adiantamento is always paid
      totalPaid += adv;
      if (balStatus === "Pago") {
        totalPaid += bal;
      } else {
        totalUnpaid += bal;
      }
    });

    return [
      { name: "Pago (Adiantamento + Saldo Recebido)", value: totalPaid, color: "#10b981" },
      { name: "Pendente (Saldo a Receber)", value: totalUnpaid, color: "#f59e0b" }
    ];
  }, [freightsMonth]);

  // 4. Comissão Mot (Driver commission)
  const totalCommissionMonth = useMemo(() => {
    return freightsMonth.reduce((sum, f) => sum + (f.financial?.commission || 0), 0);
  }, [freightsMonth]);

  const commissionByDriverChartData = useMemo(() => {
    const map: Record<string, number> = {};
    freightsMonth.forEach(f => {
      const driver = drivers.find(d => d.id === f.driverId);
      const name = driver ? driver.fullName.split(" ")[0] : "Motorista";
      map[name] = (map[name] || 0) + (f.financial?.commission || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [freightsMonth, drivers]);

  // 5. Abastecimento (Refuel total and per vehicle)
  const totalFuelSpendMonth = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    return refuels.filter(r => r.date.startsWith(targetYearMonth)).reduce((sum, r) => sum + (r.totalValue || 0), 0);
  }, [refuels]);

  const fuelSpendByVehicleChartData = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    const map: Record<string, number> = {};
    refuels.filter(r => r.date.startsWith(targetYearMonth)).forEach(r => {
      const vehicle = vehicles.find(v => v.id === r.vehicleId);
      const name = vehicle ? vehicle.plate : "Outros";
      map[name] = (map[name] || 0) + (r.totalValue || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [refuels, vehicles]);

  // 6. Km (Distance traveled)
  const kmByVehicleChartData = useMemo(() => {
    const map: Record<string, number> = {};
    freightsMonth.forEach(f => {
      const vehicle = vehicles.find(v => v.id === f.vehicleId);
      const name = vehicle ? vehicle.plate : "Outros";
      map[name] = (map[name] || 0) + (f.mileage?.total || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [freightsMonth, vehicles]);

  // 7. Consumo (Liters consumed)
  const totalLitersMonth = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    return refuels.filter(r => r.date.startsWith(targetYearMonth)).reduce((sum, r) => sum + (r.liters || 0), 0);
  }, [refuels]);

  const litersByVehicleChartData = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    const map: Record<string, number> = {};
    refuels.filter(r => r.date.startsWith(targetYearMonth)).forEach(r => {
      const vehicle = vehicles.find(v => v.id === r.vehicleId);
      const name = vehicle ? vehicle.plate : "Outros";
      map[name] = (map[name] || 0) + (r.liters || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [refuels, vehicles]);

  // 8. Média KM/L: mesmo cálculo do módulo Combustível — diferença de odômetro entre
  // abastecimentos consecutivos do mesmo veículo, dividida pelos litros do abastecimento atual.
  const kmLPerRefuel = useMemo(() => {
    const byVehicle: Record<string, Refuel[]> = {};
    refuels.forEach(r => {
      byVehicle[r.vehicleId] = byVehicle[r.vehicleId] || [];
      byVehicle[r.vehicleId].push(r);
    });
    const enriched: Record<string, number> = {};
    Object.values(byVehicle).forEach(list => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < sorted.length; i++) {
        const curr = sorted[i];
        const prev = sorted[i - 1];
        if (prev && curr.odometer && prev.odometer && curr.odometer > prev.odometer && curr.liters > 0) {
          enriched[curr.id] = (curr.odometer - prev.odometer) / curr.liters;
        }
      }
    });
    return enriched;
  }, [refuels]);

  const averageKmLMonth = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    const monthValues = refuels
      .filter(r => r.date.startsWith(targetYearMonth))
      .map(r => kmLPerRefuel[r.id])
      .filter((v): v is number => v !== undefined);
    return monthValues.length > 0 ? monthValues.reduce((sum, v) => sum + v, 0) / monthValues.length : 0;
  }, [refuels, kmLPerRefuel, currentYear, currentMonth]);

  const kmLByVehicleChartData = useMemo(() => {
    const targetYearMonth = `${currentYear}-${currentMonth < 10 ? "0" + currentMonth : currentMonth}`;
    return vehicles.map(v => {
      const vValues = refuels
        .filter(r => r.vehicleId === v.id && r.date.startsWith(targetYearMonth))
        .map(r => kmLPerRefuel[r.id])
        .filter((val): val is number => val !== undefined);
      const kmL = vValues.length > 0
        ? parseFloat((vValues.reduce((sum, val) => sum + val, 0) / vValues.length).toFixed(2))
        : parseFloat(v.averageConsumption || "0");
      return {
        name: v.plate,
        "KM/L": kmL,
        model: v.model
      };
    }).filter(item => item["KM/L"] > 0).sort((a, b) => b["KM/L"] - a["KM/L"]);
  }, [vehicles, refuels, kmLPerRefuel, currentYear, currentMonth]);

  // Sparkline generator helper
  const renderSparkline = (points: number[], colorClass = "stroke-primary") => {
    const width = 100;
    const height = 30;
    const cleanPoints = points.length > 0 ? points : [0, 0];
    const max = Math.max(...cleanPoints, 1);
    const min = Math.min(...cleanPoints, 0);
    const divisor = cleanPoints.length > 1 ? cleanPoints.length - 1 : 1;
    const stepX = width / divisor;
    const mapped = cleanPoints.map((p, i) => {
      const x = i * stepX;
      const y = height - ((p - min) / (max === min ? 1 : (max - min))) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg className={`w-20 h-6 ${colorClass}`} fill="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={mapped}
        />
      </svg>
    );
  };

  // Indicadores de Performance (anéis): métricas financeiras e operacionais do mês filtrado
  const impostosPercentage = taxRate;
  // Anel do valor de Combustível usa a mesma proporção (gasto/despesas) do anel #6, mas exibe o valor em R$
  const fuelSpendRingPercentage = expensesMonth > 0 ? (totalFuelSpendMonth / expensesMonth) * 100 : 0;
  // Comissão: calculada automaticamente a partir do somatório real dos manifestos de frete (nunca editável manualmente)
  const comissaoPercentage = billingMonth > 0 ? Math.min(100, (totalCommissionMonth / billingMonth) * 100) : 0;
  // KM/L não é um percentual: normaliza visualmente contra um teto de referência de 3.5 km/L (eficiência típica de caminhões)
  const kmLRingPercentage = Math.min(100, (averageKmLMonth / 3.5) * 100);
  const fuelSpendPercentageOfExpenses = expensesMonth > 0 ? (totalFuelSpendMonth / expensesMonth) * 100 : 0;

  return (
    <div id="central-controle-dashboard" className="space-y-6 animate-fade-in text-left">

      {/* 0. RESUMO RÁPIDO: Faturamento / Dívida-Alavancagem / Despesas do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border border-l-4 border-l-blue-400 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <span className="w-4 h-4 rounded-full bg-blue-400 shrink-0 shadow-[0_0_22px_rgba(96,165,250,1)]" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-muted-foreground">Faturamento</span>
            <p className="text-3xl font-black text-blue-400 font-mono truncate" style={{ textShadow: "0 0 24px rgba(96,165,250,0.7)" }}>R$ {billingMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-red-400 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <span className="w-4 h-4 rounded-full bg-red-400 shrink-0 shadow-[0_0_22px_rgba(248,113,113,1)]" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-muted-foreground">Dívida / Alavancagem</span>
            <p className="text-3xl font-black text-red-400 font-mono truncate" style={{ textShadow: "0 0 24px rgba(248,113,113,0.7)" }}>R$ {totalDividaPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-emerald-400 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <span className="w-4 h-4 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_22px_rgba(52,211,153,1)]" />
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-muted-foreground">Despesas</span>
            <p className="text-3xl font-black text-emerald-400 font-mono truncate" style={{ textShadow: "0 0 24px rgba(52,211,153,0.7)" }}>R$ {expensesMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* 1. CLEAN MODERN WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Painel Geral de Operações
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Controle operacional de frotas, análises de desempenho financeiro e rastreamento de cargas em tempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 md:self-center">
          {/* Filtro de mês/ano */}
          <div className="flex items-center gap-1 bg-muted px-1.5 py-1.5 rounded-lg border border-border">
            <button
              onClick={goToPrevMonth}
              className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="relative">
              <button
                onClick={() => (monthPickerOpen ? setMonthPickerOpen(false) : openMonthPicker())}
                className="flex items-center gap-1.5 text-xs font-bold text-foreground px-1.5 min-w-[110px] justify-center cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                title="Escolher mês e ano"
              >
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                {currentMonthName} {currentYear}
              </button>
              {monthPickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMonthPickerOpen(false)} />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 z-50 bg-card border border-border rounded-xl shadow-2xl p-3 w-60 animate-scale-in">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <button
                        onClick={() => setPickerYear(y => y - 1)}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-foreground">{pickerYear}</span>
                      <button
                        onClick={() => setPickerYear(y => y + 1)}
                        className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SHORT_MONTH_NAMES.map((m, idx) => {
                        const monthNum = idx + 1;
                        const isSelected = monthNum === selectedMonth && pickerYear === selectedYear;
                        const isCurrent = monthNum === today.getMonth() + 1 && pickerYear === today.getFullYear();
                        return (
                          <button
                            key={m}
                            onClick={() => {
                              setSelectedMonth(monthNum);
                              setSelectedYear(pickerYear);
                              setMonthPickerOpen(false);
                            }}
                            className={`text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                                : isCurrent
                                  ? "border border-blue-500/50 text-blue-500 dark:text-blue-400"
                                  : "hover:bg-muted text-foreground"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {!isViewingCurrentMonth && (
              <button
                onClick={() => { setSelectedMonth(today.getMonth() + 1); setSelectedYear(today.getFullYear()); }}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline px-1.5 cursor-pointer"
              >
                Hoje
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-lg border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sincronizado: {CURRENT_DATE_STR}</span>
          </div>
        </div>
      </div>

      {/* 1b. INDICADORES DE PERFORMANCE (Anéis de Progresso, mesmo estilo do BI Analítico) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <RadialGauge label="Impostos" value={impostosPercentage} displayValue={`R$ ${(billingMonth * (impostosPercentage / 100)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} editable onEdit={(v) => saveCompanyField("taxRate", v)} />
        <RadialGauge label="Combustível" value={fuelSpendRingPercentage} displayValue={`R$ ${totalFuelSpendMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} / ${fuelSpendRingPercentage.toFixed(0)}%`} />
        <RadialGauge label="Comissão" value={comissaoPercentage} displayValue={`R$ ${totalCommissionMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} / ${comissaoPercentage.toFixed(0)}%`} />
        <RadialGauge label="KM/L (média)" value={kmLRingPercentage} displayValue={`${averageKmLMonth.toFixed(2)}`} />
        <RadialGauge label="Margem Lucro" value={marginPercentage} displayValue={`R$ ${estimatedProfitMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} / ${marginPercentage}%`} />
        <RadialGauge label="% Gasto c/ Combustível" value={fuelSpendPercentageOfExpenses} />
      </div>

      {/* 1c. HERO CHART: Faturamento vs Custos ao longo do ano (destaque visual principal) */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Faturamento vs Custos</h3>
            <p className="text-[11px] text-muted-foreground">Evolução mensal de receita e despesas operacionais em {currentYear}.</p>
          </div>
          <div className="flex items-center gap-4 text-[10.5px] font-semibold">
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Faturamento</span>
            <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Custos</span>
          </div>
        </div>
        <div className="h-[260px] w-full">
          {dynamicMonthlyData.length === 0 || dynamicMonthlyData.every(d => d.Faturamento === 0 && d.Custos === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-1.5">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground font-medium">Sem dados financeiros suficientes para exibir o gráfico ainda.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dynamicMonthlyData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroFaturamentoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v} />
                <Tooltip
                  formatter={(value: any, name: string) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, name]}
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-foreground)", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="Faturamento" stroke="#10b981" strokeWidth={2.5} fill="url(#heroFaturamentoGrad)" />
                <Line type="monotone" dataKey="Custos" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. CORE METRICS GRID OF 8 INDICATORS (More Charts, Less Text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* KPI 1: Faturamento por frete */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Faturamento por Frete</span>
            <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
              <Coins className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Média por Viagem</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              R$ {avgBillingPerFreight.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <div className="flex items-center justify-between text-[8px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500" /> Adiantamento</span>
              <span className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-amber-500" /> Saldo</span>
            </div>
          </div>
          <div className="h-[55px] w-full mt-2">
            {(() => {
              const recent = recentFreightsChartData.slice(-6);
              const hasData = recent.some((f: any) => (f["Pago (Adiantamento)"] || 0) > 0 || (f["Não Pago (Saldo)"] || 0) > 0);
              if (!hasData) {
                return <div className="text-[10px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum dado</div>;
              }
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={recent} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Bar dataKey="Pago (Adiantamento)" fill="#10b981" radius={[3, 3, 0, 0]} barSize={8} />
                    <Line type="monotone" dataKey="Não Pago (Saldo)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, name]}
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* KPI 2: Faturamento Mensal acumulado por mês */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Faturamento Acumulado</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Este Mês ({currentMonthName})</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              R$ {billingMonth.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </p>
            <span className="text-[9.5px] text-muted-foreground">Evolução acumulada 2026</span>
          </div>
          <div className="h-[55px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicMonthlyDataWithAccumulated} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="miniFaturamentoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Faturamento Acumulado" stroke="#10b981" fill="url(#miniFaturamentoGrad)" strokeWidth={1.5} />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Acumulado"]}
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 3: Adiantamento vs Saldo */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Fretes: Adiantamento vs Saldo</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Média de Recebimento</span>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-black font-mono text-foreground leading-tight">
                {paymentStatusData[0] && paymentStatusData[1] && (paymentStatusData[0].value + paymentStatusData[1].value) > 0
                  ? `${Math.round((paymentStatusData[0].value / (paymentStatusData[0].value + paymentStatusData[1].value)) * 100)}%`
                  : "0%"}
              </p>
              <span className="text-[10px] font-bold text-emerald-500">Adiantamento</span>
            </div>
            <span className="text-[9.5px] text-muted-foreground">Proporção financeira mensal</span>
          </div>
          {/* Stacked Progress Bar */}
          <div className="space-y-1.5 mt-2">
            {(() => {
              const p = paymentStatusData[0]?.value || 0;
              const n = paymentStatusData[1]?.value || 0;
              const t = p + n;
              const pctP = t > 0 ? Math.round((p / t) * 100) : 0;
              const pctN = t > 0 ? 100 - pctP : 0;
              return (
                <>
                  <div className="w-full h-2.5 rounded-full bg-muted flex overflow-hidden border border-border/40">
                    <div className="bg-emerald-500 h-full" style={{ width: `${pctP}%` }} />
                    <div className="bg-amber-500 h-full" style={{ width: `${pctN}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Adiantamento: R$ {p.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Saldo: R$ {n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* KPI 4: Comissão Mot */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Comissões de Motoristas</span>
            <span className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
              <Sliders className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Total Pago no Mês</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              R$ {totalCommissionMonth.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9.5px] text-muted-foreground">Distribuição por motorista</span>
          </div>
          <div className="h-[55px] w-full mt-2">
            {commissionByDriverChartData.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum dado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={commissionByDriverChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="miniCommissionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#miniCommissionGrad)" dot={{ r: 2 }} />
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Comissão"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KPI 5: Abastecimento */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-red-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Abastecimento (Diesel)</span>
            <span className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
              <Fuel className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Custos de Abastecimento</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              R$ {totalFuelSpendMonth.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9.5px] text-muted-foreground font-medium">Divisão de custos por placa</span>
          </div>
          <div className="h-[55px] w-full mt-2">
            {fuelSpendByVehicleChartData.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum dado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelSpendByVehicleChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Bar dataKey="value" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Combustível"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KPI 6: Km */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Quilometragem (KM)</span>
            <span className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Compass className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Distância Rodada no Mês</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              {kmMonth.toLocaleString("pt-BR")} <span className="text-xs font-bold text-muted-foreground">km</span>
            </p>
            <span className="text-[9.5px] text-muted-foreground">Quilômetros rodados por veículo</span>
          </div>
          <div className="h-[55px] w-full mt-2">
            {kmByVehicleChartData.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum dado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kmByVehicleChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString("pt-BR")} KM`, "Distância"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KPI 7: consumo */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-orange-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Consumo Litros (L)</span>
            <span className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Volume de Combustível</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              {totalLitersMonth.toLocaleString("pt-BR")} <span className="text-xs font-bold text-muted-foreground">L</span>
            </p>
            <span className="text-[9.5px] text-muted-foreground">Litros abastecidos por veículo</span>
          </div>
          <div className="h-[55px] w-full mt-2">
            {litersByVehicleChartData.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum dado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={litersByVehicleChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Bar dataKey="value" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString("pt-BR")} Litros`, "Consumo"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* KPI 8: Média KM/L */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-teal-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Média de Consumo (KM/L)</span>
            <span className="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg">
              <Gauge className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[10.5px] text-muted-foreground block">Desempenho da Frota</span>
            <p className="text-xl font-black font-mono text-foreground leading-tight">
              {averageKmLMonth > 0 ? averageKmLMonth.toFixed(2) : "0.00"} <span className="text-xs font-bold text-muted-foreground">km/L</span>
            </p>
            <span className="text-[9.5px] text-muted-foreground">Eficiência de cada veículo</span>
          </div>
          <div className="h-[55px] w-full mt-2">
            {kmLByVehicleChartData.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum dado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kmLByVehicleChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Bar dataKey="KM/L" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  <Tooltip
                    formatter={(value: any) => [`${value} km/L`, "KM/L"]}
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "9px" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 2b. DESPESAS DO MÊS: donut resumo + ranking por categoria, lado a lado (mesmo padrão do Balanço de Dívidas abaixo) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="w-full">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-4">
              <span className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground font-sans">Despesas do Mês</h3>
                <p className="text-[11px] text-muted-foreground">Total de despesas lançadas em {currentMonthName} de {currentYear}, por categoria.</p>
              </div>
            </div>
            {expensesByCategoryMonth.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground font-medium">Nenhuma despesa lançada neste mês.</div>
            ) : (() => {
              const expenseColors = ["#ef4444", "#fb7185", "#dc2626", "#f43f5e", "#b91c1c", "#fca5a5", "#9f1239"];
              const expensesTotal = expensesByCategoryMonth.reduce((sum, c) => sum + c.value, 0);
              return (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
                  {/* Category Cards Column (Left - 5 cols), mesmo padrão do Balanço de Dívidas */}
                  <div className="xl:col-span-5 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {expensesByCategoryMonth.map((d, index) => {
                      const color = expenseColors[index % expenseColors.length];
                      return (
                        <div key={d.category} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-black text-foreground truncate">{d.category}</span>
                          </div>
                          <span className="text-sm font-black font-mono text-red-600 dark:text-red-400 shrink-0 ml-2">
                            R$ {d.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Donut Column (Right - 7 cols) */}
                  <div className="xl:col-span-7 h-[250px] w-full flex items-center justify-center">
                    <div className="flex items-center gap-8 w-full justify-center">
                      <div className="h-[220px] w-[220px] relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={expensesByCategoryMonth} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                              {expensesByCategoryMonth.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={expenseColors[index % expenseColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Total"]}
                              contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-foreground)", fontSize: "10px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Total</span>
                          <span className="text-base font-black font-mono text-foreground">R$ {expensesTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {expensesByCategoryMonth.map((d, index) => (
                          <div key={d.category} className="flex items-center gap-2 text-xs font-semibold">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: expenseColors[index % expenseColors.length] }} />
                            <span className="text-muted-foreground">{d.category}:</span>
                            <span className="text-foreground font-mono">{expensesTotal > 0 ? ((d.value / expensesTotal) * 100).toFixed(0) : 0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="w-full">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">Despesas por Categoria</h3>
                  <p className="text-[11px] text-muted-foreground">Ranking das categorias com maior gasto no mês selecionado.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTo("expenses")}
                className="px-3 py-1.5 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-xl text-[11px] transition-all flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-muted-foreground" />
                Ir para Controle de Despesas
              </button>
            </div>

            <div className="h-[260px] w-full">
              {expensesByCategoryMonth.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full w-full py-8 text-center bg-card/50 rounded-xl border border-dashed border-border p-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/40 mb-2 stroke-[1.5]" />
                  <p className="text-xs text-muted-foreground font-medium">Nenhuma despesa lançada neste mês.</p>
                </div>
              ) : (() => {
                const expenseColors = ["#ef4444", "#fb7185", "#dc2626", "#f43f5e", "#b91c1c", "#fca5a5", "#9f1239"];
                const maxVal = Math.max(...expensesByCategoryMonth.map(c => c.value), 1);
                return (
                  <div className="space-y-3.5 overflow-y-auto h-full pr-1">
                    {expensesByCategoryMonth.map((item, index) => {
                      const color = expenseColors[index % expenseColors.length];
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
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: DEBTS CHART + DÍVIDAS POR CATEGORIA, lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div id="dashboard-performance-chart" className="w-full">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 mb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Coins className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground font-sans">Balanço Geral de Dívidas & Obrigações</h3>
                <p className="text-[11px] text-muted-foreground">Classificação de contas por prioridade de quitação.</p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTo("debts")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              Ir para Sessão de Dívidas ➔
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
            {/* Direct Metrics Column (Left - 5 cols) */}
            <div className="xl:col-span-5 space-y-4">
              <div className="space-y-3">
                {/* Red Pending */}
                <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <span className="text-xs font-black text-foreground block">Pagar</span>
                      <span className="text-[10px] text-muted-foreground block">Pendente de vencimento</span>
                    </div>
                  </div>
                  <span className="text-sm font-black font-mono text-red-600 dark:text-red-400">
                    R$ {(() => {
                      const total = debts.filter(d => d.status === "Falta Pagar").reduce((acc, curr) => acc + curr.value, 0);
                      return total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                    })()}
                  </span>
                </div>

                {/* Green Paid */}
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <span className="text-xs font-black text-foreground block">Pago</span>
                      <span className="text-[10px] text-muted-foreground block">Baixa operacional efetuada</span>
                    </div>
                  </div>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    R$ {(() => {
                      const total = debts.filter(d => d.status === "Pago").reduce((acc, curr) => acc + curr.value, 0);
                      return total.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Graph Column (Right - 7 cols) */}
            <div className="xl:col-span-7 h-[250px] w-full flex items-center justify-center">
              {(() => {
                const pendingTotal = debts.filter(d => d.status === "Falta Pagar").reduce((acc, curr) => acc + curr.value, 0);
                const paidTotal = debts.filter(d => d.status === "Pago").reduce((acc, curr) => acc + curr.value, 0);
                const donutData = [
                  { name: "Pagar", value: pendingTotal, color: "#ef4444" },
                  { name: "Pago", value: paidTotal, color: "#10b981" }
                ].filter(d => d.value > 0);
                const grandTotal = pendingTotal + paidTotal;

                if (donutData.length === 0) {
                  return <div className="text-xs text-muted-foreground font-medium">Nenhuma dívida cadastrada.</div>;
                }

                return (
                  <div className="flex items-center gap-8 w-full justify-center">
                    <div className="h-[220px] w-[220px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Total"]}
                            contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-foreground)", fontSize: "10px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Total</span>
                        <span className="text-base font-black font-mono text-foreground">R$ {grandTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {donutData.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-xs font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-muted-foreground">{d.name}:</span>
                          <span className="text-foreground font-mono">{grandTotal > 0 ? ((d.value / grandTotal) * 100).toFixed(0) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 4. DÍVIDAS POR CATEGORIA */}
      <div id="dashboard-debts-by-category" className="w-full">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                <Coins className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground font-sans">Dívidas por Categoria</h3>
                <p className="text-[11px] text-muted-foreground">Distribuição das contas e obrigações da transportadora por tipo de despesa.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTo("debts")}
              className="px-3 py-1.5 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-xl text-[11px] transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-muted-foreground" />
              Ir para Gestão de Dívidas
            </button>
          </div>

          <div className="h-[260px] w-full">
            {(() => {
              const debtCategoryTotals = Object.values(
                debts.reduce((acc: Record<string, { category: string; value: number }>, d) => {
                  acc[d.category] = acc[d.category] || { category: d.category, value: 0 };
                  acc[d.category].value += d.value || 0;
                  return acc;
                }, {})
              ).sort((a: any, b: any) => b.value - a.value);

              if (debtCategoryTotals.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full w-full py-8 text-center bg-card/50 rounded-xl border border-dashed border-border p-4">
                    <Coins className="w-8 h-8 text-muted-foreground/40 mb-2 stroke-[1.5]" />
                    <p className="text-xs text-muted-foreground font-medium">Nenhuma dívida cadastrada.</p>
                  </div>
                );
              }

              const debtColors = ["#ef4444", "#fb7185", "#dc2626", "#f43f5e", "#b91c1c", "#fca5a5", "#9f1239", "#7f1d1d"];
              const maxVal = Math.max(...debtCategoryTotals.map((c: any) => c.value), 1);
              return (
                <div className="space-y-3.5 overflow-y-auto h-full pr-1">
                  {debtCategoryTotals.map((item: any, index: number) => {
                    const color = debtColors[index % debtColors.length];
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
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      </div>

      {/* 4b. CUSTOS OPERACIONAIS DOS FRETES */}
      <div id="dashboard-freight-operational-costs" className="w-full">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                <Route className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground font-sans">Custos Operacionais dos Fretes</h3>
                <p className="text-[11px] text-muted-foreground">Pedágio, alimentação, hospedagem, comissão e outros custos lançados nos manifestos.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTo("freights")}
              className="px-3 py-1.5 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-xl text-[11px] transition-all flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-muted-foreground" />
              Ir para Manifesto de Fretes
            </button>
          </div>

          {(() => {
            const freightCostColors = ["#ef4444", "#fb7185", "#dc2626", "#f43f5e", "#b91c1c"];
            const activeFreightsForCost = freights.filter(f => f.status !== "Cancelado");
            const freightCostBreakdown = [
              { name: "Pedágio", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.toll || 0), 0) },
              { name: "Alimentação", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.food || 0), 0) },
              { name: "Hospedagem", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.lodging || 0), 0) },
              { name: "Comissão", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.commission || 0), 0) },
              { name: "Outros", value: activeFreightsForCost.reduce((s, f) => s + (f.financial?.otherExpenses || 0), 0) }
            ].filter(c => c.value > 0);

            if (freightCostBreakdown.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-[180px] w-full py-8 text-center bg-card/50 rounded-xl border border-dashed border-border p-4">
                  <Route className="w-8 h-8 text-muted-foreground/40 mb-2 stroke-[1.5]" />
                  <p className="text-xs text-muted-foreground font-medium">Nenhum custo de frete cadastrado.</p>
                </div>
              );
            }

            return (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-[200px] w-full sm:w-[220px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={freightCostBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                        {freightCostBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={freightCostColors[index % freightCostColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Total"]}
                        contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-foreground)", fontSize: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-muted-foreground">
                  {freightCostBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: freightCostColors[index % freightCostColors.length] }} />
                      <span>{item.name}: <strong className="text-foreground">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 5. BOTTOM SECTION: FLEET STATUS & VISUAL ANALYTICS */}
      <div id="dashboard-fleet-and-analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Critical Fleet Alerts Hub & Status Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                  <Gauge className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Status e Saúde da Frota</h3>
                  <p className="text-[11px] text-muted-foreground">Distribuição operacional dos veículos e manutenção.</p>
                </div>
              </div>
            </div>

            {/* Donut Chart representing Fleet status */}
            <div className="flex flex-col items-center justify-center h-[140px] relative mb-4">
              {vehicles.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/60 h-full flex items-center justify-center font-medium">Nenhum veículo disponível</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {fleetStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        color: "var(--color-foreground)",
                        fontSize: "10px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black font-mono text-foreground">{vehicles.length}</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">Veículos</span>
              </div>
            </div>

            {/* Mini Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] px-2 mb-4">
              {fleetStatusBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}: <strong className="text-foreground">{item.value}</strong></span>
                </div>
              ))}
            </div>

            {/* List of critical maintenance alerts (max 2 to avoid clutter) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Alertas Ativos</span>
              {vehicles.filter(v => {
                const isNearMaintenance = v.nextMaintenance > 0 && (v.nextMaintenance - v.currentMileage <= 2000);
                const isLicensingNear = v.plate === "XYZ-5678" || v.plate === "LMN-3344" || (v.licensingExpiration && v.licensingExpiration.startsWith("2026-06"));
                return isNearMaintenance || isLicensingNear;
              }).length === 0 ? (
                <div className="flex items-center gap-2 py-1.5 text-[10.5px] text-emerald-500">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Todos os veículos regulares e revisados.</span>
                </div>
              ) : (
                vehicles.filter(v => {
                  const isNearMaintenance = v.nextMaintenance > 0 && (v.nextMaintenance - v.currentMileage <= 2000);
                  const isLicensingNear = v.plate === "XYZ-5678" || v.plate === "LMN-3344" || (v.licensingExpiration && v.licensingExpiration.startsWith("2026-06"));
                  return isNearMaintenance || isLicensingNear;
                }).slice(0, 2).map((v) => {
                  const isNearMaintenance = v.nextMaintenance > 0 && (v.nextMaintenance - v.currentMileage <= 2000);
                  const isLicensingNear = v.plate === "XYZ-5678" || v.plate === "LMN-3344" || (v.licensingExpiration && v.licensingExpiration.startsWith("2026-06"));
                  return (
                    <div key={v.id} className="p-2 bg-muted/30 border border-border rounded-xl flex items-center justify-between text-[11px] gap-2">
                      <div className="truncate">
                        <span className="font-bold font-mono text-foreground mr-1.5">{v.plate}</span>
                        <span className="text-muted-foreground truncate text-[10.5px]">{v.model}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold shrink-0">
                        {isNearMaintenance ? "REVISÃO" : "DOCUMENTO"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <button
              onClick={() => onNavigateTo("vehicles")}
              className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-foreground font-semibold rounded-xl text-xs transition-all w-full cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
              Gerenciar Frota Completa
            </button>
          </div>
        </div>

        {/* Visual Analytics Box - Toggle between Expenses distribution and Cargo Revenue distribution */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl w-full">
                <button
                  onClick={() => setBottomActiveTab("expenses")}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    bottomActiveTab === "expenses"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Despesas
                </button>
                <button
                  onClick={() => setBottomActiveTab("cargo")}
                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    bottomActiveTab === "cargo"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Receita por Carga
                </button>
              </div>
            </div>

            {bottomActiveTab === "expenses" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-foreground">Distribuição de Despesas</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Junho 2026</span>
                </div>
                {expenseBreakdown.length === 0 ? (
                  <div className="h-[150px] flex items-center justify-center text-xs text-muted-foreground">
                    Nenhuma despesa registrada neste mês.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center h-[140px] relative mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "12px",
                              color: "var(--color-foreground)",
                              fontSize: "10px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Despesa Total</span>
                        <span className="text-[13px] font-black font-mono text-rose-500">
                          R$ {expensesMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1 text-[10.5px]">
                      {expenseBreakdown.map((item, idx) => {
                        const percentage = expensesMonth > 0 ? ((item.value / expensesMonth) * 100).toFixed(0) : "0";
                        return (
                          <div key={idx} className="flex items-center justify-between py-1 px-1.5 hover:bg-muted/30 rounded-lg transition-colors">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="text-muted-foreground truncate font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="font-bold text-foreground">R$ {item.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                              <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded font-semibold">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-foreground">Receitas por Tipo de Carga</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Junho 2026</span>
                </div>
                {cargoRevenueData.length === 0 ? (
                  <div className="h-[150px] flex items-center justify-center text-xs text-muted-foreground">
                    Nenhum faturamento registrado neste mês.
                  </div>
                ) : (
                  <>
                    <div className="h-[140px] w-full mt-2 mb-2 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={cargoRevenueData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                            {cargoRevenueData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Receita"]}
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "12px",
                              color: "var(--color-foreground)",
                              fontSize: "10px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Faturamento</span>
                        <span className="text-[13px] font-black font-mono text-emerald-500">
                          R$ {billingMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1 text-[10.5px]">
                      {cargoRevenueData.map((item, idx) => {
                        const percentage = billingMonth > 0 ? ((item.value / billingMonth) * 100).toFixed(0) : "0";
                        return (
                          <div key={idx} className="flex items-center justify-between py-1 px-1.5 hover:bg-muted/30 rounded-lg transition-colors">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="text-muted-foreground truncate font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono">
                              <span className="font-bold text-foreground">R$ {item.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                              <span className="text-[9px] text-muted-foreground bg-muted px-1 rounded font-semibold">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Driver Notifications Feed Card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl relative">
                  <Activity className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-card animate-pulse" />
                  )}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-sans">Atividade de Motoristas</h3>
                  <p className="text-[11px] text-muted-foreground font-sans">Monitoramento em tempo real.</p>
                </div>
              </div>

              {notifications.some(n => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10 transition-colors cursor-pointer"
                >
                  Lidas
                </button>
              )}
            </div>

            {/* List of active notifications */}
            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1.5 scrollbar-thin scrollbar-thumb-border flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Clock className="w-10 h-10 text-muted-foreground/30 mb-2 animate-pulse" />
                  <p className="text-xs font-medium">Nenhum evento registrado ainda.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">As atividades dos motoristas aparecerão aqui.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  // Style based on notification type
                  let typeColor = "border-blue-500 bg-blue-500/5";
                  let typeLabel = "Info";
                  if (n.type === "start_trip") {
                    typeColor = "border-emerald-500 bg-emerald-500/5";
                    typeLabel = "Início";
                  } else if (n.type === "end_trip") {
                    typeColor = "border-amber-500 bg-amber-500/5";
                    typeLabel = "Fim";
                  } else if (n.type === "record" || n.type === "log") {
                    typeColor = "border-indigo-500 bg-indigo-500/5";
                    typeLabel = "Registro";
                  }

                  const formattedDate = n.timestamp 
                    ? new Date(n.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date(n.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                    : "";

                  return (
                    <div
                      key={n.id}
                      className={`p-3 border-l-4 rounded-r-xl transition-all ${typeColor} ${
                        !n.read ? "ring-1 ring-blue-500/20 shadow-xs" : "opacity-85"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold font-sans text-foreground tracking-tight leading-normal flex-1">
                          {n.message}
                        </span>
                        <span className="text-[8px] font-mono uppercase bg-foreground/10 text-foreground px-1.5 py-0.5 rounded shrink-0">
                          {typeLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/30">
                        <span className="text-[9px] text-muted-foreground font-medium">{n.driverName || "Motorista"}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">{formattedDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
