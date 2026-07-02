import React, { useState, useRef, useEffect } from "react";
import { ImportResponse } from "../types";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  HelpCircle, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Table, 
  FileSpreadsheet, 
  RefreshCw,
  X,
  Users,
  Truck,
  Navigation,
  Fuel,
  DollarSign,
  Calendar,
  Search,
  Eye,
  Settings,
  Filter,
  Info,
  Hash
} from "lucide-react";
import * as XLSX from "xlsx";

interface ImportSpreadsheetProps {
  onImportComplete: () => void;
}

const PASTABLE_EXAMPLE = `Motorista | Placa | Origem | Destino | Distancia | Valor | Data
João Silva | ABC-1234 | Recife, PE | Maceió, AL | 550 KM | R$ 7.500,00 | 2026-06-28
Marcos Oliveira | DEF-5678 | São Paulo, SP | Rio de Janeiro, RJ | 430 KM | R$ 6.200,00 | 2026-06-29
Pedro Santos | GHI-9012 | Belo Horizonte, MG | Brasília, DF | 750 KM | R$ 9.800,00 | 2026-06-30
Ana Souza | JKL-3456 | Rio de Janeiro, RJ | Cabo Frio, RJ | 150 KM | R$ 2.400,00 | 2026-06-30`;

interface ColumnValidation {
  key: string;
  name: string;
  found: boolean;
  detectedHeader: string | null;
  importance: "required" | "recommended" | "optional";
  description: string;
}

interface ValidationResult {
  columns: ColumnValidation[];
  rowsCount: number;
  delimiter: string;
  score: number;
  status: "excellent" | "warning" | "poor";
  previewRows: string[][];
  headers: string[];
}

export default function ImportSpreadsheet({ onImportComplete }: ImportSpreadsheetProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for preview modal and saving step
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [tempParsedData, setTempParsedData] = useState<ImportResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPreviewTab, setCurrentPreviewTab] = useState<"drivers" | "vehicles" | "freights" | "refuels" | "expenses">("freights");
  const [progressMsg, setProgressMsg] = useState("Lendo e codificando os dados da planilha...");

  // Manual Column Mapping support
  const [useManualMapping, setUseManualMapping] = useState(false);
  const [customMapping, setCustomMapping] = useState({
    driverCol: "",
    vehicleCol: "",
    originCol: "",
    destinationCol: "",
    valueCol: "",
    mileageCol: "",
    dateCol: "",
    litersCol: "",
    categoryCol: "",
    descCol: ""
  });

  // Advanced spreadsheet preview and search states
  const [gridSearchQuery, setGridSearchQuery] = useState("");
  const [gridRowLimit, setGridRowLimit] = useState(5);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // Stats calculations for preview modal
  const totalFreightValue = tempParsedData?.newFreights?.reduce((sum: number, f: any) => sum + (Number(f.financial?.value) || 0), 0) || 0;
  const avgFreightValue = tempParsedData?.newFreights?.length 
    ? totalFreightValue / tempParsedData.newFreights.length 
    : 0;
  const totalFuelLiters = tempParsedData?.newRefuels?.reduce((sum: number, r: any) => sum + (Number(r.liters) || 0), 0) || 0;
  const totalFuelValue = tempParsedData?.newRefuels?.reduce((sum: number, r: any) => sum + (Number(r.totalValue) || 0), 0) || 0;
  const totalExpensesValue = tempParsedData?.newExpenses?.reduce((sum: number, e: any) => sum + (Number(e.value) || 0), 0) || 0;

  const getMappedFieldPill = (headerName: string) => {
    const mappingKeys = [
      { key: "driverCol", label: "👤 Motorista", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
      { key: "vehicleCol", label: "🚚 Placa", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
      { key: "originCol", label: "📍 Origem", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
      { key: "destinationCol", label: "🏁 Destino", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
      { key: "valueCol", label: "💰 Valor", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" },
      { key: "mileageCol", label: "📏 Distância", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
      { key: "dateCol", label: "📅 Data", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300" },
      { key: "litersCol", label: "⛽ Litros", color: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
      { key: "categoryCol", label: "🏷️ Categoria", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
      { key: "descCol", label: "📝 Descrição", color: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
    ];

    const activeMap = useManualMapping ? customMapping : {
      driverCol: validation?.columns.find(c => c.name === "Nome do Motorista" && c.found)?.detectedHeader || "",
      vehicleCol: validation?.columns.find(c => c.name === "Identificação do Veículo (Placa)" && c.found)?.detectedHeader || "",
      originCol: validation?.columns.find(c => c.name === "Cidade de Origem" && c.found)?.detectedHeader || "",
      destinationCol: validation?.columns.find(c => c.name === "Cidade de Destino" && c.found)?.detectedHeader || "",
      valueCol: validation?.columns.find(c => c.name === "Valor do Frete" && c.found)?.detectedHeader || "",
      mileageCol: validation?.columns.find(c => c.name === "Distância (KM)" && c.found)?.detectedHeader || "",
      dateCol: validation?.columns.find(c => c.name === "Data" && c.found)?.detectedHeader || "",
      litersCol: validation?.columns.find(c => c.name === "Litros Abastecidos" && c.found)?.detectedHeader || "",
      categoryCol: validation?.columns.find(c => c.name === "Categoria da Despesa" && c.found)?.detectedHeader || "",
      descCol: validation?.columns.find(c => c.name === "Descrição/Observação" && c.found)?.detectedHeader || "",
    };

    const matches = mappingKeys.filter(m => activeMap[m.key as keyof typeof activeMap] === headerName);
    if (matches.length > 0) {
      return (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {matches.map((m, idx) => (
            <span key={idx} className="inline-block text-[8px] px-1 py-0.2 rounded font-extrabold tracking-tight uppercase bg-blue-50/80 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
              {m.label}
            </span>
          ))}
        </div>
      );
    }
    return null;
  };

  const loadingMessages = [
    "Lendo e codificando os dados da planilha...",
    "Consultando o motor cognitivo Gemini...",
    "Mapeando e relacionando motoristas, veículos e rotas...",
    "Ajustando e corrigindo inconsistências...",
    "Estruturando registros e normalizando dados..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      let step = 0;
      setProgressMsg(loadingMessages[0]);
      interval = setInterval(() => {
        step = (step + 1) % loadingMessages.length;
        setProgressMsg(loadingMessages[step]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Reactive effect to initialize column mapping options when a spreadsheet is validated
  useEffect(() => {
    if (validation && validation.headers.length > 0) {
      const findHeader = (key: string) => validation.columns.find(c => c.key === key)?.detectedHeader || "";

      setCustomMapping({
        driverCol: findHeader("driver"),
        vehicleCol: findHeader("vehicle"),
        originCol: findHeader("origin"),
        destinationCol: findHeader("destination"),
        valueCol: findHeader("value"),
        mileageCol: findHeader("mileage"),
        dateCol: findHeader("date"),
        litersCol: findHeader("liters"),
        categoryCol: findHeader("category"),
        descCol: findHeader("description")
      });
    }
  }, [validation]);

  // Run reactive validation whenever the input text changes
  useEffect(() => {
    if (!inputText.trim()) {
      setValidation(null);
      return;
    }

    try {
      const result = runColumnValidation(inputText);
      setValidation(result);
    } catch (err) {
      console.error("Erro na validação de colunas:", err);
      setValidation(null);
    }
  }, [inputText]);

  // Performs a robust scan of columns, detecting delimiters and checking expected fields
  const runColumnValidation = (text: string): ValidationResult => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { 
        columns: [], 
        rowsCount: 0, 
        delimiter: "Nenhum", 
        score: 0, 
        status: "poor", 
        previewRows: [], 
        headers: [] 
      };
    }

    // Delimiter Detection
    const delimiters = [";", ",", "|", "\t"];
    let bestDelimiter = "|";
    let maxCount = 0;
    
    // Scan up to 4 sample lines
    const sampleLines = lines.slice(0, 4);
    delimiters.forEach(delim => {
      let count = 0;
      sampleLines.forEach(l => {
        count += (l.split(delim).length - 1);
      });
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delim;
      }
    });

    const delimiter = maxCount > 0 ? bestDelimiter : null;
    const headerLine = lines[0];
    const headers = delimiter ? headerLine.split(delimiter).map(h => h.trim()) : [headerLine];

    // Semantic matching rules for Portuguese/English spreadsheet headers
    const validationRules = [
      {
        key: "driver",
        keys: ["motorista", "driver", "condutor", "funcionario", "colaborador", "nome do motorista", "piloto"],
        importance: "required" as const,
        label: "Nome do Motorista",
        desc: "Essencial para vincular as rotas, cadastrar o condutor ou registrar custos."
      },
      {
        key: "vehicle",
        keys: ["placa", "veiculo", "veículo", "caminhao", "caminhão", "carro", "plate", "vehicle", "placa do veículo", "cavalo"],
        importance: "required" as const,
        label: "Identificação do Veículo (Placa)",
        desc: "Essencial para controle de frotas e consumos."
      },
      {
        key: "origin",
        keys: ["origem", "departure", "origin", "partida", "cidade de origem"],
        importance: "recommended" as const,
        label: "Cidade de Origem",
        desc: "Recomendado para rotas de escoamento e faturamento."
      },
      {
        key: "destination",
        keys: ["destino", "para", "arrival", "destination", "chegada", "cidade de destino"],
        importance: "recommended" as const,
        label: "Cidade de Destino",
        desc: "Recomendado para rotas de escoamento e faturamento."
      },
      {
        key: "value",
        keys: ["valor", "frete", "preço", "preco", "custo", "total", "value", "receita", "faturamento"],
        importance: "recommended" as const,
        label: "Valor do Frete",
        desc: "Recomendado para os relatórios financeiros e BI de rentabilidade."
      },
      {
        key: "mileage",
        keys: ["km", "distancia", "distância", "quilometragem", "mileage", "dist"],
        importance: "optional" as const,
        label: "Distância (KM)",
        desc: "Opcional para autonomia de consumo."
      },
      {
        key: "date",
        keys: ["data", "date", "dia", "periodo", "período"],
        importance: "optional" as const,
        label: "Data",
        desc: "Opcional. Se não informada, usará a data atual de importação."
      },
      {
        key: "liters",
        keys: ["litros", "litro", "liters", "vol", "volume", "abastecido"],
        importance: "optional" as const,
        label: "Litros Abastecidos",
        desc: "Opcional. Usado especificamente para lançamentos de abastecimento."
      },
      {
        key: "category",
        keys: ["categoria", "category", "tipo despesa", "despesa"],
        importance: "optional" as const,
        label: "Categoria da Despesa",
        desc: "Opcional. Usado para classificar outras despesas da viagem."
      },
      {
        key: "description",
        keys: ["descricao", "descrição", "obs", "observacao", "observações", "memo", "detalhe"],
        importance: "optional" as const,
        label: "Descrição/Observação",
        desc: "Opcional. Detalhamento extra do lançamento."
      }
    ];

    // A keyword matches a header only if it appears as a whole word/phrase,
    // not as a loose substring (e.g. "nome" shouldn't match "Nome da Empresa",
    // and "de" shouldn't match "Cidade").
    const headerMatchesKeyword = (header: string, keyword: string) => {
      if (header === keyword) return true;
      const words = header.split(/[^a-z0-9çãáàâéêíóôõúü]+/i).filter(Boolean);
      if (!keyword.includes(" ")) {
        return words.includes(keyword);
      }
      // Multi-word keyword: match as a contiguous phrase within the header's words
      const keywordWords = keyword.split(" ").filter(Boolean);
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        if (keywordWords.every((kw, j) => words[i + j] === kw)) return true;
      }
      return false;
    };

    const columns: ColumnValidation[] = validationRules.map(rule => {
      let found = false;
      let detectedHeader: string | null = null;

      for (let i = 0; i < headers.length; i++) {
        const h = headers[i].toLowerCase().trim();
        const match = rule.keys.some(k => headerMatchesKeyword(h, k));
        if (match) {
          found = true;
          detectedHeader = headers[i];
          break;
        }
      }

      return {
        key: rule.key,
        name: rule.label,
        found,
        detectedHeader,
        importance: rule.importance,
        description: rule.desc
      };
    });

    // Score calculation
    const requiredCount = columns.filter(c => c.importance === "required").length;
    const requiredFound = columns.filter(c => c.importance === "required" && c.found).length;
    const recommendedCount = columns.filter(c => c.importance === "recommended").length;
    const recommendedFound = columns.filter(c => c.importance === "recommended" && c.found).length;

    let score = 0;
    if (requiredCount > 0) {
      score += (requiredFound / requiredCount) * 60;
    }
    if (recommendedCount > 0) {
      score += (recommendedFound / recommendedCount) * 40;
    }
    score = Math.round(score);

    // Parse all rows for full client-side search and dynamic preview
    const previewRows: string[][] = [];
    for (let i = 0; i < lines.length; i++) {
      const rawRow = lines[i];
      const rowCells = delimiter ? rawRow.split(delimiter).map(c => c.trim()) : [rawRow];
      previewRows.push(rowCells);
    }

    let status: "excellent" | "warning" | "poor" = "excellent";
    if (score >= 85) {
      status = "excellent";
    } else if (score >= 45) {
      status = "warning";
    } else {
      status = "poor";
    }

    return {
      columns,
      rowsCount: lines.length - 1 >= 0 ? lines.length - 1 : 0,
      delimiter: delimiter || "Não detectado (Formato Livre / Corrida de Texto)",
      score,
      status,
      previewRows,
      headers
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Robust parsing of Excel spreadsheets and CSV files with active error catcher
  const processFile = (file: File) => {
    setErrorMsg("");
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error("Não foi possível carregar os bytes do arquivo Excel.");
          }
          const arr = new Uint8Array(data as ArrayBuffer);
          const workbook = XLSX.read(arr, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            throw new Error("A pasta de trabalho do Excel está vazia (nenhuma aba encontrada).");
          }

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert sheet to clean CSV content
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          
          if (!csvContent || csvContent.trim().length === 0) {
            throw new Error("A primeira aba da planilha está em branco ou sem dados válidos.");
          }

          setInputText(csvContent);
          setErrorMsg("");
        } catch (err: any) {
          setErrorMsg(`Erro de processamento no arquivo Excel: ${err.message || err}`);
        }
      };

      reader.onerror = () => {
        setErrorMsg("Erro de hardware ou sistema ao ler o arquivo Excel selecionado.");
      };

      reader.readAsArrayBuffer(file);
    } else {
      // Normal text/CSV reading
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || text.trim().length === 0) {
            throw new Error("O arquivo carregado está vazio.");
          }
          setInputText(text);
          setErrorMsg("");
        } catch (err: any) {
          setErrorMsg(`Erro ao ler arquivo de texto: ${err.message}`);
        }
      };

      reader.onerror = () => {
        setErrorMsg("Falha crítica ao ler o arquivo de texto.");
      };

      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleIAImport = async (forceHeuristic = false) => {
    if (!inputText.trim()) {
      setErrorMsg("Por favor, forneça os dados da planilha antes de solicitar a importação.");
      setErrorDetails("");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setErrorDetails("");
    setTempParsedData(null);
    setIsPreviewOpen(false);

    try {
      const response = await fetch("/api/ai/import-spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputText,
          filename: "import_planilha_processada.csv",
          useHeuristic: forceHeuristic || useManualMapping,
          customMapping: useManualMapping ? customMapping : undefined
        })
      });
      const data = await response.json();

      if (data.success) {
        setTempParsedData(data);
        setIsPreviewOpen(true); // Open the preview & confirmation modal
        
        // Auto select tab with detected items
        if (data.newFreights?.length) setCurrentPreviewTab("freights");
        else if (data.newDrivers?.length) setCurrentPreviewTab("drivers");
        else if (data.newVehicles?.length) setCurrentPreviewTab("vehicles");
        else if (data.newRefuels?.length) setCurrentPreviewTab("refuels");
        else if (data.newExpenses?.length) setCurrentPreviewTab("expenses");
      } else {
        setErrorMsg(data.message || "Falha na interpretação da planilha por parte do motor de IA.");
        if (data.details) setErrorDetails(data.details);
      }
    } catch (err: any) {
      setErrorMsg("Erro na requisição. Verifique sua conexão ou se a chave de API está ativa no servidor.");
      setErrorDetails(err.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!tempParsedData) return;
    setSaving(true);
    setErrorMsg("");
    setErrorDetails("");

    try {
      const response = await fetch("/api/ai/save-imported-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedResult: tempParsedData
        })
      });
      const data = await response.json();

      if (data.success) {
        setImportResult(tempParsedData); // Show result in right column
        setIsPreviewOpen(false); // Close preview modal
        onImportComplete(); // reload parent database state
      } else {
        setErrorMsg(data.message || "Falha ao persistir os dados importados.");
        if (data.details) setErrorDetails(data.details);
      }
    } catch (err: any) {
      setErrorMsg("Erro de rede ao salvar os registros importados.");
      setErrorDetails(err.message || "");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setImportResult(null);
    setTempParsedData(null);
    setErrorMsg("");
    setErrorDetails("");
  };

  return (
    <>
      <div id="modulo-importacao-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input / Validation Panel side */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
              <Upload className="w-5 h-5 text-blue-600" />
              Importador de Planilhas DODISA
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Suporta arrastar arquivos Excel (.XLS, .XLSX) e CSV ou colagem livre de tabelas.
            </p>
          </div>
          {inputText && (
            <button 
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
              Limpar dados
            </button>
          )}
        </div>

        {/* Drag & Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .txt, .xls, .xlsx"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-700">Selecione ou Arraste sua Planilha</p>
          <p className="text-[10px] text-gray-400 mt-1">Excel (XLS, XLSX) ou CSV</p>
        </div>

        {/* Text Area / Paste Box */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-gray-500" />
              Dados Carregados
            </span>
            <button
              onClick={() => setInputText(PASTABLE_EXAMPLE)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-all text-[11px]"
            >
              <Play className="w-3.5 h-3.5" />
              Preencher com Exemplo
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Carregue uma planilha acima ou cole dados estruturados aqui para validação de colunas..."
            rows={5}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg p-3 text-xs font-mono outline-none resize-none transition-all"
          />
        </div>

        {/* Client-side Live Validation Reporting */}
        {validation && (
          <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-slate-900/40 space-y-3 p-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-2">
              <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Validação de Layout de Colunas
              </span>
              <span className="font-mono text-[10px] bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                Delimitador: {validation.delimiter}
              </span>
            </div>

            {/* Quality Score Bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Acurácia Teórica de Importação:</span>
                <span className={`font-bold ${
                  validation.status === "excellent" ? "text-emerald-600 dark:text-emerald-400" :
                  validation.status === "warning" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                }`}>
                  {validation.score}% ({
                    validation.status === "excellent" ? "Excelente" :
                    validation.status === "warning" ? "Regular (IA ajudará)" : "Texto Livre / Cognitivo"
                  })
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    validation.status === "excellent" ? "bg-emerald-500" :
                    validation.status === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${validation.score || 15}%` }}
                />
              </div>
            </div>

            {/* Column Checklist pill tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400 block">Status de Mapeamento:</span>
              <div className="flex flex-wrap gap-1.5">
                {validation.columns.map((col, idx) => (
                  <div 
                    key={idx}
                    title={col.description}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      col.found 
                        ? "bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-850/40 text-emerald-700 dark:text-emerald-400" 
                        : col.importance === "required" 
                        ? "bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-850/40 text-red-700 dark:text-red-400"
                        : "bg-gray-100 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {col.found ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className={`w-3 h-3 ${col.importance === "required" ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`} />
                    )}
                    <span className="text-inherit">{col.name}</span>
                    {col.found && (
                      <span className="opacity-60 text-[9px] font-mono text-inherit">({col.detectedHeader})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Validation warning text */}
            {validation.score < 85 && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>Análise Inteligente Ativada:</strong> Algumas colunas não foram detectadas de forma explícita. O motor de IA cognitiva da <strong>DODISA LOGÍSTICA</strong> deduzirá e extrairá as informações do texto de forma adaptativa.
              </div>
            )}

            {/* Preview Table Grid */}
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-150 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  Grade de Pré-visualização da Planilha
                </span>

                {/* Control Row Limit & Info */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-400 font-mono">Linhas exibidas:</span>
                  <div className="flex bg-gray-200/60 dark:bg-slate-800/80 p-0.5 rounded-md text-[9px] font-semibold">
                    {[5, 15, 50, -1].map((lim) => (
                      <button
                        key={lim}
                        type="button"
                        onClick={() => setGridRowLimit(lim)}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          gridRowLimit === lim
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {lim === -1 ? "Todas" : lim}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Local Live Search input inside the loaded CSV preview */}
              <div className="relative">
                <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={gridSearchQuery}
                  onChange={(e) => setGridSearchQuery(e.target.value)}
                  placeholder="Pesquisar nos dados carregados..."
                  className="w-full text-[10px] bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg pl-7 pr-3 py-1.5 focus:border-blue-500 focus:outline-none placeholder-gray-400"
                />
              </div>

              <div className="overflow-auto border border-gray-200 dark:border-slate-800 rounded-xl max-h-60 bg-white dark:bg-slate-950 shadow-sm">
                <table className="w-full text-left text-[10px] border-collapse bg-white dark:bg-slate-950 table-fixed min-w-[600px]">
                  <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">
                    <tr className="font-bold text-gray-700 dark:text-gray-300">
                      <th className="p-2 px-3 w-[45px]">#</th>
                      {validation.headers.map((h, i) => (
                        <th key={i} className="p-2 px-3 border-l border-gray-200 dark:border-slate-800 truncate" title={h}>
                          <div className="flex flex-col justify-start">
                            <span className="text-gray-900 dark:text-white font-bold leading-tight">{h}</span>
                            {getMappedFieldPill(h)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const parsedRows = validation.previewRows.slice(1);
                      const filteredRows = parsedRows.filter((row) => {
                        if (!gridSearchQuery) return true;
                        const query = gridSearchQuery.toLowerCase();
                        return row.some(cell => (cell || "").toLowerCase().includes(query));
                      });
                      const limitedRows = gridRowLimit === -1 ? filteredRows : filteredRows.slice(0, gridRowLimit);

                      if (limitedRows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={validation.headers.length + 1} className="p-6 text-center text-gray-400 italic">
                              Nenhum registro correspondente à sua busca.
                            </td>
                          </tr>
                        );
                      }

                      return limitedRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-100 dark:border-slate-800/60 hover:bg-gray-50/70 dark:hover:bg-slate-900/30 text-gray-600 dark:text-gray-400 transition-colors">
                          <td className="p-2 px-3 font-mono text-gray-400 dark:text-gray-500 font-semibold bg-gray-50/40 dark:bg-slate-950/20">{rIdx + 1}</td>
                          {validation.headers.map((_, cIdx) => (
                            <td key={cIdx} className="p-2 px-3 border-l border-gray-150 dark:border-slate-800/50 truncate" title={row[cIdx] || ""}>
                              {row[cIdx] || "-"}
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center text-[9px] text-gray-400 dark:text-gray-500 font-mono mt-1">
                <span>
                  Mostrando {Math.min(gridRowLimit === -1 ? validation.rowsCount : gridRowLimit, validation.rowsCount)} de {validation.rowsCount} linhas.
                </span>
                <span>
                  Delimitador: <strong>{validation.delimiter}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Manual Column Mapping & Selection Panel */}
        {validation && (
          <div className="border border-gray-200 dark:border-slate-800 rounded-lg p-3 bg-gray-50/50 dark:bg-slate-900/40 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={useManualMapping}
                onChange={(e) => setUseManualMapping(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Mapeamento Manual de Colunas</span>
            </label>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-1 pl-6">
              Ative se o seu arquivo tiver nomes de colunas diferentes ou se quiser vincular os campos manualmente com precisão de 100%.
            </p>

            {useManualMapping && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-200 dark:border-slate-800 pl-6 text-xs text-gray-700 dark:text-gray-300 animate-fade-in">
                {[
                  { key: "driverCol", label: "Motorista", expected: "Nome do Motorista" },
                  { key: "vehicleCol", label: "Placa", expected: "Placa do Veículo" },
                  { key: "originCol", label: "Origem", expected: "Cidade de Origem" },
                  { key: "destinationCol", label: "Destino", expected: "Cidade de Destino" },
                  { key: "valueCol", label: "Valor / Custo", expected: "Valor do Frete" },
                  { key: "mileageCol", label: "Distância (KM)", expected: "Quilometragem / Distância" },
                  { key: "dateCol", label: "Data", expected: "Data do Lançamento" },
                  { key: "litersCol", label: "Litros (Abastec.)", expected: "Litros de Combustível" },
                  { key: "categoryCol", label: "Categoria (Desp.)", expected: "Categoria de Despesa" },
                  { key: "descCol", label: "Descrição", expected: "Descrição Geral" },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <span className="text-[10px] font-semibold text-gray-500 block">{field.label}:</span>
                    <select
                      value={customMapping[field.key as keyof typeof customMapping] || ""}
                      onChange={(e) => setCustomMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full text-[11px] bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded px-1.5 py-1 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Não Consta / Padrão --</option>
                      {validation.headers.map((h, hIdx) => (
                        <option key={hIdx} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs leading-relaxed animate-fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div className="space-y-1.5 w-full">
              <strong className="block text-red-800 dark:text-red-200 font-extrabold uppercase tracking-wide">
                Falha na Leitura ou Validação:
              </strong>
              <p className="font-semibold text-red-700 dark:text-red-300">{errorMsg}</p>
              {errorDetails && (
                <div className="p-2 mt-1.5 bg-red-100/50 dark:bg-red-950/40 rounded border border-red-200/40 dark:border-red-900/30 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-32 text-red-900 dark:text-red-300">
                  {errorDetails}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dual Mode Import Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => handleIAImport(true)}
            disabled={loading || !inputText.trim()}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white disabled:bg-gray-200 disabled:text-gray-400 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-700 shadow-md cursor-pointer disabled:cursor-not-allowed"
            title="Importa diretamente mapeando suas colunas de forma exata"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Table className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>Mapeamento Direto</span>
          </button>

          <button
            onClick={() => handleIAImport(false)}
            disabled={loading || !inputText.trim()}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed"
            title="Usa IA para deduzir, preencher lacunas e enriquecer seus dados"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            )}
            <span>Importação com IA</span>
          </button>
        </div>
      </div>

      {/* Output / Result Side */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-foreground flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Resultado da Análise Cognitiva
          </h3>

          {importResult ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Importação Concluída com Sucesso!</h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">{importResult.summary}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Entidades inseridas no banco:</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-muted/50 dark:bg-slate-950/60 border border-border p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px]">Motoristas:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">+{importResult.newDrivers?.length || 0}</span>
                  </div>
                  <div className="bg-muted/50 dark:bg-slate-950/60 border border-border p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px]">Veículos:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">+{importResult.newVehicles?.length || 0}</span>
                  </div>
                  <div className="bg-muted/50 dark:bg-slate-950/60 border border-border p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px]">Fretes / Viagens:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">+{importResult.newFreights?.length || 0}</span>
                  </div>
                  <div className="bg-muted/50 dark:bg-slate-950/60 border border-border p-2.5 rounded-lg flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px]">Despesas / Abastec.:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      +{(importResult.newExpenses?.length || 0) + (importResult.newRefuels?.length || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Created items audit trail */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto bg-muted/50 dark:bg-slate-950/60 border border-border rounded-lg p-2.5 scrollbar-thin scrollbar-thumb-border">
                <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Log de Registros Mapeados:</p>
                {importResult.newDrivers?.map((drv, idx) => (
                  <div key={`drv-${idx}`} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                    <span>Cadastro do motorista <strong className="text-foreground">{drv.fullName}</strong> foi sincronizado.</span>
                  </div>
                ))}
                {importResult.newVehicles?.map((vhc, idx) => (
                  <div key={`vhc-${idx}`} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                    <span>Sincronizado veículo da frota com placa <strong className="text-foreground">{vhc.plate}</strong> ({vhc.model}).</span>
                  </div>
                ))}
                {importResult.newFreights?.map((frt, idx) => (
                  <div key={`frt-${idx}`} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ArrowRight className="w-3 h-3 text-emerald-500" />
                    <span>Vínculo de escoamento: <strong className="text-foreground">{frt.origin.city}</strong> → <strong className="text-foreground">{frt.destination.city}</strong> ({frt.mileage.total} KM)</span>
                  </div>
                ))}
                {(!importResult.newDrivers?.length && !importResult.newFreights?.length && !importResult.newVehicles?.length) && (
                  <p className="text-[10px] text-muted-foreground italic">Todas as estruturas foram indexadas de forma relacional.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-14 text-muted-foreground space-y-4">
              <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto animate-pulse" />
              <div className="max-w-xs mx-auto">
                <p className="text-xs text-foreground font-medium">Aguardando dados de entrada.</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Ao carregar um arquivo ou colar dados, o sistema mapeará colunas, relacionará motoristas e veículos aos fretes, e lançará os registros no ERP em tempo real.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 text-[11px] text-blue-800 dark:text-blue-300 font-sans leading-relaxed flex items-start gap-2 shadow-sm">
          <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Dica de Uso:</strong> Use cabeçalhos claros como <em>Motorista</em>, <em>Placa</em>, <em>Origem</em> e <em>Destino</em> para obter mapeamentos perfeitos de alta fidelidade! Arquivos Excel nativos são convertidos e analisados automaticamente.
          </span>
        </div>
      </div>
    </div>

    {/* Elegant Progressive Loading Modal */}
    {loading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            {/* Animated Outer Spinner rings */}
            <div className="absolute inset-0 border-4 border-blue-100 dark:border-slate-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-md font-extrabold text-gray-900 dark:text-white tracking-tight">
              Análise Cognitiva DODISA
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold font-mono animate-pulse min-h-[1.5rem]">
              {progressMsg}
            </p>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Por favor, aguarde alguns segundos enquanto o motor Gemini processa sua planilha de forma inteligente.
          </p>
        </div>
      </div>
    )}

    {/* Preview and Confirmation Step Modal */}
    {isPreviewOpen && tempParsedData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
          {/* Modal Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-950/40 p-1.5 rounded-lg text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight uppercase">
                  Pré-visualização e Confirmação de Importação
                </h3>
                <p className="text-[10px] text-gray-500">
                  Verifique e aprove os registros lidos pela IA antes de salvar no ERP DODISA LOGÍSTICA
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Summary Banner */}
          <div className="px-6 py-3 bg-blue-50/60 dark:bg-blue-950/10 border-b border-blue-100/30 dark:border-blue-900/10 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 animate-pulse" />
            <p className="text-xs text-blue-900 dark:text-blue-300 font-medium leading-relaxed">
              {tempParsedData.summary || "Mapeamento cognitivo concluído. Detectamos as seguintes informações para gravação:"}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 dark:border-slate-800 px-6 overflow-x-auto bg-gray-50/20">
            {[
              { id: "freights", label: "Fretes", count: tempParsedData.newFreights?.length || 0, icon: Navigation },
              { id: "drivers", label: "Motoristas", count: tempParsedData.newDrivers?.length || 0, icon: Users },
              { id: "vehicles", label: "Veículos", count: tempParsedData.newVehicles?.length || 0, icon: Truck },
              { id: "refuels", label: "Abastecimentos", count: tempParsedData.newRefuels?.length || 0, icon: Fuel },
              { id: "expenses", label: "Outras Despesas", count: tempParsedData.newExpenses?.length || 0, icon: DollarSign }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentPreviewTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  currentPreviewTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  currentPreviewTab === tab.id
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-[350px] bg-gray-50/30 dark:bg-slate-950/20">
            {/* Modal tab local search query input */}
            <div className="mb-4 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder={`🔍 Pesquisar na aba de ${
                  currentPreviewTab === "freights" ? "fretes..." :
                  currentPreviewTab === "drivers" ? "motoristas..." :
                  currentPreviewTab === "vehicles" ? "veículos..." :
                  currentPreviewTab === "refuels" ? "abastecimentos..." : "outras despesas..."
                }`}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 focus:outline-none placeholder-gray-400 shadow-sm transition-all text-gray-800 dark:text-white"
              />
            </div>

            {currentPreviewTab === "freights" && (
              <div className="space-y-3">
                {(!tempParsedData.newFreights || tempParsedData.newFreights.length === 0) ? (
                  <div className="text-center py-10 text-gray-400 text-xs">Nenhum frete detectado nesta planilha.</div>
                ) : (
                  <>
                    {/* Stats Summary Grid for Freights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Total de Fretes</span>
                        <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{tempParsedData.newFreights.length}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Faturamento Estimado</span>
                        <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                          R$ {totalFreightValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Ticket Médio por Viagem</span>
                        <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
                          R$ {avgFreightValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 shadow-md">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-slate-950 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800/80">
                            <th className="p-3">Origem</th>
                            <th className="p-3">Destino</th>
                            <th className="p-3">Motorista</th>
                            <th className="p-3">Placa</th>
                            <th className="p-3">Carga</th>
                            <th className="p-3 text-right">Valor do Frete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = tempParsedData.newFreights.filter((f: any) => {
                              if (!modalSearchQuery) return true;
                              const query = modalSearchQuery.toLowerCase();
                              const origin = (f.origin?.city || f.origin || "").toLowerCase();
                              const destination = (f.destination?.city || f.destination || "").toLowerCase();
                              const driver = (f.driverName || f.driverId || "").toLowerCase();
                              const plate = (f.vehiclePlate || f.vehicleId || "").toLowerCase();
                              const cargo = (f.cargo?.type || f.cargo?.description || "").toLowerCase();
                              return origin.includes(query) || destination.includes(query) || driver.includes(query) || plate.includes(query) || cargo.includes(query);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-gray-400 italic">Nenhum frete corresponde à sua busca.</td>
                                </tr>
                              );
                            }

                            return filtered.map((f: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-gray-900 dark:text-white">{f.origin?.city || f.origin || "-"}, {f.origin?.state || ""}</td>
                                <td className="p-3 font-semibold text-gray-900 dark:text-white">{f.destination?.city || f.destination || "-"}, {f.destination?.state || ""}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300 font-medium">{f.driverName || f.driverId || "Padrão"}</td>
                                <td className="p-3 font-mono text-gray-500 font-bold"><span className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{f.vehiclePlate || f.vehicleId || "Frota"}</span></td>
                                <td className="p-3 text-gray-500">{f.cargo?.type || f.cargo?.description || "Carga Geral"}</td>
                                <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                  {f.financial?.value ? `R$ ${f.financial.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentPreviewTab === "drivers" && (
              <div className="space-y-3">
                {(!tempParsedData.newDrivers || tempParsedData.newDrivers.length === 0) ? (
                  <div className="text-center py-10 text-gray-400 text-xs">Nenhum novo motorista mapeado nesta planilha.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Novos Motoristas</span>
                        <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{tempParsedData.newDrivers.length}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Status de Integração</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Prontos para Gravar no Banco
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 shadow-md">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-slate-950 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800/80">
                            <th className="p-3">Nome do Motorista</th>
                            <th className="p-3">CPF</th>
                            <th className="p-3">Telefone</th>
                            <th className="p-3">CNH</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Cidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = tempParsedData.newDrivers.filter((d: any) => {
                              if (!modalSearchQuery) return true;
                              const query = modalSearchQuery.toLowerCase();
                              const name = (d.fullName || "").toLowerCase();
                              const cpf = (d.cpf || "").toLowerCase();
                              const city = (d.city || "").toLowerCase();
                              return name.includes(query) || cpf.includes(query) || city.includes(query);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-gray-400 italic">Nenhum motorista corresponde à sua busca.</td>
                                </tr>
                              );
                            }

                            return filtered.map((d: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                  {d.fullName}
                                </td>
                                <td className="p-3 font-mono text-gray-500">{d.cpf || "000.000.000-00"}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{d.phone || "(81) 99999-9999"}</td>
                                <td className="p-3 font-mono text-gray-500">{d.cnh || "Pendente"}</td>
                                <td className="p-3">
                                  <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-black px-2 py-0.5 rounded text-[10px]">
                                    Categoria {d.cnhCategory || "D"}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-500">{d.city || "Recife"}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentPreviewTab === "vehicles" && (
              <div className="space-y-3">
                {(!tempParsedData.newVehicles || tempParsedData.newVehicles.length === 0) ? (
                  <div className="text-center py-10 text-gray-400 text-xs">Nenhum novo veículo detectado na planilha.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Novos Veículos</span>
                        <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{tempParsedData.newVehicles.length}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Validação de Frota</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Placas e dados estruturados
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 shadow-md">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-slate-950 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800/80">
                            <th className="p-3">Placa</th>
                            <th className="p-3">Marca / Modelo</th>
                            <th className="p-3">Ano</th>
                            <th className="p-3">Capacidade</th>
                            <th className="p-3">Autonomia Consumo</th>
                            <th className="p-3">Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = tempParsedData.newVehicles.filter((v: any) => {
                              if (!modalSearchQuery) return true;
                              const query = modalSearchQuery.toLowerCase();
                              const plate = (v.plate || "").toLowerCase();
                              const brand = (v.brand || "").toLowerCase();
                              const model = (v.model || "").toLowerCase();
                              const type = (v.type || "").toLowerCase();
                              return plate.includes(query) || brand.includes(query) || model.includes(query) || type.includes(query);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-gray-400 italic">Nenhum veículo corresponde à sua busca.</td>
                                </tr>
                              );
                            }

                            return filtered.map((v: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-mono font-black text-gray-900 dark:text-white">
                                  <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                                    {v.plate}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{v.brand} {v.model}</td>
                                <td className="p-3 text-gray-500 font-mono">{v.year || "2022"}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{v.loadCapacity || "30 Toneladas"}</td>
                                <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{v.averageConsumption || "2.8"} KM/L</td>
                                <td className="p-3"><span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold">{v.type || "Truck"}</span></td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentPreviewTab === "refuels" && (
              <div className="space-y-3">
                {(!tempParsedData.newRefuels || tempParsedData.newRefuels.length === 0) ? (
                  <div className="text-center py-10 text-gray-400 text-xs">Nenhum abastecimento mapeado na planilha.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Registros</span>
                        <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{tempParsedData.newRefuels.length}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Volume de Combustível</span>
                        <span className="text-lg font-black font-mono text-orange-600 dark:text-orange-400 mt-1">
                          {totalFuelLiters.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Custo Total de Diesel</span>
                        <span className="text-lg font-black font-mono text-red-600 dark:text-red-400 mt-1">
                          R$ {totalFuelValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 shadow-md">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-slate-950 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800/80">
                            <th className="p-3">Data</th>
                            <th className="p-3">Posto</th>
                            <th className="p-3">Motorista</th>
                            <th className="p-3">Placa Veículo</th>
                            <th className="p-3">Litros</th>
                            <th className="p-3 text-right">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = tempParsedData.newRefuels.filter((r: any) => {
                              if (!modalSearchQuery) return true;
                              const query = modalSearchQuery.toLowerCase();
                              const station = (r.gasStation || "").toLowerCase();
                              const driver = (r.driverName || r.driverId || "").toLowerCase();
                              const plate = (r.vehiclePlate || r.vehicleId || "").toLowerCase();
                              return station.includes(query) || driver.includes(query) || plate.includes(query);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-gray-400 italic">Nenhum abastecimento corresponde à sua busca.</td>
                                </tr>
                              );
                            }

                            return filtered.map((r: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-mono text-gray-500 font-medium">{r.date || "-"}</td>
                                <td className="p-3 font-semibold text-gray-900 dark:text-white">{r.gasStation || "Posto Reconciliado"}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{r.driverName || r.driverId || "-"}</td>
                                <td className="p-3 font-mono text-gray-500 font-bold">
                                  <span className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{r.vehiclePlate || r.vehicleId || "-"}</span>
                                </td>
                                <td className="p-3 font-mono font-bold text-gray-600 dark:text-gray-400">{r.liters} L</td>
                                <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                                  R$ {r.totalValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "-"}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentPreviewTab === "expenses" && (
              <div className="space-y-3">
                {(!tempParsedData.newExpenses || tempParsedData.newExpenses.length === 0) ? (
                  <div className="text-center py-10 text-gray-400 text-xs">Nenhuma outra despesa identificada nesta planilha.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 animate-fade-in">
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Registros de Custos</span>
                        <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-1">{tempParsedData.newExpenses.length}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-sm flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-wider block">Total Acumulado de Outras Despesas</span>
                        <span className="text-lg font-black font-mono text-red-600 dark:text-red-400 mt-1">
                          R$ {totalExpensesValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 shadow-md">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-slate-950 font-bold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800/80">
                            <th className="p-3">Data</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Descrição</th>
                            <th className="p-3 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = tempParsedData.newExpenses.filter((e: any) => {
                              if (!modalSearchQuery) return true;
                              const query = modalSearchQuery.toLowerCase();
                              const category = (e.category || "").toLowerCase();
                              const desc = (e.description || "").toLowerCase();
                              return category.includes(query) || desc.includes(query);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-gray-400 italic">Nenhuma despesa corresponde à sua busca.</td>
                                </tr>
                              );
                            }

                            return filtered.map((e: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-mono text-gray-500 font-medium">{e.date || "-"}</td>
                                <td className="p-3 font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight text-[10px]">
                                  <span className="bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                                    {e.category}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{e.description}</td>
                                <td className="p-3 text-right font-black text-red-600 dark:text-red-400">
                                  R$ {e.value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "-"}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/40">
            <div className="text-[10px] text-gray-500">
              Total mapeado: <strong className="text-gray-700 dark:text-gray-300">
                {(tempParsedData.newFreights?.length || 0) + (tempParsedData.newDrivers?.length || 0) + (tempParsedData.newVehicles?.length || 0) + (tempParsedData.newRefuels?.length || 0) + (tempParsedData.newExpenses?.length || 0)} registros
              </strong>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 animate-pulse"
              >
                Cancelar e Ajustar
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gravando no ERP...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar e Gravar no Sistema</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
