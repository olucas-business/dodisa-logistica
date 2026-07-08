import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Loader2, 
  ArrowUpRight, 
  Paperclip, 
  Camera, 
  Check, 
  AlertCircle, 
  Edit, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Fuel, 
  Trash2,
  Info
} from "lucide-react";
import { User, Vehicle, Freight, Expense, Driver } from "../types";

interface FloatingAIAssistantProps {
  user: User;
  drivers: Driver[];
  vehicles: Vehicle[];
  freights: Freight[];
  expenses: Expense[];
  onNavigateTo: (tab: string) => void;
  onRefreshData?: () => void;
}

const PRESETS = [
  "Abasteci R$ 1.480 no Posto Pelanda hoje.",
  "Hoje troquei dois pneus dianteiros por R$ 2.350.",
  "Finalizei a viagem com 286.185 km.",
  "Quanto gastei com combustível este mês?"
];

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  image?: string;
  command?: {
    isCommand: boolean;
    commandType: string | null;
    extractedData: {
      category?: string | null;
      value?: number | null;
      date?: string | null;
      time?: string | null;
      vehiclePlate?: string | null;
      vehicleId?: string | null;
      driverName?: string | null;
      driverId?: string | null;
      supplier?: string | null;
      description?: string | null;
      odometer?: number | null;
      location?: string | null;
      freightId?: string | null;
    } | null;
    missingFields: string[];
    ambiguities: string[];
  };
  confirmed?: boolean;
  cancelled?: boolean;
}

export default function FloatingAIAssistant({
  user,
  drivers,
  vehicles,
  freights,
  expenses,
  onNavigateTo,
  onRefreshData
}: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Image attachments state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageMimeType, setAttachedImageMimeType] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeVehicles = vehicles.filter(v => (v as any).status === "Ativo" || (v as any).status === "Disponível").length;
  const activeRoutes = freights.filter(f => f.status === "Em andamento" || (f.status as string) === "Em Trânsito").length;

  const [history, setHistory] = useState<ChatMessage[]>([]);

  // Initialize greeting
  useEffect(() => {
    setHistory([
      {
        role: "assistant",
        text: `Olá, ${user.name}! Sou o seu Assistente Operacional Inteligente. 

Posso registrar ações direto na transportadora, como despesas, abastecimentos, troca de pneus, e início ou encerramento de viagens. Basta falar comigo!

Aqui está o resumo operacional de hoje:
• 🚛 **Fretamento Ativo**: ${activeVehicles} carretas online.
• 📍 **Tráfego**: ${activeRoutes} rotas em andamento.`
      }
    ]);
  }, [user, vehicles, freights]);

  // Scroll to bottom when history changes
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setAttachedImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setAttachedImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAsk = async (text: string) => {
    if (!text.trim() && !attachedImage) return;
    if (loading) return;

    setLoading(true);
    const userMessage: ChatMessage = { 
      role: "user", 
      text: text,
      image: attachedImage || undefined 
    };
    
    setHistory(prev => [...prev, userMessage]);
    setQuery("");
    const imgToSend = attachedImage;
    const imgMimeToSend = attachedImageMimeType;
    removeImage();

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: text,
          user: user,
          image: imgToSend,
          imageMimeType: imgMimeToSend
        })
      });
      const data = await response.json();

      if (data.success) {
        setHistory(prev => [...prev, { 
          role: "assistant", 
          text: data.answer,
          command: data.isCommand ? data : undefined
        }]);
      } else {
        setHistory(prev => [
          ...prev,
          { role: "assistant", text: `Ocorreu uma instabilidade: ${data.message || "Erro desconhecido."}` }
        ]);
      }
    } catch (err) {
      setHistory(prev => [
        ...prev,
        { role: "assistant", text: "Erro de conexão com o Assistente IA." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Execute / save the confirmed command
  const handleConfirmCommand = async (msgIdx: number, commandType: string, extractedData: any, originalImg?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/execute-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandType,
          extractedData,
          image: originalImg,
          user
        })
      });
      const data = await res.json();

      if (data.success) {
        // Update history card status
        setHistory(prev => prev.map((msg, idx) => {
          if (idx === msgIdx) {
            return { ...msg, confirmed: true, cancelled: false };
          }
          return msg;
        }));
        
        // Add success feedback message
        setHistory(prev => [...prev, {
          role: "assistant",
          text: data.message || "Ação gravada com sucesso!"
        }]);

        // Refresh database states across the app
        if (onRefreshData) onRefreshData();
      } else {
        alert("Erro ao gravar: " + data.message);
      }
    } catch (err) {
      alert("Erro ao enviar confirmação para o sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCommand = (msgIdx: number) => {
    setHistory(prev => prev.map((msg, idx) => {
      if (idx === msgIdx) {
        return { ...msg, cancelled: true, confirmed: false };
      }
      return msg;
    }));

    setHistory(prev => [...prev, {
      role: "assistant",
      text: "Operação cancelada pelo usuário."
    }]);
  };

  // Card sub-component for inline editing and confirmation
  const InlineConfirmationCard = ({ msg, msgIdx }: { msg: ChatMessage; msgIdx: number }) => {
    const cmd = msg.command;
    if (!cmd || !cmd.extractedData) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ ...cmd.extractedData });

    const handleFieldChange = (key: string, val: any) => {
      setEditForm(prev => ({ ...prev, [key]: val }));
    };

    if (msg.confirmed) {
      return (
        <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-emerald-400">
          <Check className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Ação salva no banco de dados</span>
        </div>
      );
    }

    if (msg.cancelled) {
      return (
        <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5 text-slate-500">
          <X className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Operação Descartada</span>
        </div>
      );
    }

    return (
      <div className="mt-3 p-4 bg-slate-900 border border-blue-900/40 rounded-xl space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Resumo do Registro Proposto
          </span>
          <span className="text-[9px] bg-blue-900/50 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-800/30">
            {cmd.commandType}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Categoria</label>
              <input 
                type="text" 
                value={editForm.category || ""} 
                onChange={e => handleFieldChange("category", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-400 block mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  value={editForm.value || ""} 
                  onChange={e => handleFieldChange("value", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-400 block mb-1">Quilometragem (Km)</label>
                <input 
                  type="number" 
                  value={editForm.odometer || ""} 
                  onChange={e => handleFieldChange("odometer", parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-400 block mb-1">Veículo Placa</label>
                <select
                  value={editForm.vehicleId || ""}
                  onChange={e => {
                    const selected = vehicles.find(v => v.id === e.target.value);
                    setEditForm(prev => ({
                      ...prev,
                      vehicleId: e.target.value,
                      vehiclePlate: selected ? selected.plate : prev.vehiclePlate
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="">Selecione...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-400 block mb-1">Motorista</label>
                <select
                  value={editForm.driverId || ""}
                  onChange={e => {
                    const selected = drivers.find(d => (d as any).id === e.target.value);
                    setEditForm(prev => ({
                      ...prev,
                      driverId: e.target.value,
                      driverName: selected ? (selected as any).fullName : prev.driverName
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="">Selecione...</option>
                  {vehicles.map(v => {
                    const d = (v as any).driver || {};
                    return d.id ? <option key={d.id} value={d.id}>{d.fullName}</option> : null;
                  })}
                  {/* General drivers fallback if state has them */}
                  {vehicles.length === 0 && <option value="">Sem motoristas elegíveis</option>}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-400 block mb-1">Data</label>
                <input 
                  type="date" 
                  value={editForm.date || ""} 
                  onChange={e => handleFieldChange("date", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-400 block mb-1">Hora</label>
                <input 
                  type="text" 
                  placeholder="HH:MM"
                  value={editForm.time || ""} 
                  onChange={e => handleFieldChange("time", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Fornecedor / Posto</label>
              <input 
                type="text" 
                value={editForm.supplier || ""} 
                onChange={e => handleFieldChange("supplier", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-400 block mb-1">Descrição / Obs</label>
              <textarea 
                value={editForm.description || ""} 
                onChange={e => handleFieldChange("description", e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-xs text-slate-300">
            {editForm.category && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Categoria:</span>
                <span className="font-bold text-slate-200">{editForm.category}</span>
              </div>
            )}
            {editForm.value !== undefined && editForm.value !== null && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Valor:</span>
                <span className="font-bold text-white text-emerald-400">R$ {editForm.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {editForm.vehiclePlate && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Caminhão:</span>
                <span className="font-bold text-slate-200">{editForm.vehiclePlate}</span>
              </div>
            )}
            {editForm.driverName && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Motorista:</span>
                <span className="font-bold text-slate-200">{editForm.driverName}</span>
              </div>
            )}
            {editForm.odometer && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Odômetro:</span>
                <span className="font-bold text-slate-200">{editForm.odometer.toLocaleString("pt-BR")} Km</span>
              </div>
            )}
            {editForm.supplier && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Fornecedor:</span>
                <span className="font-bold text-slate-200">{editForm.supplier}</span>
              </div>
            )}
            {editForm.date && (
              <div className="flex justify-between border-b border-slate-850 py-1">
                <span className="text-slate-500 font-mono text-[10px]">Data / Hora:</span>
                <span className="font-bold text-slate-200">{editForm.date} {editForm.time ? `as ${editForm.time}` : ""}</span>
              </div>
            )}
            {editForm.description && (
              <div className="py-1">
                <span className="text-slate-500 font-mono text-[10px] block mb-0.5">Descrição:</span>
                <span className="text-slate-300 italic text-[11px] leading-snug block bg-slate-950 p-2 rounded border border-slate-850">{editForm.description}</span>
              </div>
            )}
          </div>
        )}

        {/* Buttons Control Panel */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Concluir Edição
            </button>
          ) : (
            <>
              <button
                onClick={() => handleConfirmCommand(msgIdx, cmd.commandType!, editForm, msg.image)}
                disabled={loading}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55"
              >
                <Check className="w-3.5 h-3.5" /> Confirmar
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={loading}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-55"
                title="Editar dados extraídos"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCancelCommand(msgIdx)}
                disabled={loading}
                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-55"
                title="Cancelar operação"
              >
                Descartar
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[9999] font-sans text-left flex flex-col items-end">
      {/* 1. FLOATING ACTION TRIGGER TRIGGER */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-blue-400/20 relative group"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Bot className="w-6 h-6" />
          
          <span className="absolute right-14 bg-slate-950/90 text-white text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Assistente Operacional IA
          </span>
        </button>
      )}

      {/* 2. CHAT DRAWER BOARD */}
      {isOpen && (
        <div className="w-full sm:w-[420px] h-[550px] max-h-[calc(100vh-6rem)] bg-slate-950/95 backdrop-blur-xl border border-slate-850 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-slate-850 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                  Assistente Operacional Inteligente
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                </h3>
                <p className="text-[9px] text-slate-400 font-mono">Carrier Automation & Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History scroll wrapper */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none font-semibold shadow-md"
                      : "bg-slate-900 border border-slate-850 text-slate-200 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.image && (
                    <div className="mb-2 relative rounded-lg overflow-hidden border border-slate-800/85">
                      <img src={msg.image} alt="Anexo de operação" className="max-h-36 object-contain w-full" />
                    </div>
                  )}
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                </div>
                {msg.role === "assistant" && msg.command && (
                  <div className="w-full">
                    <InlineConfirmationCard msg={msg} msgIdx={idx} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-850 text-slate-400 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="font-mono text-[9px] uppercase tracking-wider">Processando cognição operacional...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Presets and Input */}
          <div className="p-4 border-t border-slate-850 bg-slate-900/20 space-y-3">
            {history.length <= 1 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-0.5 px-0.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(p)}
                    disabled={loading}
                    title={p}
                    className="flex-shrink-0 max-w-[180px] px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-[10px] text-slate-300 rounded-full transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span className="truncate">{p}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Attached Image Thumbnail */}
            {attachedImage && (
              <div className="flex items-center justify-between p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <img src={attachedImage} alt="thumbnail" className="w-8 h-8 rounded object-cover" />
                  <span className="text-[10px] text-slate-400 font-mono">Foto anexada pronta para envio</span>
                </div>
                <button onClick={removeImage} className="p-1 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title="Anexar Comprovante ou Foto"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk(query)}
                disabled={loading}
                placeholder="Abasteci R$ 1480 no Posto Pelanda..."
                className="flex-1 bg-slate-900 border border-slate-850 focus:border-blue-500 text-xs text-white px-3 py-2.5 rounded-xl outline-none placeholder-slate-500 transition-all font-sans"
              />

              <button
                onClick={() => handleAsk(query)}
                disabled={loading || (!query.trim() && !attachedImage)}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-40 flex items-center justify-center cursor-pointer shadow-md"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
