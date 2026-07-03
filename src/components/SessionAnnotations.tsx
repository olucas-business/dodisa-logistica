import React, { useState, useEffect, useRef } from "react";
import { Camera, Plus, Trash2, X, Image as ImageIcon, Calendar } from "lucide-react";

interface Annotation {
  id: string;
  module: string;
  imageUrl: string;
  note: string;
  date: string;
  createdAt: string;
}

interface SessionAnnotationsProps {
  moduleKey: string;
  title?: string;
}

export default function SessionAnnotations({ moduleKey, title = "Anotações & Prints" }: SessionAnnotationsProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);

  // Preview/confirm modal state
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
      setNote("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCancelPreview = () => {
    setPendingImage(null);
    setPendingFileName("");
    setNote("");
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
        body: JSON.stringify({ module: moduleKey, imageUrl: uploadData.url, note })
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
    const [y, m, d] = dateStr.split("-");
    return y && m && d ? `${d}/${m}/${y}` : dateStr;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-blue-500" />
          {title}
        </h4>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/10"
        >
          <Plus className="w-3.5 h-3.5" />
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
          <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">Envie um print ou foto com observações sobre esta seção.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {annotations.map(a => (
            <button
              key={a.id}
              onClick={() => setViewing(a)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <img src={a.imageUrl} alt={a.note || "Anotação"} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                <span className="text-[9px] text-white font-mono">{formatDate(a.date)}</span>
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
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 h-[220px] flex items-center justify-center">
                <img src={pendingImage} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Anotação / Observação</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Descreva o que essa imagem representa: gasto, comprovante, detalhes..."
                  rows={3}
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
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Enviando..." : "Confirmar"}
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
              <img src={viewing.imageUrl} alt={viewing.note || "Anotação"} className="w-full rounded-xl border border-gray-200 dark:border-slate-800 object-contain max-h-[400px] mx-auto" />
              {viewing.note && <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewing.note}</p>}
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
