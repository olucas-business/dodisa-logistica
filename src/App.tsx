import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Driver, Vehicle, Freight, Refuel, Expense, Tire, Debt, TruckCashTransaction, CaixaCaminhao, CaixaMovimentacao, MaintenanceLog } from "./types";
import LoginForm from "./components/LoginForm";
import BrandMark from "./components/BrandMark";
import VehicleTracking from "./components/VehicleTracking";
import CompanyProfile from "./components/CompanyProfile";
import DriverWorkspace from "./components/DriverWorkspace";
import DashboardOverview from "./components/DashboardOverview";
import DriversManager from "./components/DriversManager";
import VehiclesManager from "./components/VehiclesManager";
import FreightsManager from "./components/FreightsManager";
import RefuelManager from "./components/RefuelManager";
import ExpensesManager from "./components/ExpensesManager";
import TiresManager from "./components/TiresManager";
import MaintenanceManager from "./components/MaintenanceManager";
import DebtsManager from "./components/DebtsManager";
import TruckCashManager from "./components/TruckCashManager";
import InteractiveMap from "./components/InteractiveMap";
import AnalyticsBI from "./components/AnalyticsBI";
import ImportSpreadsheet from "./components/ImportSpreadsheet";
import ImageAnalysisManager from "./components/ImageAnalysisManager";
import AIQueryWidget from "./components/AIQueryWidget";
import ReportsPanel from "./components/ReportsPanel";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import {
  Truck,
  Users,
  Compass,
  Coins,
  DollarSign,
  Fuel,
  TrendingUp,
  FileText,
  Sparkles,
  ShieldCheck,
  Wallet,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
  RotateCw,
  Trash2,
  Sun,
  Moon,
  FileSpreadsheet,
  Image,
  MessageSquare,
  Satellite,
  Building2,
  Wrench
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  const [aiSubTab, setAiSubTab] = useState<"image_reader" | "import" | "ai_assistant">("image_reader");

  // Theme management state & effect
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("erp_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    localStorage.setItem("erp_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Core database states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [freights, setFreights] = useState<Freight[]>([]);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [caixasCaminhao, setCaixasCaminhao] = useState<CaixaCaminhao[]>([]);
  const [caixaMovimentacoes, setCaixaMovimentacoes] = useState<CaixaMovimentacao[]>([]);
  
  // Premium Reset Modal & Notification Toast states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Authenticate session from local storage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("erp_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("erp_session");
      }
    }
  }, []);

  // Fetch full operational database
  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [drvRes, vhcRes, frtRes, refRes, expRes, tirRes, debRes, tcRes, maintRes] = await Promise.all([
        fetch("/api/drivers"),
        fetch("/api/vehicles"),
        fetch("/api/freights"),
        fetch("/api/refuels"),
        fetch("/api/expenses"),
        fetch("/api/tires"),
        fetch("/api/debts"),
        fetch("/api/caixa-caminhao"),
        fetch("/api/maintenance-logs")
      ]);

      const [drvData, vhcData, frtData, refData, expData, tirData, debData, tcData, maintData] = await Promise.all([
        drvRes.json(),
        vhcRes.json(),
        frtRes.json(),
        refRes.json(),
        expRes.json(),
        tirRes.json(),
        debRes.json(),
        tcRes.json(),
        maintRes.json()
      ]);

      setDrivers(Array.isArray(drvData) ? drvData : (drvData.success ? drvData.drivers : []));
      setVehicles(Array.isArray(vhcData) ? vhcData : (vhcData.success ? vhcData.vehicles : []));
      setFreights(Array.isArray(frtData) ? frtData : (frtData.success ? frtData.freights : []));
      setRefuels(Array.isArray(refData) ? refData : (refData.success ? refData.refuels : []));
      setExpenses(Array.isArray(expData) ? expData : (expData.success ? expData.expenses : []));
      setTires(tirData.success ? tirData.tires : (Array.isArray(tirData) ? tirData : []));
      setDebts(debData.success ? debData.debts : (Array.isArray(debData) ? debData : []));
      setCaixasCaminhao(tcData.success && tcData.caixas ? tcData.caixas : []);
      setCaixaMovimentacoes(tcData.success && tcData.movimentacoes ? tcData.movimentacoes : []);
      setMaintenanceLogs(maintData.success ? maintData.maintenanceLogs : (Array.isArray(maintData) ? maintData : []));
    } catch (err) {
      setErrorMsg("Erro de sincronização com o banco de dados. Tentando novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Operational Action Handles (CRUD Bridge)
  const handleAddDriver = async (payload: Partial<Driver>) => {
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao adicionar motorista");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateDriver = async (id: string, payload: Partial<Driver>) => {
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar ficha do motorista");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteDriver = async (id: string) => {
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir motorista");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddVehicle = async (payload: Partial<Vehicle>) => {
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao adicionar veículo");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateVehicle = async (id: string, payload: Partial<Vehicle>) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar ficha de veículo");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir veículo");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddFreight = async (payload: Partial<Freight>) => {
    try {
      const res = await fetch("/api/freights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao registrar frete");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateFreight = async (id: string, payload: Partial<Freight>) => {
    try {
      const res = await fetch(`/api/freights/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar manifesto de frete");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteFreight = async (id: string) => {
    try {
      const res = await fetch(`/api/freights/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir frete");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddRefuel = async (payload: Partial<Refuel>) => {
    try {
      const res = await fetch("/api/refuels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao adicionar abastecimento");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteRefuel = async (id: string) => {
    try {
      const res = await fetch(`/api/refuels/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir abastecimento");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddExpense = async (payload: Partial<Expense>) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao adicionar despesa");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateExpense = async (id: string, payload: Partial<Expense>) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar despesa");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir despesa");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddTire = async (payload: Partial<Tire>) => {
    try {
      const res = await fetch("/api/tires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao cadastrar pneu");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateTire = async (id: string, payload: Partial<Tire>) => {
    try {
      const res = await fetch(`/api/tires/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar pneu");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteTire = async (id: string) => {
    try {
      const res = await fetch(`/api/tires/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir pneu");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleRecordChange = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/tires/${id}/changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao registrar alteração");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleRecordRotation = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/tires/${id}/rotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao registrar rodízio");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddDebt = async (payload: Partial<Debt>) => {
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao cadastrar dívida");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateDebt = async (id: string, payload: Partial<Debt>) => {
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar dívida");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir dívida");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddMaintenanceLog = async (payload: Partial<MaintenanceLog>) => {
    try {
      const res = await fetch("/api/maintenance-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao cadastrar manutenção");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteMaintenanceLog = async (id: string) => {
    try {
      const res = await fetch(`/api/maintenance-logs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir manutenção");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDefinirSaldo = async (payload: { veiculo_id: string; saldo_inicial: number; observacao?: string }) => {
    try {
      const res = await fetch("/api/caixa-caminhao/saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao definir saldo inicial");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleAddGasto = async (payload: { caixa_id: string; categoria: string; valor: number; descricao: string; data: string; anexo?: string; moeda?: string; valorOriginal?: number; cotacao?: number }) => {
    try {
      const res = await fetch("/api/caixa-caminhao/gasto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao adicionar lançamento de caixa");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleUpdateGasto = async (id: string, payload: { categoria: string; valor: number; descricao: string; data: string; anexo?: string; moeda?: string; valorOriginal?: number; cotacao?: number }) => {
    try {
      const res = await fetch(`/api/caixa-caminhao/gasto/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao atualizar lançamento de caixa");
      return false;
    } catch (err) {
      return false;
    }
  };

  const handleDeleteGasto = async (id: string) => {
    try {
      const res = await fetch(`/api/caixa-caminhao/gasto/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        return true;
      }
      alert(data.message || "Erro ao excluir lançamento de caixa");
      return false;
    } catch (err) {
      return false;
    }
  };

  // Dynamic Reset Mapping for Premium Modal
  const TAB_RESET_MAPPING: Record<string, { label: string; key: string }> = {
    dashboard: { label: "todos os dados operacionais", key: "all" },
    drivers: { label: "Fichas de Motoristas", key: "drivers" },
    vehicles: { label: "Veículos de Frota", key: "vehicles" },
    tires: { label: "Controle de Pneus", key: "tires" },
    maintenance: { label: "Manutenção Preventiva", key: "maintenance-logs" },
    freights: { label: "Manifesto de Fretes", key: "freights" },
    refuels: { label: "Controle de Combustível", key: "refuels" },
    expenses: { label: "Despesas Operacionais", key: "expenses" },
    debts: { label: "Gestão de Dívidas", key: "debts" },
    truck_cash: { label: "Caixa do Caminhão", key: "caixa-caminhao" },
    map: { label: "Rotas e Fretes", key: "freights" },
    analytics: { label: "Estatísticas e BI (Todos)", key: "all" },
    import: { label: "Histórico de Importação", key: "all" },
    image_reader: { label: "Histórico de Leitura de Imagens", key: "image-analyses" },
    ai_assistant: { label: "Dados e Memória IA", key: "all" },
    reports: { label: "Relatórios de Auditoria", key: "all" }
  };

  const handleTriggerResetModal = () => {
    setResetModalOpen(true);
  };

  const handleConfirmResetModule = async () => {
    setResetModalOpen(false);
    setLoading(true);
    
    const activeMapping = TAB_RESET_MAPPING[tab] || { label: "todos os dados", key: "all" };
    
    try {
      const res = await fetch(`/api/reset/${activeMapping.key}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Trigger beautiful success toast
        setToastMessage(`✅ Painel de ${activeMapping.label} zerado com sucesso.`);
        setTimeout(() => setToastMessage(null), 4000);
        await fetchAllData();
      } else {
        alert(data.message || "Erro ao zerar o painel");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor para zerar painel.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("erp_session");
    setUser(null);
  };

  // Unauthenticated shell
  if (!user) {
    return <LoginForm onLoginSuccess={setUser} />;
  }

  // Redirect Motorista users to Driver Portal
  if (user.role === "Motorista") {
    return (
      <DriverWorkspace
        user={user}
        drivers={drivers}
        vehicles={vehicles}
        freights={freights}
        onLogout={handleLogout}
        onRefreshData={fetchAllData}
      />
    );
  }

  // Sidebar Menu Entries definitions
  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: Truck },
    { id: "drivers", label: "Motoristas", icon: Users },
    { id: "vehicles", label: "Frota de Veículos", icon: Truck },
    { id: "tracking", label: "Rastreamento", icon: Satellite },
    { id: "tires", label: "Controle de Pneus", icon: RotateCw },
    { id: "maintenance", label: "Manutenção Preventiva", icon: Wrench },
    { id: "freights", label: "Manifesto de Fretes", icon: Compass },
    { id: "refuels", label: "Combustível", icon: Fuel },
    { id: "expenses", label: "Controle Despesas", icon: DollarSign },
    { id: "debts", label: "Gestão de Dívidas", icon: Coins },
    { id: "truck_cash", label: "Caixa do Caminhão", icon: Wallet },
    { id: "analytics", label: "BI Analítico", icon: TrendingUp },
    { id: "ai_hub", label: "Central Inteligência IA", icon: Sparkles },
    { id: "reports", label: "Relatórios & Auditoria", icon: FileText },
    { id: "company", label: "Perfil da Empresa", icon: Building2 }
  ];

  return (
    <div id="erp-app-shell" className="h-screen w-screen max-h-screen bg-background text-foreground flex font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-25 lg:hidden transition-opacity cursor-pointer animate-fade-in"
        />
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        className={`bg-card text-card-foreground w-64 border-r border-border flex flex-col justify-between transition-all duration-300 z-30 fixed lg:relative h-screen overflow-y-auto scrollbar-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <BrandMark size="md" />
              {sidebarOpen && (
                <div className="truncate leading-tight">
                  <h1 className="text-sm font-black tracking-tight uppercase bg-gradient-to-r from-blue-600 to-sky-400 dark:from-blue-400 dark:to-sky-300 bg-clip-text text-transparent">
                    DODISA
                  </h1>
                  <span className="block text-[10px] text-muted-foreground font-mono tracking-wider truncate">
                    Logística · Carrier Manager
                  </span>
                </div>
              )}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 relative group/nav cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover/nav:scale-110" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  
                  {/* Collapsed Tooltip */}
                  {!sidebarOpen && (
                    <span className="absolute left-16 bg-slate-950 text-white text-[9px] font-mono uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-slate-800 opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-border space-y-3.5">
          {sidebarOpen && (
            <div className="p-2.5 bg-muted/60 border border-border rounded-lg">
              <p className="text-[10px] font-mono font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{user.role}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-xs font-bold rounded-lg transition-all"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {sidebarOpen && <span>Sair do ERP</span>}
          </button>
        </div>
      </aside>

      {/* Main Container Layer */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header toolbar */}
        <header className="bg-card border-b border-border h-14 flex items-center justify-between px-6 z-20 text-card-foreground">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-black text-foreground uppercase tracking-wide">
                {NAV_ITEMS.find((n) => n.id === tab)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Database sync status info */}
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            {/* Global Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title={theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden md:inline">Modo Escuro</span>
                </>
              )}
            </button>

            <button
              onClick={handleTriggerResetModal}
              disabled={loading}
              className="p-1.5 bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium border border-destructive/10 cursor-pointer"
              title={`Zerar painel de ${TAB_RESET_MAPPING[tab]?.label || "dados"}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Zerar Painel</span>
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider whitespace-nowrap">
                Banco Ativo
              </span>
            </div>
          </div>
        </header>

        {/* Core Workspace content with scrollbars */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={fetchAllData} className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded">
                Reconectar
              </button>
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center z-40 space-y-3 font-mono">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans font-bold">Carregando módulos do ERP...</p>
            </div>
          )}

          {/* RENDER DYNAMIC TAB VIEWS */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
            >
              {tab === "dashboard" && (
                <DashboardOverview
                  freights={freights}
                  drivers={drivers}
                  vehicles={vehicles}
                  refuels={refuels}
                  expenses={expenses}
                  debts={debts}
                  onNavigateTo={setTab}
                />
              )}

              {tab === "drivers" && (
                <DriversManager
                  drivers={drivers}
                  freights={freights}
                  refuels={refuels}
                  onAddDriver={handleAddDriver}
                  onUpdateDriver={handleUpdateDriver}
                  onDeleteDriver={handleDeleteDriver}
                />
              )}

              {tab === "vehicles" && (
                <VehiclesManager
                  vehicles={vehicles}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                />
              )}

              {tab === "tires" && (
                <TiresManager
                  tires={tires}
                  vehicles={vehicles}
                  onAddTire={handleAddTire}
                  onUpdateTire={handleUpdateTire}
                  onDeleteTire={handleDeleteTire}
                  onRecordChange={handleRecordChange}
                  onRecordRotation={handleRecordRotation}
                />
              )}

              {tab === "maintenance" && (
                <MaintenanceManager
                  maintenanceLogs={maintenanceLogs}
                  vehicles={vehicles}
                  onAddMaintenanceLog={handleAddMaintenanceLog}
                  onDeleteMaintenanceLog={handleDeleteMaintenanceLog}
                />
              )}

              {tab === "freights" && (
                <FreightsManager
                  freights={freights}
                  drivers={drivers}
                  vehicles={vehicles}
                  onAddFreight={handleAddFreight}
                  onUpdateFreight={handleUpdateFreight}
                  onDeleteFreight={handleDeleteFreight}
                />
              )}

              {tab === "refuels" && (
                <RefuelManager
                  refuels={refuels}
                  drivers={drivers}
                  vehicles={vehicles}
                  onAddRefuel={handleAddRefuel}
                  onDeleteRefuel={handleDeleteRefuel}
                />
              )}

              {tab === "expenses" && (
                <ExpensesManager
                  expenses={expenses}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {tab === "debts" && (
                <DebtsManager
                  debts={debts}
                  onAddDebt={handleAddDebt}
                  onUpdateDebt={handleUpdateDebt}
                  onDeleteDebt={handleDeleteDebt}
                />
              )}

              {tab === "truck_cash" && (
                <TruckCashManager
                  vehicles={vehicles}
                  drivers={drivers}
                  caixas={caixasCaminhao}
                  movimentacoes={caixaMovimentacoes}
                  currentUserRole={user.role}
                  onDefinirSaldo={handleDefinirSaldo}
                  onAddGasto={handleAddGasto}
                  onUpdateGasto={handleUpdateGasto}
                  onDeleteGasto={handleDeleteGasto}
                />
              )}

              {tab === "tracking" && <VehicleTracking />}

              {tab === "company" && <CompanyProfile />}

              {tab === "analytics" && (
                <AnalyticsBI
                  freights={freights}
                  drivers={drivers}
                  vehicles={vehicles}
                  expenses={expenses}
                  refuels={refuels}
                />
              )}

              {tab === "ai_hub" && (
                <div className="space-y-6 text-left">
                  {/* TOP BANNER / HUB SELECTOR */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-base font-black uppercase text-foreground tracking-wider flex items-center gap-2">
                        <Sparkles className="w-5.5 h-5.5 text-blue-500 animate-pulse" />
                        Central de Inteligência Artificial IA
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Acesse as ferramentas cognitivas integradas para otimizar, ler e interagir com dados do seu ERP.
                      </p>
                    </div>

                    {/* SUB-TABS SELECTOR */}
                    <div className="flex bg-muted/50 p-1 rounded-xl border border-border gap-1 flex-shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
                      {[
                        { id: "image_reader", label: "Leitura de Imagens IA", icon: Image },
                        { id: "import", label: "Importação de Planilhas", icon: FileSpreadsheet },
                        { id: "ai_assistant", label: "Assistente IA", icon: MessageSquare }
                      ].map((sub) => {
                        const SubIcon = sub.icon;
                        const isActive = aiSubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setAiSubTab(sub.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SUB-TAB CONTENTS */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={aiSubTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {aiSubTab === "image_reader" && (
                        <ImageAnalysisManager />
                      )}

                      {aiSubTab === "import" && (
                        <ImportSpreadsheet
                          onImportComplete={fetchAllData}
                        />
                      )}

                      {aiSubTab === "ai_assistant" && (
                        <div className="max-w-4xl mx-auto space-y-4">
                          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm text-left">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                              Carrier Assistente de IA Cognitivo
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                              Realize perguntas em linguagem natural sobre o desempenho da transportadora. Nosso assistente cruzará os dados de motoristas, veículos, fretes e combustíveis em tempo real para formular respostas precisas e sugestões de otimização de margens de lucro.
                            </p>
                          </div>
                          <AIQueryWidget user={user} onRefreshData={fetchAllData} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {tab === "reports" && (
                <ReportsPanel
                  freights={freights}
                  drivers={drivers}
                  vehicles={vehicles}
                  expenses={expenses}
                  refuels={refuels}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ========================================================= */}
      {/* PREMIUM RESET WARNING MODAL (Zerar Painel)               */}
      {/* ========================================================= */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scale-in">
            
            {/* Top decorative hazard stripes */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

            <div className="flex items-start gap-4 mt-2">
              <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                  Atenção!
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Você está prestes a apagar <strong className="text-red-600 dark:text-red-400">TODOS</strong> os registros do módulo de <span className="font-extrabold underline">{TAB_RESET_MAPPING[tab]?.label || tab}</span>.
                </p>
                <div className="p-3 bg-muted border border-border rounded-xl text-xs font-mono text-muted-foreground">
                  <span className="text-red-500 font-bold">⚠️ Irreversível:</span> Uma vez concluída, esta ação apagará de forma permanente esses registros no banco de dados e as estatísticas associadas.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 hover:bg-card-hover text-muted-foreground rounded-xl text-xs font-extrabold transition-all border border-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetModule}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-red-900/15 hover:shadow-red-900/30 transition-all border border-red-500"
              >
                Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PREMIUM SUCCESS TOAST NOTIFICATION                       */}
      {/* ========================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card text-foreground border border-emerald-500/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-slide-in max-w-sm">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
            <span className="text-xs text-emerald-500 font-bold">✓</span>
          </div>
          <div>
            <p className="text-xs font-bold font-sans">{toastMessage}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Painel e gráficos atualizados instantaneamente.</p>
          </div>
        </div>
      )}

      {/* Floating AI Cognitive Assistant */}
      {user && (
        <FloatingAIAssistant
          user={user}
          drivers={drivers}
          vehicles={vehicles}
          freights={freights}
          expenses={expenses}
          onNavigateTo={setTab}
          onRefreshData={fetchAllData}
        />
      )}
    </div>
  );
}
