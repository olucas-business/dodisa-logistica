import React, { useState, useEffect } from "react";
import { CompanyContact } from "../types";
import {
  Contact,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Phone,
  Mail,
  Building2,
  FileText,
  Upload,
  Paperclip,
  StickyNote,
  NotebookPen
} from "lucide-react";

interface ContactsManagerProps {
  contacts: CompanyContact[];
  onAddContact: (payload: Partial<CompanyContact>) => Promise<boolean>;
  onUpdateContact: (id: string, payload: Partial<CompanyContact>) => Promise<boolean>;
  onDeleteContact: (id: string) => Promise<boolean>;
}

export default function ContactsManager({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact
}: ContactsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<{ id: string; name: string; url: string; uploadedAt: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCompany("");
    setRole("");
    setPhone("");
    setEmail("");
    setNotes("");
    setFiles([]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: CompanyContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setCompany(contact.company);
    setRole(contact.role);
    setPhone(contact.phone);
    setEmail(contact.email);
    setNotes(contact.notes || "");
    setFiles(contact.files || []);
    setIsModalOpen(true);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: dataUrl, fileName: file.name, folder: "company-contacts" })
        });
        const data = await res.json();
        if (data.success) {
          setFiles(prev => [...prev, { id: `file_${Date.now()}`, name: file.name, url: data.url, uploadedAt: new Date().toISOString() }]);
        } else {
          alert(data.message || "Erro ao enviar arquivo.");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Erro ao enviar arquivo.");
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Informe ao menos o nome do contato.");
      return;
    }
    const payload: Partial<CompanyContact> = { name, company, role, phone, email, notes, files };
    const ok = editingId
      ? await onUpdateContact(editingId, payload)
      : await onAddContact(payload);
    if (ok) {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(curr => (curr === id ? null : curr)), 4000);
      return;
    }
    await onDeleteContact(id);
    setConfirmDeleteId(null);
  };

  // Bloco de notas do contato: histórico de anotações com upload de arquivo, uma vez que o contato já existe
  const [viewingContactId, setViewingContactId] = useState<string | null>(null);
  const viewingContact = contacts.find(c => c.id === viewingContactId) || null;
  const [notepadText, setNotepadText] = useState("");
  const [notepadFile, setNotepadFile] = useState<{ url: string; name: string } | null>(null);
  const [uploadingNotepadFile, setUploadingNotepadFile] = useState(false);
  const [savingNotepadEntry, setSavingNotepadEntry] = useState(false);

  const handleOpenNotepad = (contact: CompanyContact) => {
    setViewingContactId(contact.id);
    setNotepadText("");
    setNotepadFile(null);
  };

  const handleUploadNotepadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNotepadFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: dataUrl, fileName: file.name, folder: "company-contacts" })
        });
        const data = await res.json();
        if (data.success) {
          setNotepadFile({ url: data.url, name: file.name });
        } else {
          alert(data.message || "Erro ao enviar arquivo.");
        }
        setUploadingNotepadFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Erro ao enviar arquivo.");
      setUploadingNotepadFile(false);
    }
    e.target.value = "";
  };

  const handleAddNotepadEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingContact || (!notepadText.trim() && !notepadFile)) return;
    setSavingNotepadEntry(true);
    const newEntry = {
      id: `note_${Date.now()}`,
      text: notepadText.trim(),
      fileUrl: notepadFile?.url,
      fileName: notepadFile?.name,
      createdAt: new Date().toISOString()
    };
    const updatedEntries = [...(viewingContact.notepadEntries || []), newEntry];
    const ok = await onUpdateContact(viewingContact.id, { notepadEntries: updatedEntries });
    setSavingNotepadEntry(false);
    if (ok) {
      setNotepadText("");
      setNotepadFile(null);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Contact className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Contatos & Anotações</h2>
            <p className="text-xs text-muted-foreground">
              Despachantes, oficinas, fornecedores e parceiros — dados de contato, observações e arquivos anexos.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition-all cursor-pointer uppercase tracking-wider self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Contato
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, empresa ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card border border-border text-foreground focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
        />
      </div>

      {/* Contacts grid */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card/50 rounded-2xl border border-dashed border-border">
          <Contact className="w-10 h-10 text-muted-foreground/40 mb-3 stroke-[1.5]" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum contato cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => handleOpenNotepad(contact)}
              className="bg-card border border-border rounded-2xl p-5 space-y-3 group cursor-pointer hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-foreground truncate">{contact.name}</h3>
                  {contact.role && <p className="text-[11px] text-muted-foreground truncate">{contact.role}</p>}
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(contact); }} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                    className={`p-1.5 rounded-lg transition-all ${confirmDeleteId === contact.id ? "bg-amber-500 text-white" : "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {contact.company && (
                <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{contact.company}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.notes && (
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5">
                  <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-3">{contact.notes}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <NotebookPen className="w-3 h-3" />
                  {(contact.notepadEntries?.length || 0) > 0
                    ? `${contact.notepadEntries!.length} anotação${contact.notepadEntries!.length > 1 ? "ões" : ""}`
                    : "Abrir bloco de notas"}
                </span>
                {contact.files && contact.files.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    <Paperclip className="w-3 h-3" />
                    {contact.files.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-card text-foreground rounded-2xl w-full max-w-md border border-border shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold text-foreground">{editingId ? "Editar Contato" : "Novo Contato"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1 min-h-0">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">Nome *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Despachante"
                  className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">Empresa</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Despachante Aduaneiro"
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">Cargo / Função</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Despachante"
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@email.com"
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">Anotações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observações sobre este contato..."
                  className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider">Arquivos Anexos</label>
                <label className="flex items-center justify-center gap-1.5 bg-muted/30 border border-dashed border-border text-muted-foreground rounded-lg p-2.5 text-[11px] font-semibold cursor-pointer hover:border-blue-500 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? "Enviando..." : "Enviar arquivo"}
                  <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                </label>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {files.map(f => (
                      <div key={f.id} className="flex items-center gap-1 text-[10px] font-semibold text-foreground bg-muted rounded-lg pl-2 pr-1 py-1">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{f.name}</span>
                        <button type="button" onClick={() => handleRemoveFile(f.id)} className="text-muted-foreground hover:text-red-500 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-border flex-shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-all">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all">
                  {editingId ? "Salvar Alterações" : "Adicionar Contato"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOCO DE NOTAS DO CONTATO */}
      {viewingContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-card text-foreground rounded-2xl w-full max-w-xl border border-border shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-4 sm:my-auto flex flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3 mb-4 flex-shrink-0">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                  <NotebookPen className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-foreground truncate">{viewingContact.name}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[viewingContact.company, viewingContact.role].filter(Boolean).join(" · ") || "Bloco de notas"}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingContactId(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {(viewingContact.phone || viewingContact.email) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4 flex-shrink-0">
                {viewingContact.phone && (
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{viewingContact.phone}</span>
                )}
                {viewingContact.email && (
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{viewingContact.email}</span>
                )}
              </div>
            )}

            {/* Nova anotação */}
            <form onSubmit={handleAddNotepadEntry} className="space-y-2 mb-4 flex-shrink-0">
              <textarea
                value={notepadText}
                onChange={(e) => setNotepadText(e.target.value)}
                rows={3}
                placeholder="Escreva uma anotação sobre este contato..."
                className="w-full bg-muted/30 border border-border rounded-lg p-2.5 text-xs outline-none resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <label className="flex items-center gap-1.5 bg-muted/30 border border-dashed border-border text-muted-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-semibold cursor-pointer hover:border-blue-500 transition-all shrink-0">
                    <Upload className="w-3 h-3" />
                    {uploadingNotepadFile ? "Enviando..." : "Anexar arquivo"}
                    <input type="file" className="hidden" onChange={handleUploadNotepadFile} disabled={uploadingNotepadFile} />
                  </label>
                  {notepadFile && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground bg-muted rounded-lg pl-2 pr-1 py-1 truncate">
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{notepadFile.name}</span>
                      <button type="button" onClick={() => setNotepadFile(null)} className="text-muted-foreground hover:text-red-500 p-0.5 shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={savingNotepadEntry || (!notepadText.trim() && !notepadFile)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </form>

            {/* Histórico de anotações */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0 border-t border-border pt-3">
              {(!viewingContact.notepadEntries || viewingContact.notepadEntries.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <StickyNote className="w-7 h-7 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">Nenhuma anotação ainda. Escreva a primeira acima.</p>
                </div>
              ) : (
                [...viewingContact.notepadEntries].reverse().map(entry => (
                  <div key={entry.id} className="p-3 rounded-xl border border-border bg-muted/30 space-y-1.5">
                    {entry.text && <p className="text-xs text-foreground whitespace-pre-wrap">{entry.text}</p>}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(entry.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {entry.fileUrl && (
                        <a
                          href={entry.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg px-2 py-1 transition-all truncate max-w-[160px]"
                        >
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="truncate">{entry.fileName || "Arquivo"}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 mt-2 border-t border-border flex-shrink-0">
              <button
                onClick={() => { setViewingContactId(null); handleOpenEdit(viewingContact); }}
                className="px-4 py-2 bg-card hover:bg-muted border border-border text-foreground font-semibold rounded-lg text-xs transition-all"
              >
                Editar Dados do Contato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
