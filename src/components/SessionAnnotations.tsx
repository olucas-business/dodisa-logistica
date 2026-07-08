import React, { useState, useEffect, useRef } from "react";
import { Camera, Plus, Trash2, X, Image as ImageIcon, Calendar, Sparkles, AlertTriangle } from "lucide-react";

interface Annotation {
  id: string;
  module: string;
  imageUrl: string;
  note: string;
  description: string;
  value: number;
  category: string;
  date: string;
  createdAt: string;
}

interface SessionAnnotationsProps {
  moduleKey: string;
  title?: string;
}

const CATEGORY_OPTIONS = [
  "Combustível", "Pedágio", "Oficina", "Pneus", "Alimentação", "Hospedagem",
  "Manutenção", "Documentação", "Multas", "Boletos", "Cartão de Crédito", "Seguros", "Outros"
];

export default function SessionAnnotations({ moduleKey, title = "Anotações & Prints" }: SessionAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);

  // Preview/confirm modal state
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [pendingMimeType, setPendingMimeType] = useState("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Outros");
  const [saving, setSaving] = useState(false);

  // AI transcription state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Lightbox for viewing an existing annotation
  const [viewing, setViewing] = useState<Annotation | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAnnotations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/annotations?module=${encodeURIComponent(moduleKey)}`);
      const data = await res.json();
      if (data.success) setAnnotations(data.annotations);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  const runExtraction = async (imageDataUrl: string, mimeType: string) => {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const res = await fetch("/api/annotations/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl, mimeType })
      });
      const data = await res.json();
      if (data.success) {
        const ext = data.extracted;
        setDescription(ext.description || "");
        setValue(ext.value ? String(ext.value) : "");
        setDate(ext.date || "");
        setCategory(CATEGORY_OPTIONS.includes(ext.category) ? ext.category : "Outros");
      } else {
        setAnalysisError(data.message || "Não foi possível transcrever automaticamente. Preencha manualmente.");
      }
    } catch (err) {
      setAnalysisError("Não foi possível transcrever automaticamente. Preencha manualmente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFileName(file.name);
    setPendingMimeType(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingImage(dataUrl);
      setNote("");
      setDescription("");
      setValue("");
      setDate("");
      setCategory("Outros");
      runExtraction(dataUrl, file.type || "image/png");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCancelPreview = () => {
    setPendingImage(null);
    setPendingFileName("");
    setPendingMimeType("");
    setNote("");
    setDescription("");
    setValue("");
    setDate("");
    setCategory("Outros");
    setAnalysisError("");
  };

  const handleConfirmAnnotation = async () => {
    if (!pendingImage) return;
    setSaving(true);
    try {
      const uploadRes = await fetch("/api/upload-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: pendingImage, fileName: pendingFileName, folder: `annotations/${moduleKey}` })
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        alert(uploadData.message || "Erro ao enviar imagem.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleKey, imageUrl: uploadData.url, note, description, value, date, category })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnnotations();
        handleCancelPreview();
      } else {
        alert(data.message || "Erro ao salvar anotação.");
      }
    } catch (err) {
      alert("Erro ao enviar anotação.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(curr => curr === id ? null : curr), 4000);
      return;
    }
    try {
      await fetch(`/api/annotations/${id}`, { method: "DELETE" });
      setAnnotations(prev => prev.filter(a => a.id !== id));
      setViewing(null);
    } catch (err) {
      // silent
    }
    setConfirmDeleteId(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return y && m && d ? `${d}/${m}/${y}` : dateStr;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
          <Camera className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="truncate">{title}</span>
        </h4>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/10 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Adicionar Anotação
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-muted-foreground font-medium">Carregando...</div>
      ) : annotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
          <ImageIcon className="w-7 h-7 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Nenhuma anotação registrada.</p>
          <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">Envie um print ou foto — a IA transcreve e separa as informações automaticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {annotations.map(a => (
            <button
              key={a.id}
              onClick={() => setViewing(a)}
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-blue-500/50 bg-muted/20 transition-all cursor-pointer text-left"
            >
              <img src={a.imageUrl} alt={a.description || "Anotação"} className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{a.description || "Sem descrição"}</p>
                <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground font-mono mt-0.5">
                  {a.value > 0 && <span className="font-bold text-foreground">R$ {a.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                  {a.category && <span className="bg-muted px-1.5 py-0.5 rounded truncate">{a.category}</span>}
                </div>
                <span className="text-[9.5px] text-muted-foreground/70 font-mono">{formatDate(a.date)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* PREVIEW / CONFIRM MODAL */}
      {pendingImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-md border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-xs sm:text-sm font-bold">Confirmar Anotação</h3>
              <button onClick={handleCancelPreview} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 h-[180px] flex items-center justify-center relative">
                <img src={pendingImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span className="text-[11px] font-semibold">Transcrevendo com IA...</span>
                  </div>
                )}
              </div>

              {analysisError && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-[10.5px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{analysisError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wide">Descrição (transcrita pela IA)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Troca de óleo - Posto Ipiranga"
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full min-w-0 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-w-0 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none"
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wide whitespace-nowrap">Observações (opcional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Detalhes complementares que a IA não capturou..."
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={handleCancelPreview}
                disabled={saving}
                className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAnnotation}
                disabled={saving || analyzing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX / VIEW MODAL */}
      {viewing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" onClick={() => setViewing(null)}>
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
              <span className="text-[10.5px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(viewing.date)}
              </span>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex-1 min-h-0 space-y-3">
              <img src={viewing.imageUrl} alt={viewing.description || "Anotação"} className="w-full rounded-xl border border-gray-200 dark:border-slate-800 object-contain max-h-[350px] mx-auto" />

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-150 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-gray-400 dark:text-gray-500 block">Valor</span>
                  <span className="text-sm font-black font-mono text-gray-900 dark:text-gray-100">
                    {viewing.value > 0 ? `R$ ${viewing.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-150 dark:border-slate-800">
                  <span className="text-[9px] uppercase font-mono text-gray-400 dark:text-gray-500 block">Categoria</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{viewing.category || "—"}</span>
                </div>
              </div>

              {viewing.description && (
                <div>
                  <span className="text-[9px] uppercase font-mono text-gray-400 dark:text-gray-500 block mb-0.5">Descrição</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300">{viewing.description}</p>
                </div>
              )}
              {viewing.note && (
                <div>
                  <span className="text-[9px] uppercase font-mono text-gray-400 dark:text-gray-500 block mb-0.5">Observações</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewing.note}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={() => handleDelete(viewing.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  confirmDeleteId === viewing.id
                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse"
                    : "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDeleteId === viewing.id ? "Confirmar exclusão?" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
