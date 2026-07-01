import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  Folder, 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  List, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  Play, 
  FileSpreadsheet, 
  Code, 
  Info,
  Clock,
  MapPin,
  Tag,
  Eye,
  RefreshCw,
  Plus,
  X,
  Database,
  Send
} from "lucide-react";
import { 
  ImageAnalysisRecord, 
  ImageAnalysisData, 
  ExtractedValue, 
  ExtractedCategory,
  InteractiveHighlight 
} from "../types";

export default function ImageAnalysisManager() {
  // Database analyses history
  const [history, setHistory] = useState<ImageAnalysisRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<ImageAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  
  // Collapse upload area if current record is active to avoid scroll
  const [showUploadArea, setShowUploadArea] = useState(false);
  // Custom Tab management for highly-compact, scroll-free AI analysis viewing
  const [activeResultTab, setActiveResultTab] = useState<"summary" | "data" | "tables" | "uncertainties">("summary");

  useEffect(() => {
    if (!currentRecord) {
      setShowUploadArea(true);
    } else {
      setShowUploadArea(false);
    }
  }, [currentRecord]);
  
  // Highlighting state (luminous border coordinates)
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  
  // Editing state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ImageAnalysisData | null>(null);
  
  // Clean detailed information popup modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Database integration lists
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // Integration modal state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<"refuel" | "expense" | "freight" | "driver" | "vehicle">("refuel");

  // Form fields for Refuel (Abastecimento)
  const [refuelDate, setRefuelDate] = useState("");
  const [refuelGasStation, setRefuelGasStation] = useState("");
  const [refuelDriverId, setRefuelDriverId] = useState("");
  const [refuelVehicleId, setRefuelVehicleId] = useState("");
  const [refuelLiters, setRefuelLiters] = useState(0);
  const [refuelPricePerLiter, setRefuelPricePerLiter] = useState(0);
  const [refuelTotalValue, setRefuelTotalValue] = useState(0);

  // Form fields for Expense (Outras Despesas)
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<any>("Outros");
  const [expenseValue, setExpenseValue] = useState(0);
  const [expenseDescription, setExpenseDescription] = useState("");

  // Form fields for Driver (Motoristas)
  const [driverFullName, setDriverFullName] = useState("");
  const [driverCpf, setDriverCpf] = useState("");
  const [driverRg, setDriverRg] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverCnh, setDriverCnh] = useState("");
  const [driverCnhCategory, setDriverCnhCategory] = useState("D");
  const [driverCnhExpiration, setDriverCnhExpiration] = useState("");
  const [driverCity, setDriverCity] = useState("");
  const [driverState, setDriverState] = useState("");

  // Form fields for Vehicle (Veículos)
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleType, setVehicleType] = useState("Carreta");
  const [vehicleLoadCapacity, setVehicleLoadCapacity] = useState("");
  const [vehicleTankCapacity, setVehicleTankCapacity] = useState("");
  const [vehicleAverageConsumption, setVehicleAverageConsumption] = useState("");
  const [vehicleCurrentMileage, setVehicleCurrentMileage] = useState(120000);

  // Form fields for Freight (Fretes)
  const [freightDate, setFreightDate] = useState("");
  const [freightDriverId, setFreightDriverId] = useState("");
  const [freightVehicleId, setFreightVehicleId] = useState("");
  const [freightOriginCity, setFreightOriginCity] = useState("");
  const [freightOriginState, setFreightOriginState] = useState("");
  const [freightDestCity, setFreightDestCity] = useState("");
  const [freightDestState, setFreightDestState] = useState("");
  const [freightCargoType, setFreightCargoType] = useState("");
  const [freightValue, setFreightValue] = useState(0);
  const [freightStatus, setFreightStatus] = useState<"Pendente" | "Em andamento" | "Finalizado">("Pendente");
  
  // Toast notifications
  const [toast, setToast] = useState<string | null>(null);

  // Steps labels during analysis
  const STEPS = [
    { label: "🔍 Lendo arquivo e imagem...", icon: Eye },
    { label: "📄 Identificando textos e caracteres...", icon: FileText },
    { label: "💰 Encontrando valores e moedas...", icon: DollarSign },
    { label: "📊 Organizando informações contextuais...", icon: Folder },
    { label: "✅ Análise concluída com sucesso!", icon: Sparkles }
  ];

  // Helper to parse dates formatted as DD/MM/YYYY into YYYY-MM-DD
  const formatDetectedDateToIso = (dateStr: string) => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    return dateStr;
  };

  // Pre-fill database transmission form using extracted cognitive data
  const handleOpenSendModal = () => {
    if (!currentRecord) return;
    
    const results = currentRecord.result;
    
    // 1. Resolve date
    const detectedDate = results.dates && results.dates.length > 0 
      ? formatDetectedDateToIso(results.dates[0]) 
      : new Date().toISOString().split("T")[0];
    
    setRefuelDate(detectedDate);
    setExpenseDate(detectedDate);
    setFreightDate(detectedDate);
    
    // 2. Resolve value
    const sortedValues = results.values && results.values.length > 0 
      ? [...results.values].sort((a, b) => b.value - a.value)
      : [];
    const highestValueObj = sortedValues.length > 0 ? sortedValues[0] : null;
    const highestValue = highestValueObj ? highestValueObj.value : (results.summary?.totalExpenses || 0);
    
    setExpenseValue(highestValue);
    setFreightValue(highestValue);
    setRefuelTotalValue(highestValue);
    
    // 3. Resolve gas station / description / category
    let detectedGasStation = "";
    if (currentRecord.imageName.toLowerCase().includes("posto") || currentRecord.imageName.toLowerCase().includes("combustivel")) {
      detectedGasStation = currentRecord.imageName.replace(/_/g, " ").replace(/\.[^/.]+$/, "");
    }
    
    const gasStationVal = results.values?.find(v => v.label.toLowerCase().includes("posto") || v.label.toLowerCase().includes("local"));
    if (gasStationVal) {
      detectedGasStation = gasStationVal.label;
    } else if (results.texts && results.texts.length > 0) {
      const foundPosto = results.texts.find(t => t.toLowerCase().includes("posto") || t.toLowerCase().includes("ltda"));
      if (foundPosto) detectedGasStation = foundPosto;
    }
    setRefuelGasStation(detectedGasStation || "Posto Rota do Sol");
    setExpenseDescription(`Lançamento automático de: ${currentRecord.imageName}`);
    
    // Auto-detect expense category
    const textContext = (results.texts?.join(" ") || "").toLowerCase();
    if (textContext.includes("pneu") || textContext.includes("borracha")) {
      setExpenseCategory("Pneus");
    } else if (textContext.includes("oficina") || textContext.includes("manutenc") || textContext.includes("conserto")) {
      setExpenseCategory("Oficina");
    } else if (textContext.includes("pedagio") || textContext.includes("rota")) {
      setExpenseCategory("Pedágio");
    } else if (textContext.includes("aliment") || textContext.includes("refeic") || textContext.includes("restaurante")) {
      setExpenseCategory("Alimentação");
    } else if (textContext.includes("hosped") || textContext.includes("hotel") || textContext.includes("dormida")) {
      setExpenseCategory("Hospedagem");
    } else if (textContext.includes("seguro")) {
      setExpenseCategory("Seguro");
    } else {
      setExpenseCategory("Outros");
    }

    // 4. Resolve liters and price per liter
    let detectedLiters = 0;
    if (results.quantities && results.quantities.length > 0) {
      const lit = results.quantities.find(q => q.toLowerCase().includes("l") || q.toLowerCase().includes("litro"));
      if (lit) {
        detectedLiters = parseFloat(lit.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
      }
    }
    if (detectedLiters === 0) {
      const numericQuant = results.quantities?.find(q => !isNaN(parseFloat(q)) && parseFloat(q) > 20 && parseFloat(q) < 500);
      if (numericQuant) {
        detectedLiters = parseFloat(numericQuant) || 0;
      }
    }
    const finalLiters = detectedLiters || 150;
    setRefuelLiters(finalLiters);
    
    const finalPrice = highestValue ? highestValue / finalLiters : 5.93;
    setRefuelPricePerLiter(parseFloat(finalPrice.toFixed(2)));
    
    // 5. Resolve vehicle plate
    let detectedPlate = "";
    if (results.plates && results.plates.length > 0) {
      detectedPlate = results.plates[0];
    } else {
      const plateCode = results.codes?.find(c => /[A-Z]{3}-?\d{4}/i.test(c) || /[A-Z]{3}\d[A-Z]\d{2}/i.test(c));
      if (plateCode) detectedPlate = plateCode;
    }
    setVehiclePlate(detectedPlate || "MNO-9876");
    
    const normalizedPlate = (detectedPlate || "").toUpperCase().replace("-", "");
    const matchedVhc = vehicles.find(v => v.plate.toUpperCase().replace("-", "") === normalizedPlate);
    if (matchedVhc) {
      setRefuelVehicleId(matchedVhc.id);
      setFreightVehicleId(matchedVhc.id);
    } else if (vehicles.length > 0) {
      setRefuelVehicleId(vehicles[0].id);
      setFreightVehicleId(vehicles[0].id);
    } else {
      setRefuelVehicleId("");
      setFreightVehicleId("");
    }
    
    // 6. Resolve driver match
    let matchedDriver = null;
    if (results.texts && results.texts.length > 0) {
      for (const t of results.texts) {
        const found = drivers.find(d => t.toLowerCase().includes(d.fullName.toLowerCase()));
        if (found) {
          matchedDriver = found;
          break;
        }
      }
    }
    if (matchedDriver) {
      setRefuelDriverId(matchedDriver.id);
      setFreightDriverId(matchedDriver.id);
    } else if (drivers.length > 0) {
      setRefuelDriverId(drivers[0].id);
      setFreightDriverId(drivers[0].id);
    } else {
      setRefuelDriverId("");
      setFreightDriverId("");
    }
    
    // 7. Driver fields
    const cpfCode = results.documents?.find(d => /\d{3}\.\d{3}\.\d{3}-\d{2}/.test(d)) || "";
    setDriverCpf(cpfCode || "111.222.333-44");
    
    const phoneNum = results.phones && results.phones.length > 0 ? results.phones[0] : "";
    setDriverPhone(phoneNum || "(81) 99123-4567");
    
    // Determine possible name from header
    const candidateName = results.texts && results.texts.length > 0 
      ? results.texts.find(t => t.length > 8 && t.length < 35 && !t.toLowerCase().includes("posto") && !t.toLowerCase().includes("rota"))
      : "";
    setDriverFullName(candidateName || "João Silva");
    setDriverCnh("12345678901");
    setDriverCnhExpiration(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setDriverCity("Recife");
    setDriverState("PE");
    
    // 8. Vehicle fields
    setVehicleModel("FH 540");
    setVehicleBrand("Volvo");
    setVehicleYear("2022");
    setVehicleType("Carreta");
    setVehicleLoadCapacity("40.000 kg");
    setVehicleTankCapacity("800");
    setVehicleAverageConsumption("2.5");
    setVehicleCurrentMileage(124200);
    
    // 9. Freight fields
    let originCity = "Recife";
    let destCity = "São Paulo";
    if (results.addresses && results.addresses.length > 0) {
      originCity = results.addresses[0];
      if (results.addresses.length > 1) {
        destCity = results.addresses[1];
      }
    }
    setFreightOriginCity(originCity);
    setFreightOriginState("PE");
    setFreightDestCity(destCity);
    setFreightDestState("SP");
    setFreightCargoType("Carga Geral");
    setFreightStatus("Finalizado");

    // Dynamic default target logic based on key terms
    const fullTextSearch = (results.texts?.join(" ") + " " + currentRecord.imageName + " " + (highestValueObj?.label || "")).toLowerCase();
    if (fullTextSearch.includes("combustivel") || fullTextSearch.includes("abastecimento") || fullTextSearch.includes("diesel") || fullTextSearch.includes("posto") || fullTextSearch.includes("litro")) {
      setSendTarget("refuel");
    } else if (fullTextSearch.includes("motorista") || fullTextSearch.includes("cnh") || fullTextSearch.includes("cpf") || fullTextSearch.includes("condutor")) {
      setSendTarget("driver");
    } else if (fullTextSearch.includes("placa") || fullTextSearch.includes("veiculo") || fullTextSearch.includes("frota") || fullTextSearch.includes("chassi")) {
      setSendTarget("vehicle");
    } else if (fullTextSearch.includes("frete") || fullTextSearch.includes("carga") || fullTextSearch.includes("viagem") || fullTextSearch.includes("cte")) {
      setSendTarget("freight");
    } else {
      setSendTarget("expense");
    }
    
    setSendModalOpen(true);
  };

  // Submit form data to its determined REST API endpoint
  const handleConfirmSend = async () => {
    let url = "";
    let body: any = {};
    
    if (sendTarget === "refuel") {
      url = "/api/refuels";
      body = {
        date: refuelDate,
        driverId: refuelDriverId,
        vehicleId: refuelVehicleId,
        gasStation: refuelGasStation,
        liters: Number(refuelLiters),
        pricePerLiter: Number(refuelPricePerLiter),
        totalValue: Number(refuelTotalValue),
        receipt: currentRecord?.imageData || ""
      };
    } else if (sendTarget === "expense") {
      url = "/api/expenses";
      body = {
        date: expenseDate,
        category: expenseCategory,
        value: Number(expenseValue),
        description: expenseDescription,
        receipt: currentRecord?.imageData || ""
      };
    } else if (sendTarget === "driver") {
      url = "/api/drivers";
      body = {
        fullName: driverFullName,
        cpf: driverCpf,
        rg: driverRg || "12.345.678-9",
        phone: driverPhone,
        whatsapp: driverPhone,
        address: "Mapeado via Leitura IA",
        city: driverCity || "Recife",
        state: driverState || "PE",
        cnh: driverCnh || "12345678901",
        cnhCategory: driverCnhCategory,
        cnhExpiration: driverCnhExpiration || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        admissionDate: new Date().toISOString().split("T")[0],
        observations: "Motorista mapeado automaticamente via inteligência artificial cognitiva."
      };
    } else if (sendTarget === "vehicle") {
      url = "/api/vehicles";
      body = {
        plate: vehiclePlate.toUpperCase(),
        model: vehicleModel,
        brand: vehicleBrand,
        year: vehicleYear || "2022",
        type: vehicleType,
        loadCapacity: vehicleLoadCapacity || "40.000 kg",
        tankCapacity: vehicleTankCapacity || "800",
        averageConsumption: vehicleAverageConsumption || "2.5",
        renavam: "12345678901",
        chassi: "9BR12345678901234",
        licensingExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        currentMileage: Number(vehicleCurrentMileage) || 124200,
        nextMaintenance: (Number(vehicleCurrentMileage) || 124200) + 10000
      };
    } else if (sendTarget === "freight") {
      url = "/api/freights";
      body = {
        date: freightDate,
        departureTime: "08:00",
        arrivalTime: "18:00",
        status: freightStatus,
        driverId: freightDriverId,
        vehicleId: freightVehicleId,
        origin: {
          city: freightOriginCity,
          state: freightOriginState,
          address: "Mapeado via IA",
          company: "Origem IA"
        },
        destination: {
          city: freightDestCity,
          state: freightDestState,
          address: "Mapeado via IA",
          company: "Destino IA"
        },
        cargo: {
          type: freightCargoType,
          description: "Carga lida via IA cognitiva",
          qty: 1,
          unit: "Toneladas"
        },
        financial: {
          value: Number(freightValue),
          commission: Number(freightValue) * 0.12,
          toll: 150,
          food: 100,
          lodging: 0,
          otherExpenses: 0,
          advance: 0,
          balance: Number(freightValue),
          balanceStatus: "Pendente"
        },
        mileage: {
          start: 0,
          end: 0,
          total: 0
        }
      };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        setSendModalOpen(false);
        const nameMap: Record<string, string> = {
          refuel: "Abastecimento ⛽",
          expense: "Outra Despesa 💸",
          driver: "Motorista 👤",
          vehicle: "Veículo 🚚",
          freight: "Frete / Viagem 🛣️"
        };
        showToast(`🚀 Sucesso! ${nameMap[sendTarget]} integrado com sucesso!`);
        
        // Refresh local memory lists
        fetchDriversAndVehicles();
      } else {
        alert(data.message || "Erro ao registrar as informações no banco.");
      }
    } catch (e) {
      console.error(e);
      alert("Falha na transmissão das informações para o ERP.");
    }
  };

  // Load history from API on mount
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/image-analyses");
      const data = await res.json();
      if (data.success) {
        setHistory(data.analyses);
        if (data.analyses.length > 0 && !currentRecord) {
          setCurrentRecord(data.analyses[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    }
  };

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch("/api/drivers"),
        fetch("/api/vehicles")
      ]);
      const driversData = await driversRes.json();
      const vehiclesData = await vehiclesRes.json();
      setDrivers(driversData || []);
      setVehicles(vehiclesData || []);
    } catch (e) {
      console.error("Erro ao buscar motoristas/veículos:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchDriversAndVehicles();
  }, []);


  // Listen to paste events (CTRL+V)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            triggerAnalysis(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, []);

  // Show dynamic toast
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Convert image file to Base64 and trigger server-side analysis
  const triggerAnalysis = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, envie apenas arquivos de imagem (PNG, JPG, JPEG, WEBP).");
      return;
    }

    setLoading(true);
    setAnalyzingStep(0);
    
    // Simulate progression for visual feedback
    const interval = setInterval(() => {
      setAnalyzingStep((prev) => {
        if (prev < STEPS.length - 2) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    try {
      const base64 = await toBase64(file);
      
      const response = await fetch("/api/image-analyses/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          imageName: file.name,
          mimeType: file.type
        })
      });

      const data = await response.json();
      
      clearInterval(interval);
      setAnalyzingStep(4); // Finished step

      if (data.success) {
        setTimeout(() => {
          setCurrentRecord(data.record);
          setHistory((prev) => [data.record, ...prev]);
          setLoading(false);
          setDetailModalOpen(true);
          showToast("✨ Imagem lida e interpretada com sucesso!");
        }, 800);
      } else {
        setLoading(false);
        alert(data.message || "Erro ao analisar imagem.");
      }
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      console.error(err);
      alert("Falha ao comunicar com o servidor de Inteligência Artificial.");
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      triggerAnalysis(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerAnalysis(e.target.files[0]);
    }
  };

  // Delete analysis from history
  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente excluir este registro de análise da memória?")) return;

    try {
      const res = await fetch(`/api/image-analyses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => prev.filter((r) => r.id !== id));
        if (currentRecord?.id === id) {
          const remaining = history.filter((r) => r.id !== id);
          setCurrentRecord(remaining.length > 0 ? remaining[0] : null);
        }
        showToast("✓ Registro excluído do histórico.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger demo analysis using mock visual categories
  const triggerDemo = (type: "combustivel" | "despesa" | "indicadores") => {
    const mockFiles: Record<string, { name: string; type: string; base64: string }> = {
      combustivel: {
        name: "comprovante_abastecimento_diesel.png",
        type: "image/png",
        base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%231e293b'/><text x='20' y='50' fill='%23e2e8f0' font-family='monospace' font-size='16' font-weight='bold'>POSTO ROTA DO SOL LTDA</text><text x='20' y='80' fill='%2394a3b8' font-family='monospace' font-size='12'>CNPJ: 12.345.678/0001-99</text><line x1='20' y1='100' x2='380' y2='100' stroke='%23334155' stroke-width='2'/><text x='20' y='140' fill='%23f1f5f9' font-family='monospace' font-size='14'>SABADO 14:32 - BOLETO RECARGA</text><rect x='20' y='180' width='360' height='60' fill='%23eab308' fill-opacity='0.2' rx='4'/><text x='30' y='215' fill='%23facc15' font-family='monospace' font-size='16' font-weight='bold'>DIESEL S10 - 150 L</text><text x='20' y='280' fill='%2394a3b8' font-family='monospace' font-size='14'>PRECO LITRO: R$ 5,93</text><line x1='20' y1='320' x2='380' y2='320' stroke='%23334155' stroke-width='2'/><text x='20' y='380' fill='%23f1f5f9' font-family='monospace' font-size='20' font-weight='bold'>VALOR TOTAL: R$ 890,00</text><text x='20' y='440' fill='%23475569' font-family='monospace' font-size='10'>TX-99812-B - PLACA: MNO-9876</text></svg>"
      },
      despesa: {
        name: "relatorio_despesas_semanal.png",
        type: "image/png",
        base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%230f172a'/><text x='20' y='50' fill='%233b82f6' font-family='monospace' font-size='16' font-weight='bold'>DODISA LOGISTICA S/A</text><text x='20' y='80' fill='%2394a3b8' font-family='monospace' font-size='12'>RELATORIO SEMANAL DE DESPESAS</text><line x1='20' y1='100' x2='380' y2='100' stroke='%231e293b' stroke-width='2'/><text x='20' y='140' fill='%23f8fafc' font-family='monospace' font-size='13'>1. PNEUS REFORCO: R$ 2.350,00</text><text x='20' y='180' fill='%23f8fafc' font-family='monospace' font-size='13'>2. PEDAGIO ROTA AZUL: R$ 120,00</text><text x='20' y='220' fill='%23f8fafc' font-family='monospace' font-size='13'>3. REFEICOES MOTORISTAS: R$ 340,00</text><line x1='20' y1='260' x2='380' y2='260' stroke='%231e293b' stroke-width='2'/><rect x='20' y='290' width='360' height='50' fill='%23ef4444' fill-opacity='0.15' rx='4'/><text x='30' y='320' fill='%23f87171' font-family='monospace' font-size='15' font-weight='bold'>TOTAL DESPESAS: R$ 2.810,00</text><text x='20' y='410' fill='%23eab308' font-family='monospace' font-size='11' font-weight='bold'>AVISO: CUSTO DE PNEUS ACIMA DA MEDIA</text></svg>"
      },
      indicadores: {
        name: "grafico_trimestral_kpis.png",
        type: "image/png",
        base64: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%2318181b'/><text x='20' y='40' fill='%2310b981' font-family='sans-serif' font-size='14' font-weight='bold'>INDICADORES FINANCEIROS Q2 2026</text><text x='20' y='65' fill='%2371717a' font-family='sans-serif' font-size='11'>LUCRO ESTIMADO DA TRANSPORTADORA</text><line x1='20' y1='85' x2='380' y2='85' stroke='%2327272a' stroke-width='1'/><rect x='60' y='250' width='60' height='150' fill='%2310b981' fill-opacity='0.7'/><text x='75' y='240' fill='%23a1a1aa' font-family='sans-serif' font-size='10'>ABRIL</text><text x='70' y='390' fill='%23fff' font-family='sans-serif' font-weight='bold' font-size='10'>45K</text><rect x='170' y='150' width='60' height='250' fill='%2310b981' fill-opacity='0.9'/><text x='185' y='140' fill='%23a1a1aa' font-family='sans-serif' font-size='10'>MAIO</text><text x='180' y='390' fill='%23fff' font-family='sans-serif' font-weight='bold' font-size='10'>60K</text><rect x='280' y='200' width='60' height='200' fill='%233b82f6' fill-opacity='0.8'/><text x='295' y='190' fill='%23a1a1aa' font-family='sans-serif' font-size='10'>JUNHO</text><text x='290' y='390' fill='%23fff' font-family='sans-serif' font-weight='bold' font-size='10'>52K</text><line x1='40' y1='400' x2='360' y2='400' stroke='%233f3f46' stroke-width='2'/><text x='20' y='450' fill='%2310b981' font-family='sans-serif' font-size='12' font-weight='bold'>CRESCIMENTO TRIMESTRAL: +15%</text></svg>"
      }
    };

    const mock = mockFiles[type];
    
    // Convert simulated data to file-like behavior
    setLoading(true);
    setAnalyzingStep(0);
    
    const interval = setInterval(() => {
      setAnalyzingStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 600);

    // Call analyze endpoint with mocked image data (svg base64) to record correctly
    setTimeout(async () => {
      try {
        const response = await fetch("/api/image-analyses/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: mock.base64,
            imageName: mock.name,
            mimeType: mock.type
          })
        });
        const data = await response.json();
        clearInterval(interval);
        if (data.success) {
          setCurrentRecord(data.record);
          setHistory((prev) => [data.record, ...prev]);
          setLoading(false);
          setDetailModalOpen(true);
          showToast(`⚡ Demonstração de "${mock.name}" processada!`);
        } else {
          setLoading(false);
          alert("Erro na simulação do demonstrativo.");
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
        console.error(err);
      }
    }, 3000);
  };

  // Open Edit Modal with cloned current state
  const handleOpenEdit = () => {
    if (!currentRecord) return;
    setEditingResult(JSON.parse(JSON.stringify(currentRecord.result)));
    setEditModalOpen(true);
  };

  // Save changes on edited record
  const handleSaveEdit = async () => {
    if (!currentRecord || !editingResult) return;

    try {
      const response = await fetch(`/api/image-analyses/${currentRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: editingResult
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentRecord(data.analysis);
        setHistory((prev) => prev.map((r) => r.id === currentRecord.id ? data.analysis : r));
        setEditModalOpen(false);
        showToast("✓ Alterações gravadas e salvas com sucesso!");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gravar modificações.");
    }
  };

  // Export methods
  const handleExportJSON = () => {
    if (!currentRecord) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentRecord.result, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `leitura_ia_${currentRecord.id}.json`);
    dlAnchorElem.click();
    showToast("✓ Exportado para JSON!");
  };

  const handleExportCSV = () => {
    if (!currentRecord) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Export extracted values
    csvContent += "Valores Extraídos\n";
    csvContent += "Descrição;Valor;Original;Tipo\n";
    currentRecord.result.values.forEach(v => {
      csvContent += `${v.label};${v.value};${v.original};${v.type}\n`;
    });
    
    // Export categories list
    csvContent += "\nCategorias Identificadas\n";
    csvContent += "Nome;Valor Acumulado;Tipo;Descrição\n";
    currentRecord.result.categories.forEach(c => {
      csvContent += `${c.name};${c.value};${c.type};${c.description}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", encodedUri);
    dlAnchorElem.setAttribute("download", `leitura_ia_${currentRecord.id}.csv`);
    dlAnchorElem.click();
    showToast("✓ Exportado para CSV!");
  };

  const handleExportExcel = () => {
    if (!currentRecord) return;
    
    // We can compile a beautiful HTML table structures for Excel
    let html = `
      <meta charset="utf-8">
      <h3>DODISA LOGÍSTICA - Leitura de Imagens IA (${currentRecord.imageName})</h3>
      <table border="1">
        <tr style="background:#2563eb;color:#fff;">
          <th colspan="4">Valores Extraídos</th>
        </tr>
        <tr style="background:#f1f5f9;">
          <th>Descrição</th>
          <th>Valor</th>
          <th>Original</th>
          <th>Tipo</th>
        </tr>
        ${currentRecord.result.values.map(v => `
          <tr>
            <td>${v.label}</td>
            <td>${v.value}</td>
            <td>${v.original}</td>
            <td>${v.type}</td>
          </tr>
        `).join('')}
      </table>
      <br/>
      <table border="1">
        <tr style="background:#10b981;color:#fff;">
          <th colspan="4">Categorias Mapeadas</th>
        </tr>
        <tr style="background:#f1f5f9;">
          <th>Categoria</th>
          <th>Total</th>
          <th>Tipo</th>
          <th>Descrição</th>
        </tr>
        ${currentRecord.result.categories.map(c => `
          <tr>
            <td>${c.name}</td>
            <td>${c.value}</td>
            <td>${c.type}</td>
            <td>${c.description}</td>
          </tr>
        `).join('')}
      </table>
    `;

    const dataStr = "data:application/vnd.ms-excel;charset=utf-8," + encodeURIComponent(html);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `leitura_ia_${currentRecord.id}.xls`);
    dlAnchorElem.click();
    showToast("✓ Exportado para Excel!");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Helper inside editing modal to modify value elements
  const handleEditValueField = (index: number, key: keyof ExtractedValue, val: any) => {
    if (!editingResult) return;
    const updatedValues = [...editingResult.values];
    updatedValues[index] = { ...updatedValues[index], [key]: val };
    setEditingResult({ ...editingResult, values: updatedValues });
  };

  const handleEditCategoryField = (index: number, key: keyof ExtractedCategory, val: any) => {
    if (!editingResult) return;
    const updatedCategories = [...editingResult.categories];
    updatedCategories[index] = { ...updatedCategories[index], [key]: val };
    setEditingResult({ ...editingResult, categories: updatedCategories });
  };

  const handleEditDateField = (index: number, val: string) => {
    if (!editingResult) return;
    const updatedDates = [...editingResult.dates];
    updatedDates[index] = val;
    setEditingResult({ ...editingResult, dates: updatedDates });
  };

  const handleAddEditValue = () => {
    if (!editingResult) return;
    const updatedValues = [...editingResult.values, { label: "Novo Lançamento", value: 0, original: "R$ 0,00", type: "despesa" as const }];
    setEditingResult({ ...editingResult, values: updatedValues });
  };

  const handleRemoveEditValue = (index: number) => {
    if (!editingResult) return;
    const updatedValues = editingResult.values.filter((_, i) => i !== index);
    setEditingResult({ ...editingResult, values: updatedValues });
  };

  return (
    <div id="image-analyzer-panel" className="space-y-6">
      
      {/* 1. TOP HEADER WITH DECORATIONS */}
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 text-left">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold font-mono tracking-wider uppercase rounded-full">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Módulo Cognitivo Multimodal
            </span>
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Leitura Inteligente de Imagens IA
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Faça upload de fotos, prints, notas fiscais, relatórios ou gráficos. Nossa IA fará uma leitura contextual profunda (indo muito além do simples OCR), interpretando valores, tabelas, colorações de relevância e gerando insights operacionais estruturados.
            </p>
          </div>

          {/* Quick Demo buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-muted-foreground w-full md:w-auto md:mr-1">Testar arquivos demo:</span>
            <button 
              onClick={() => triggerDemo("combustivel")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-foreground rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-yellow-500" />
              Recibo Combustível
            </button>
            <button 
              onClick={() => triggerDemo("despesa")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-foreground rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-red-500" />
              Planilha de Lançamentos
            </button>
            <button 
              onClick={() => triggerDemo("indicadores")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-foreground rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Gráfico de Lucro
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE INTERACTION SECTION: SIDE-BY-SIDE PLATFORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2.1 LEFT COLUMN: UPLOAD AREA & VISUAL IMAGE VIEWER (4/12 width) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* COLLAPSIBLE UPLOAD ZONE FOR SPACE SAVING */}
          {currentRecord && (
            <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-3.5 shadow-sm text-left">
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold uppercase text-foreground tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-500" />
                  Importar Novo Documento
                </span>
                <p className="text-[9px] text-muted-foreground">Para nova leitura heurística de IA cognitiva.</p>
              </div>
              <button
                onClick={() => setShowUploadArea(!showUploadArea)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                  showUploadArea 
                    ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" 
                    : "bg-blue-600/10 border-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600/15"
                }`}
              >
                {showUploadArea ? "✕ Ocultar Área" : "＋ Carregar Novo"}
              </button>
            </div>
          )}

          {(!currentRecord || showUploadArea) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative overflow-hidden group ${
                  dragActive 
                    ? "border-blue-500 bg-blue-500/5 shadow-inner" 
                    : "border-border hover:border-muted-foreground/40 bg-card hover:bg-card-hover"
                }`}
              >
                <input 
                  id="img-upload-input"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileInputChange}
                />
                
                <div className="space-y-4 relative z-10 flex flex-col items-center justify-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl transition-transform group-hover:scale-110">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-foreground">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Suporta PNG, JPG, JPEG, WEBP.
                    </p>
                    <p className="text-[10px] text-blue-500 font-mono font-bold mt-1.5 bg-blue-500/5 py-1 px-2.5 rounded-lg border border-blue-500/10">
                      💡 Atalho: Você pode colar um print aqui com Ctrl + V!
                    </p>
                  </div>
                  
                  <label 
                    htmlFor="img-upload-input"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    Selecionar Arquivo
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* HISTORIC LOG LIST PANELS */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3.5 shadow-sm text-left">
            <h2 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 text-foreground">
              <Clock className="w-4.5 h-4.5 text-indigo-500" />
              Histórico de Leituras Realizadas
            </h2>
            
            {history.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-border rounded-xl">
                <p className="text-[11px] text-muted-foreground">Nenhuma leitura encontrada na memória.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {history.map((record) => {
                  const isSelected = currentRecord?.id === record.id;
                  const dateFormatted = new Date(record.date).toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                  });

                  return (
                    <div
                      key={record.id}
                      onClick={() => {
                        setCurrentRecord(record);
                        setDetailModalOpen(true);
                      }}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected 
                          ? "bg-blue-500/10 border-blue-500/30 shadow-sm" 
                          : "bg-muted/40 border-border hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          isSelected ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-card border-border text-muted-foreground"
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate text-left">
                          <p className={`text-[10px] font-extrabold truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>
                            {record.imageName}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                            {dateFormatted} • {record.infoCount} dados encontrados
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteRecord(record.id, e)}
                        className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                        title="Remover do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 2.2 RIGHT COLUMN: ANIMATED LOADER OR DETAILED EXTRACTION RESULTS (7/12 width) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ANALYSIS LOADING STEPPER */}
          {loading && (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-md text-center space-y-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500/10">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500" 
                  style={{ width: `${((analyzingStep + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <div className="relative p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                  Processamento Cognitivo Multimodal Ativo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nossa IA de leitura de imagens está processando os dados na nuvem da DODISA LOGÍSTICA.
                </p>
              </div>

              {/* Progress Steps List */}
              <div className="w-full max-w-sm space-y-3 pt-4 border-t border-border">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = analyzingStep === idx;
                  const isCompleted = analyzingStep > idx;

                  return (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 text-left p-2 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 scale-102 font-extrabold" 
                          : isCompleted 
                            ? "text-emerald-500 opacity-80" 
                            : "text-muted-foreground opacity-40"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0 ${
                        isActive 
                          ? "bg-blue-500/10 border-blue-500/20" 
                          : isCompleted 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                            : "bg-muted border-border"
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wide">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ANALYSIS COMPLETED RESULTS ON MAIN PAGE: COMPACT DOCUMENT SUMMARY CARD */}
          {!loading && currentRecord && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm text-left space-y-6 relative overflow-hidden animate-scale-in">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                    ✓ IA Processada
                  </span>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider truncate max-w-[280px]" title={currentRecord.imageName}>
                    {currentRecord.imageName}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Lido em: {new Date(currentRecord.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteRecord(currentRecord.id, e)}
                    className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/20"
                    title="Excluir Registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD PREVIEW THUMBNAIL AND DATA METRICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Visual Thumbnail */}
                <div className="relative border border-border bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center max-h-[160px] group">
                  <img 
                    referrerPolicy="no-referrer"
                    src={currentRecord.imageData} 
                    alt={currentRecord.imageName}
                    className="max-h-full object-contain w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent transition-all flex items-center justify-center">
                    <span className="px-3 py-1 bg-slate-900/85 text-white border border-slate-700/80 rounded-lg text-[9px] font-bold font-mono tracking-wide uppercase shadow-lg select-none">
                      Visualizar Imagem
                    </span>
                  </div>
                </div>

                {/* Cognitive Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold">Valores Extraídos</span>
                    <p className="text-lg font-extrabold text-foreground font-mono">
                      {currentRecord.result.values?.length || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold">Categorias IA</span>
                    <p className="text-lg font-extrabold text-blue-500 font-mono">
                      {currentRecord.result.categories?.length || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold">Datas Encontradas</span>
                    <p className="text-lg font-extrabold text-indigo-500 font-mono">
                      {currentRecord.result.dates?.length || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold">Alertas Críticos</span>
                    <p className={`text-lg font-extrabold font-mono ${currentRecord.result.summary?.alerts?.length ? "text-amber-500" : "text-muted-foreground"}`}>
                      {currentRecord.result.summary?.alerts?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* CORE LAUNCH ACTION BUTTON */}
              <button
                onClick={() => setDetailModalOpen(true)}
                className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-blue-900/10 hover:-translate-y-0.5 hover:shadow-blue-900/20 active:translate-y-0"
              >
                <Eye className="w-5 h-5 animate-pulse" />
                Acessar Informações da Leitura 🔍
              </button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !currentRecord && (
            <div className="bg-card border border-border rounded-2xl p-12 shadow-sm text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 bg-muted text-muted-foreground rounded-full">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
                  Nenhum Documento Carregado
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Por favor, selecione uma imagem de demonstração no cabeçalho ou faça o upload de um arquivo para que a IA da DODISA LOGÍSTICA possa interpretá-lo de forma inteligente.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. MODAL DE CORREÇÃO DE DADOS (PUT BRIDGE) */}
      {editModalOpen && editingResult && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-2xl p-6 relative overflow-hidden animate-scale-in text-left my-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-black uppercase text-foreground tracking-wide flex items-center gap-1.5">
                <Edit3 className="w-5 h-5 text-blue-500" />
                Corrigir Lançamentos e Categorias Extraídas
              </h3>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
              
              {/* EDIT MONETARY VALUES SECTION */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-foreground tracking-wider font-mono">1. Valores Monetários Encontrados:</span>
                  <button
                    onClick={handleAddEditValue}
                    className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Campo
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editingResult.values.map((v, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-xl flex flex-wrap md:flex-nowrap items-center gap-2 text-xs">
                      <div className="flex-1 min-w-[150px]">
                        <span className="text-[8px] uppercase font-mono text-muted-foreground block mb-1">Descrição do Campo:</span>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => handleEditValueField(idx, "label", e.target.value)}
                          className="w-full bg-card border border-border rounded px-2 py-1 font-sans font-semibold text-foreground text-xs"
                        />
                      </div>

                      <div className="w-28 flex-shrink-0">
                        <span className="text-[8px] uppercase font-mono text-muted-foreground block mb-1">Valor Numérico:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.value}
                          onChange={(e) => handleEditValueField(idx, "value", parseFloat(e.target.value) || 0)}
                          className="w-full bg-card border border-border rounded px-2 py-1 font-mono text-foreground text-xs"
                        />
                      </div>

                      <div className="w-32 flex-shrink-0">
                        <span className="text-[8px] uppercase font-mono text-muted-foreground block mb-1">Tipo de Lançamento:</span>
                        <select
                          value={v.type}
                          onChange={(e) => handleEditValueField(idx, "type", e.target.value)}
                          className="w-full bg-card border border-border rounded px-2 py-1 font-mono text-foreground text-xs"
                        >
                          <option value="despesa">Despesa 🔴</option>
                          <option value="receita">Receita 🟢</option>
                          <option value="neutro">Neutro ⚪</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleRemoveEditValue(idx)}
                        className="p-1 hover:bg-red-500/10 text-red-500 rounded mt-4.5 cursor-pointer flex-shrink-0"
                        title="Remover valor"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDIT CATEGORIES MAP */}
              <div className="space-y-3.5 border-t border-border pt-4">
                <span className="text-xs font-black uppercase text-foreground tracking-wider font-mono block">2. Mapeamento de Categorias Operacionais:</span>
                <div className="space-y-2.5">
                  {editingResult.categories.map((c, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[8px] uppercase font-mono text-muted-foreground block mb-1">Nome da Categoria:</span>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleEditCategoryField(idx, "name", e.target.value)}
                            className="w-full bg-card border border-border rounded px-2 py-1 font-sans font-semibold text-foreground text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-mono text-muted-foreground block mb-1">Total Acumulado (R$):</span>
                          <input
                            type="number"
                            step="0.01"
                            value={c.value}
                            onChange={(e) => handleEditCategoryField(idx, "value", parseFloat(e.target.value) || 0)}
                            className="w-full bg-card border border-border rounded px-2 py-1 font-mono text-foreground text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-mono text-muted-foreground block mb-1">Explicação / Detalhe Contextual:</span>
                        <input
                          type="text"
                          value={c.description}
                          onChange={(e) => handleEditCategoryField(idx, "description", e.target.value)}
                          className="w-full bg-card border border-border rounded px-2 py-1 font-sans text-muted-foreground text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDIT DATES LIST */}
              <div className="space-y-3.5 border-t border-border pt-4">
                <span className="text-xs font-black uppercase text-foreground tracking-wider font-mono block">3. Datas Identificadas:</span>
                <div className="flex flex-wrap gap-2">
                  {editingResult.dates.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-muted/40 border border-border rounded px-2 py-1">
                      <input
                        type="text"
                        value={d}
                        onChange={(e) => handleEditDateField(idx, e.target.value)}
                        className="bg-card border border-border rounded px-1.5 py-0.5 font-mono text-xs w-28 text-foreground"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 hover:bg-muted text-muted-foreground border border-border rounded-xl text-xs font-extrabold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-900/10 transition-all cursor-pointer"
              >
                Confirmar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE INTEGRAÇÃO / ENVIO PARA DESTINO */}
      {sendModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full shadow-2xl p-6 relative overflow-hidden animate-scale-in text-left my-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />

            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase text-foreground tracking-wide flex items-center gap-1.5">
                  <Database className="w-5 h-5 text-emerald-500" />
                  Enviar Informações Extraídas por IA para o ERP
                </h3>
                <p className="text-[10px] text-muted-foreground font-sans">
                  Revise e confirme os dados antes de salvá-los nos respectivos módulos do sistema.
                </p>
              </div>
              <button 
                onClick={() => setSendModalOpen(false)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
              {/* TARGET SELECTOR BAR */}
              <div className="md:col-span-1 space-y-1 border-r border-border pr-2">
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block mb-2 font-mono">
                  Destino da Informação:
                </span>
                {[
                  { id: "refuel", label: "Abastecimento", desc: "Registrar consumo de combustível", icon: "⛽" },
                  { id: "expense", label: "Despesa Geral", desc: "Outros gastos de viagem", icon: "💸" },
                  { id: "freight", label: "Frete / Viagem", desc: "Novo contrato de carga", icon: "🛣️" },
                  { id: "driver", label: "Novo Motorista", desc: "Adicionar CNH/Perfil", icon: "👤" },
                  { id: "vehicle", label: "Novo Veículo", desc: "Cadastrar nova frota", icon: "🚚" }
                ].map((target) => (
                  <button
                    key={target.id}
                    onClick={() => setSendTarget(target.id as any)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs cursor-pointer flex flex-col gap-0.5 ${
                      sendTarget === target.id
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-extrabold"
                        : "bg-muted/20 border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span>{target.icon}</span>
                      <span>{target.label}</span>
                    </span>
                    <span className="text-[9px] font-normal leading-tight text-muted-foreground block">{target.desc}</span>
                  </button>
                ))}
              </div>

              {/* DYNAMIC FORM INNER CONTAINER */}
              <div className="md:col-span-3 space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                
                {/* 1. REFUEL FORM */}
                {sendTarget === "refuel" && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono pb-1 border-b border-border/60">
                      ⛽ Preencher Detalhes do Abastecimento
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Data:</label>
                        <input
                          type="date"
                          value={refuelDate}
                          onChange={(e) => setRefuelDate(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Estabelecimento / Posto:</label>
                        <input
                          type="text"
                          value={refuelGasStation}
                          onChange={(e) => setRefuelGasStation(e.target.value)}
                          placeholder="Ex: Posto Ipiranga Ltda"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Veículo (Placa):</label>
                        {vehicles.length > 0 ? (
                          <select
                            value={refuelVehicleId}
                            onChange={(e) => setRefuelVehicleId(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Selecione um veículo...</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={refuelVehicleId}
                            onChange={(e) => setRefuelVehicleId(e.target.value)}
                            placeholder="Cadastre veículos primeiro ou digite ID"
                            className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Motorista Autorizado:</label>
                        {drivers.length > 0 ? (
                          <select
                            value={refuelDriverId}
                            onChange={(e) => setRefuelDriverId(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Selecione um motorista...</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.fullName} (CPF: {d.cpf})</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={refuelDriverId}
                            onChange={(e) => setRefuelDriverId(e.target.value)}
                            placeholder="Cadastre motoristas primeiro ou digite ID"
                            className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Litros:</label>
                        <input
                          type="number"
                          step="0.01"
                          value={refuelLiters}
                          onChange={(e) => {
                            const l = parseFloat(e.target.value) || 0;
                            setRefuelLiters(l);
                            if (refuelPricePerLiter > 0) setRefuelTotalValue(parseFloat((l * refuelPricePerLiter).toFixed(2)));
                          }}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Preço / Litro (R$):</label>
                        <input
                          type="number"
                          step="0.001"
                          value={refuelPricePerLiter}
                          onChange={(e) => {
                            const p = parseFloat(e.target.value) || 0;
                            setRefuelPricePerLiter(p);
                            if (refuelLiters > 0) setRefuelTotalValue(parseFloat((refuelLiters * p).toFixed(2)));
                          }}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-emerald-500 block mb-1 font-extrabold">Valor Total (R$):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={refuelTotalValue}
                          onChange={(e) => setRefuelTotalValue(parseFloat(e.target.value) || 0)}
                          className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. EXPENSE FORM */}
                {sendTarget === "expense" && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono pb-1 border-b border-border/60">
                      💸 Lançar Despesa Operacional de Viagem
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Data da Despesa:</label>
                        <input
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Categoria:</label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value as any)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Combustível">⛽ Combustível</option>
                          <option value="Alimentação">🍽️ Alimentação</option>
                          <option value="Hospedagem">🏨 Hospedagem</option>
                          <option value="Pedágio">🛣️ Pedágio</option>
                          <option value="Oficina">🔧 Oficina</option>
                          <option value="Pneus">🛞 Pneus</option>
                          <option value="Seguro">🛡️ Seguro</option>
                          <option value="Outros">📦 Outros / Geral</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-red-500 block mb-1 font-extrabold">Valor Pago (R$):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expenseValue}
                          onChange={(e) => setExpenseValue(parseFloat(e.target.value) || 0)}
                          className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2 text-xs font-black text-red-600 dark:text-red-400 font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Descrição Contextual:</label>
                        <input
                          type="text"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          placeholder="Ex: Almoço na parada da rodovia BR-101"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. FREIGHT FORM */}
                {sendTarget === "freight" && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono pb-1 border-b border-border/60">
                      🛣️ Lançar Contrato de Frete / Manifesto de Viagem
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Data de Emissão:</label>
                        <input
                          type="date"
                          value={freightDate}
                          onChange={(e) => setFreightDate(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-2 py-1.5 text-xs text-foreground font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Motorista Escalado:</label>
                        <select
                          value={freightDriverId}
                          onChange={(e) => setFreightDriverId(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-2 py-1.5 text-xs text-foreground font-semibold"
                        >
                          <option value="">Selecione...</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.fullName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Veículo Escalado:</label>
                        <select
                          value={freightVehicleId}
                          onChange={(e) => setFreightVehicleId(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-2 py-1.5 text-xs text-foreground font-semibold"
                        >
                          <option value="">Selecione...</option>
                          {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-2">
                        <span className="text-[8px] uppercase tracking-wider font-bold block text-muted-foreground font-mono">PONTO DE ORIGEM</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Cidade"
                              value={freightOriginCity}
                              onChange={(e) => setFreightOriginCity(e.target.value)}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground font-semibold"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="UF"
                              value={freightOriginState}
                              onChange={(e) => setFreightOriginState(e.target.value)}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground font-semibold font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/20 border border-border rounded-xl space-y-2">
                        <span className="text-[8px] uppercase tracking-wider font-bold block text-muted-foreground font-mono">PONTO DE DESTINO</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Cidade"
                              value={freightDestCity}
                              onChange={(e) => setFreightDestCity(e.target.value)}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground font-semibold"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="UF"
                              value={freightDestState}
                              onChange={(e) => setFreightDestState(e.target.value)}
                              className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground font-semibold font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Tipo de Carga:</label>
                        <input
                          type="text"
                          value={freightCargoType}
                          onChange={(e) => setFreightCargoType(e.target.value)}
                          placeholder="Ex: Grãos, Soja, Peças"
                          className="w-full bg-muted/30 border border-border rounded-xl px-2 py-1.5 text-xs text-foreground font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-emerald-500 block mb-1 font-extrabold">Valor Bruto do Frete (R$):</label>
                        <input
                          type="number"
                          value={freightValue}
                          onChange={(e) => setFreightValue(parseFloat(e.target.value) || 0)}
                          className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-2 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Status de Viagem:</label>
                        <select
                          value={freightStatus}
                          onChange={(e) => setFreightStatus(e.target.value as any)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-2 py-1.5 text-xs text-foreground font-semibold"
                        >
                          <option value="Pendente">⏳ Pendente</option>
                          <option value="Em andamento">🛣️ Em andamento</option>
                          <option value="Finalizado">✅ Finalizado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DRIVER FORM */}
                {sendTarget === "driver" && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono pb-1 border-b border-border/60">
                      👤 Cadastrar Novo Motorista
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Nome Completo:</label>
                        <input
                          type="text"
                          value={driverFullName}
                          onChange={(e) => setDriverFullName(e.target.value)}
                          placeholder="Nome do motorista"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">CPF:</label>
                        <input
                          type="text"
                          value={driverCpf}
                          onChange={(e) => setDriverCpf(e.target.value)}
                          placeholder="Ex: 111.222.333-44"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Número do CNH:</label>
                        <input
                          type="text"
                          value={driverCnh}
                          onChange={(e) => setDriverCnh(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Categoria:</label>
                        <select
                          value={driverCnhCategory}
                          onChange={(e) => setDriverCnhCategory(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        >
                          <option value="A">A (Moto)</option>
                          <option value="B">B (Carro)</option>
                          <option value="C">C (Caminhão)</option>
                          <option value="D">D (Ônibus)</option>
                          <option value="E">E (Carreta pesada)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Vencimento CNH:</label>
                        <input
                          type="date"
                          value={driverCnhExpiration}
                          onChange={(e) => setDriverCnhExpiration(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Telefone / Whats:</label>
                        <input
                          type="text"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder="(81) 99123-4567"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Cidade Base:</label>
                        <input
                          type="text"
                          value={driverCity}
                          onChange={(e) => setDriverCity(e.target.value)}
                          placeholder="Cidade"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Estado Base (UF):</label>
                        <input
                          type="text"
                          value={driverState}
                          onChange={(e) => setDriverState(e.target.value)}
                          placeholder="Ex: PE"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. VEHICLE FORM */}
                {sendTarget === "vehicle" && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider font-mono pb-1 border-b border-border/60">
                      🚚 Cadastrar Novo Veículo na Frota
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Placa:</label>
                        <input
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="Ex: ABC-1234"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Marca:</label>
                        <input
                          type="text"
                          value={vehicleBrand}
                          onChange={(e) => setVehicleBrand(e.target.value)}
                          placeholder="Ex: Scania / Volvo"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Modelo:</label>
                        <input
                          type="text"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          placeholder="Ex: FH 540"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Ano:</label>
                        <input
                          type="text"
                          value={vehicleYear}
                          onChange={(e) => setVehicleYear(e.target.value)}
                          placeholder="2022"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Tipo de Carroceria:</label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        >
                          <option value="Truck">Truck (Semipesado)</option>
                          <option value="Carreta">Carreta (Pesado)</option>
                          <option value="Toco">Toco</option>
                          <option value="Bi-trem">Bi-trem</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Capacidade de Carga:</label>
                        <input
                          type="text"
                          value={vehicleLoadCapacity}
                          onChange={(e) => setVehicleLoadCapacity(e.target.value)}
                          placeholder="Ex: 40.000 kg"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Capac. Tanque (L):</label>
                        <input
                          type="text"
                          value={vehicleTankCapacity}
                          onChange={(e) => setVehicleTankCapacity(e.target.value)}
                          placeholder="800"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Consumo Médio (km/L):</label>
                        <input
                          type="text"
                          value={vehicleAverageConsumption}
                          onChange={(e) => setVehicleAverageConsumption(e.target.value)}
                          placeholder="2.5"
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">Odômetro Atual (km):</label>
                        <input
                          type="number"
                          value={vehicleCurrentMileage}
                          onChange={(e) => setVehicleCurrentMileage(parseInt(e.target.value) || 0)}
                          className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Dados pré-formatados através de Heurística Cognitiva DODISA IA.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSendModalOpen(false)}
                  className="px-4 py-2 hover:bg-muted text-muted-foreground border border-border rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-900/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar e Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. COGNITIVE IA DETAILED EXTRACTION POPUP MODAL (CLEAN AND COMPACT) */}
      {detailModalOpen && currentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-hidden">
          <div className="bg-card border border-border w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-scale-in">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />
            
            {/* POPUP HEADER WITH EXPORT ACTIONS & STATUS */}
            <div className="border-b border-border p-4.5 bg-muted/20 flex flex-wrap items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                    {currentRecord.imageName}
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-full normal-case tracking-normal">
                      Confiança Heurística Estável
                    </span>
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    ID Registro: {currentRecord.id.substring(0, 8)}... • Análise IA extraída em {new Date(currentRecord.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* INTEGRATED UTILITY TOOLS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenSendModal}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/15 animate-pulse"
                  title="Enviar dados identificados por IA para o ERP"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar p/ Destino 🚀
                </button>

                <button
                  onClick={handleOpenEdit}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Corrigir Dados
                </button>

                <div className="h-4 w-px bg-border mx-1" />

                {/* Export Options */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                  <button
                    onClick={handleExportExcel}
                    className="p-1.5 hover:bg-card text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                    title="Exportar para Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="p-1.5 hover:bg-card text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                    title="Exportar para CSV"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="p-1.5 hover:bg-card text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                    title="Exportar em formato JSON"
                  >
                    <Code className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="p-1.5 hover:bg-card text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                    title="Imprimir Relatório PDF"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <div className="h-4 w-px bg-border mx-1" />

                {/* CLOSE ACTIONS */}
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer border border-border"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SPLIT SCREEN WORKSPACE LAYOUT */}
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
              
              {/* LEFT SIDE: MULTIMODAL ORIGINAL DOCUMENT VIEWER */}
              <div className="w-full md:w-[45%] border-b md:border-b-0 md:border-r border-border bg-slate-950 flex flex-col shrink-0 overflow-y-auto md:overflow-hidden relative min-h-[350px] md:min-h-0">
                <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    DOCUMENTO ORIGINAL MULTIMODAL
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                    Zoom Automático
                  </span>
                </div>

                {/* VISUAL VIEWER CANVAS WITH OVERLAY ANCHORS */}
                <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                  <div className="relative max-h-full max-w-full">
                    <img
                      referrerPolicy="no-referrer"
                      src={currentRecord.imageData}
                      alt={currentRecord.imageName}
                      className="max-h-[65vh] object-contain rounded-lg shadow-xl border border-slate-800"
                    />
                    
                    {/* Interactive Highlights Overlay */}
                    {currentRecord.result.highlights?.map((hl) => (
                      <div
                        key={hl.id}
                        className={`absolute border-2 rounded transition-all cursor-pointer ${
                          activeHighlightId === hl.id
                            ? "bg-blue-500/25 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20"
                            : "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-500 z-10"
                        }`}
                        style={{
                          left: `${hl.x}%`,
                          top: `${hl.y}%`,
                          width: `${hl.width}%`,
                          height: `${hl.height}%`,
                        }}
                        title={`${hl.label}: R$ ${hl.value}`}
                        onClick={() => setActiveHighlightId(hl.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* BOTTOM MAP KEY / INTERACTIVE HELP */}
                <div className="bg-slate-900 border-t border-slate-800 p-3.5 text-left text-slate-400 text-[10px] space-y-1">
                  <p className="font-bold uppercase tracking-wider text-slate-300 font-sans">
                    💡 Ancoragem Espacial Interactiva:
                  </p>
                  <p className="font-sans leading-normal">
                    Passe o mouse ou clique sobre as áreas coloridas no documento acima para identificar quais valores correspondem a cada lançamento estruturado na tabela à direita.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE: CORE ANALYTICS AND INTEL CORE */}
              <div className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden bg-card/40">
                
                {/* STRICT SYSTEM TABS FOR COMPACT DESIGN */}
                <div className="flex flex-wrap border-b border-border p-3 bg-muted/10 gap-1.5 sm:gap-2">
                  {[
                    {
                      id: "summary",
                      label: "Resumo Geral",
                      icon: Sparkles,
                      badge: currentRecord.result.summary ? 1 : 0
                    },
                    {
                      id: "data",
                      label: "Dados Extraídos",
                      icon: DollarSign,
                      badge: (currentRecord.result.values?.length || 0) + (currentRecord.result.categories?.length || 0)
                    },
                    {
                      id: "tables",
                      label: "Tabelas & Gráficos",
                      icon: List,
                      badge: (currentRecord.result.tables?.length || 0) + (currentRecord.result.charts?.length || 0)
                    },
                    {
                      id: "uncertainties",
                      label: "Incertezas & Alertas",
                      icon: HelpCircle,
                      badge: (currentRecord.result.observations?.length || 0) + (currentRecord.result.summary?.alerts?.length || 0)
                    }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isTabActive = activeResultTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveResultTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                          isTabActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-900/20 font-black"
                            : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 font-bold"
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        {tab.badge > 0 && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded-full leading-none font-bold ${
                            isTabActive ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* SCROLLABLE INTERACTIVE VIEWPORT FOR SELECTED TAB */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left">
                  
                  {/* TAB 1: SUMMARY BOARD */}
                  {activeResultTab === "summary" && (
                    <div className="space-y-4 animate-scale-in">
                      
                      {/* KPI ROW */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-0.5 text-left">
                          <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold">Lançamentos</span>
                          <p className="text-base font-black text-foreground font-mono">
                            {currentRecord.result.summary?.totalRecords || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-0.5 text-left">
                          <span className="text-[9px] text-muted-foreground uppercase font-mono font-bold">Categorias</span>
                          <p className="text-base font-black text-blue-500 font-mono">
                            {currentRecord.result.summary?.categoriesCount || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-0.5 text-left animate-pulse">
                          <span className="text-[9px] text-red-500 uppercase font-mono font-bold">Total Saídas</span>
                          <p className="text-base font-black text-red-500 font-mono">
                            R$ {(currentRecord.result.summary?.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-0.5 text-left">
                          <span className="text-[9px] text-emerald-500 uppercase font-mono font-bold">Total Entradas</span>
                          <p className="text-base font-black text-emerald-500 font-mono">
                            R$ {(currentRecord.result.summary?.totalRevenues || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* EXECUTIVE STATEMENT CARD */}
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          Parecer e Análise do Auditor IA
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          A leitura multimodal da imagem identificou com alto grau de acerto a estrutura financeira e as notas fiscais anexadas. Recomenda-se realizar a conferência das datas operacionais e categorias fiscais mapeadas antes de confirmar a gravação no ERP central.
                        </p>
                      </div>

                      {/* DATAS IDENTIFICADAS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            Datas e Competências
                          </h4>
                          {(!currentRecord.result.dates || currentRecord.result.dates.length === 0) ? (
                            <p className="text-[10px] text-muted-foreground italic font-mono">Sem datas mapeadas na imagem.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {currentRecord.result.dates.map((d, idx) => (
                                <span key={idx} className="bg-indigo-500/5 border border-indigo-500/10 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  📅 {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* COLORS AND HIGHLIGHT MEANINGS */}
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                            <Tag className="w-4 h-4 text-blue-500" />
                            Legendas de Destaque
                          </h4>
                          {(!currentRecord.result.colors || currentRecord.result.colors.length === 0) ? (
                            <p className="text-[10px] text-muted-foreground italic font-mono">Sem regras de cores.</p>
                          ) : (
                            <div className="space-y-2">
                              {currentRecord.result.colors.map((c, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 text-[10px] font-mono">
                                  <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 ${
                                    c.color.toLowerCase() === "verde" ? "bg-emerald-500 border-emerald-400" :
                                    c.color.toLowerCase() === "vermelho" ? "bg-red-500 border-red-400" :
                                    c.color.toLowerCase() === "amarelo" ? "bg-yellow-500 border-yellow-400" :
                                    "bg-blue-500 border-blue-400"
                                  }`} />
                                  <span className="font-extrabold uppercase text-foreground">{c.color}</span>: {c.meaning}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ALERTS SECTION */}
                      {currentRecord.result.summary?.alerts && currentRecord.result.summary.alerts.length > 0 && (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-2">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                            Inconsistências & Alertas Operacionais ({currentRecord.result.summary.alerts.length})
                          </span>
                          {currentRecord.result.summary.alerts.map((alertText, index) => (
                            <p key={index} className="text-xs text-amber-800 dark:text-amber-300 leading-normal font-sans font-medium pl-6 relative">
                              <span className="absolute left-1">•</span>
                              {alertText}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: DETAILED DATA TABLE */}
                  {activeResultTab === "data" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-scale-in">
                      
                      {/* Extracted Individual Transactions */}
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          Valores Financeiros Individuais ({currentRecord.result.values?.length || 0})
                        </h3>
                        {(!currentRecord.result.values || currentRecord.result.values.length === 0) ? (
                          <p className="text-[10px] text-muted-foreground font-mono italic">Sem transações monetárias individuais.</p>
                        ) : (
                          <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1">
                            {currentRecord.result.values.map((v, idx) => {
                              const isExpense = v.type === "despesa";
                              const isRevenue = v.type === "receita";
                              return (
                                <div 
                                  key={idx}
                                  className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between gap-3 text-xs hover:border-blue-500/30 hover:bg-blue-500/[0.01] transition-all cursor-pointer"
                                  onClick={() => {
                                    // Trigger Highlight alignment
                                    const matchHl = currentRecord.result.highlights?.find(h => h.value === v.value || h.label.includes(v.label));
                                    if (matchHl) setActiveHighlightId(matchHl.id);
                                  }}
                                >
                                  <div className="space-y-0.5">
                                    <span className="font-extrabold text-foreground block">{v.label}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase font-mono">
                                      {isExpense ? "Despesa" : isRevenue ? "Receita" : "Neutro"}
                                    </span>
                                  </div>
                                  <span className={`font-mono font-bold text-sm ${
                                    isExpense ? "text-red-500" : isRevenue ? "text-emerald-500" : "text-foreground"
                                  }`}>
                                    {v.original || `R$ ${v.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Interpretative Business Categories */}
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                          <Tag className="w-4 h-4 text-blue-500" />
                          Categorias Interpretadas ({currentRecord.result.categories?.length || 0})
                        </h3>
                        {(!currentRecord.result.categories || currentRecord.result.categories.length === 0) ? (
                          <p className="text-[10px] text-muted-foreground font-mono italic">Nenhuma categoria mapeada.</p>
                        ) : (
                          <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1">
                            {currentRecord.result.categories.map((c, idx) => {
                              const isExpense = c.type === "Despesa";
                              return (
                                <div key={idx} className="p-3 bg-muted/30 border border-border rounded-xl space-y-1">
                                  <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-foreground font-bold">{c.name}</span>
                                    <span className={`font-mono font-black ${isExpense ? "text-red-500" : "text-emerald-500"}`}>
                                      R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-snug">{c.description}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TABLES & CHARTS */}
                  {activeResultTab === "tables" && (
                    <div className="space-y-4 animate-scale-in">
                      {(!currentRecord.result.tables || currentRecord.result.tables.length === 0) &&
                       (!currentRecord.result.charts || currentRecord.result.charts.length === 0) ? (
                        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                          <FileSpreadsheet className="w-8 h-8 text-muted-foreground/40 mb-2" />
                          <p className="text-xs font-black uppercase tracking-wider text-foreground">Nenhuma tabela mapeada</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs mt-1 leading-relaxed">
                            A imagem digitalizada não apresenta grades tabulares ou diagramas de tendência legíveis.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* TABLES */}
                          {currentRecord.result.tables?.map((table, tableIdx) => (
                            <div key={tableIdx} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                              <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
                                <List className="w-4 h-4 text-indigo-500" />
                                {table.title || `Matriz Estruturada #${tableIdx + 1}`}
                              </h4>
                              <div className="border border-border rounded-xl overflow-hidden overflow-x-auto scrollbar-thin">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                  <thead>
                                    <tr className="bg-muted border-b border-border">
                                      {table.headers.map((h, i) => (
                                        <th key={i} className="p-2.5 text-[9px] font-black uppercase tracking-wider font-mono text-foreground">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.rows.map((row, rIdx) => (
                                      <tr key={rIdx} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="p-2.5 text-[11px] font-mono text-muted-foreground">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}

                          {/* CHARTS */}
                          {currentRecord.result.charts?.map((chart, chartIdx) => (
                            <div key={chartIdx} className="bg-card border border-border rounded-2xl p-4.5 space-y-2 shadow-sm">
                              <p className="text-xs font-black text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
                                📈 {chart.title || "Gráfico & Tendência"}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed pl-5 whitespace-pre-line">
                                {chart.explanation}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* TAB 4: CONFIDENCE & ALERTS */}
                  {activeResultTab === "uncertainties" && (
                    <div className="space-y-4 animate-scale-in">
                      <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5 shadow-sm text-left">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2">
                          <HelpCircle className="w-4.5 h-4.5 text-slate-500" />
                          Observações de Incerteza e Integridade
                        </h3>

                        {(!currentRecord.result.observations || currentRecord.result.observations.length === 0) ? (
                          <p className="text-[10px] text-muted-foreground font-mono italic">Leitura efetuada com 100% de confiança heurística.</p>
                        ) : (
                          <div className="space-y-2">
                            {currentRecord.result.observations.map((obs, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className="text-slate-400 mt-0.5 font-mono">•</span>
                                <p className="text-muted-foreground leading-relaxed font-sans">{obs}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-1.5">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                          Metadados de Processamento Multimodal:
                        </span>
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-muted-foreground">
                          <div>
                            <span className="font-bold">Algoritmo:</span> Gemini 2.5 Flash API
                          </div>
                          <div>
                            <span className="font-bold">Modo de Visão:</span> Document AI OCR
                          </div>
                          <div>
                            <span className="font-bold">Resolução de Imagem:</span> HD Automática
                          </div>
                          <div>
                            <span className="font-bold">Alinhamento Spatial:</span> Heurística do Polígono
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* MODAL FOOTER */}
                <div className="border-t border-border p-4 bg-muted/10 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Use o menu superior para exportar estes dados para planilhas.
                  </span>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-blue-900/10"
                  >
                    Fechar Detalhes
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. PREMIUM FLOATING SUCCESS TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-card text-foreground border border-emerald-500/30 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-slide-in max-w-sm text-left">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
            <span className="text-xs text-emerald-500 font-bold">✓</span>
          </div>
          <div>
            <p className="text-xs font-bold font-sans">{toast}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Memória e relatórios do ERP atualizados.</p>
          </div>
        </div>
      )}

    </div>
  );
}
