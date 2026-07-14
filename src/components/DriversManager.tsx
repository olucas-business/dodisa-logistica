import React, { useState } from "react";
import { Driver, Freight, Refuel } from "../types";
import { todayLocalISO } from "../utils/date";
import SessionAnnotations from "./SessionAnnotations";
import { Users, UserPlus, Phone, Calendar, Search, Award, TrendingUp, AlertTriangle, Trash2, Edit2, CheckCircle, FileText, Share2, Copy, ExternalLink, MessageSquare, Check, Lock, Upload, Download } from "lucide-react";

interface DriversManagerProps {
  drivers: Driver[];
  freights: Freight[];
  refuels: Refuel[];
  onAddDriver: (d: Partial<Driver>) => Promise<boolean>;
  onUpdateDriver: (id: string, d: Partial<Driver>) => Promise<boolean>;
  onDeleteDriver: (id: string) => Promise<boolean>;
  onUpdateFreight?: (id: string, f: Partial<Freight>) => Promise<boolean>;
}

export default function DriversManager({
  drivers,
  freights,
  refuels,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onUpdateFreight
}: DriversManagerProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(drivers[0]?.id || null);
  const selectedDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0] || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Invitation Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [preCreateLogin, setPreCreateLogin] = useState(true);
  const [generatedInvite, setGeneratedInvite] = useState<{
    link: string;
    message: string;
    tempPassword?: string;
  } | null>(null);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      alert("Nome e e-mail são obrigatórios para gerar o convite.");
      return;
    }

    const inviteUrl = `${window.location.origin}/?invite=driver&name=${encodeURIComponent(inviteName)}&email=${encodeURIComponent(inviteEmail)}&phone=${encodeURIComponent(invitePhone)}`;
    
    let tempPass = undefined;
    if (preCreateLogin) {
      tempPass = `moto_${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        fullName: inviteName,
        email: inviteEmail.toLowerCase(),
        phone: invitePhone,
        whatsapp: invitePhone,
        cpf: "A preencher",
        rg: "",
        address: "A preencher",
        city: "A preencher",
        state: "SP",
        cnh: "A preencher",
        cnhCategory: "D",
        cnhExpiration: "2030-12-31",
        admissionDate: todayLocalISO(),
        temporaryPassword: tempPass,
        status: "Ativo"
      };
      await onAddDriver(payload);
    }

    const msgText = `Olá, *${inviteName}*!\n\nVocê foi convidado para se cadastrar como motorista na transportadora. Acesse o link abaixo para concluir seu perfil operante:\n\n🔗 *Cadastrar:* ${inviteUrl}${tempPass ? `\n\nCaso prefira fazer login direto, utilize estas credenciais:\n📧 *Login:* ${inviteEmail.toLowerCase()}\n🔑 *Senha Temporária:* ${tempPass}` : ""}\n\nSeja bem-vindo à nossa frota!`;

    setGeneratedInvite({
      link: inviteUrl,
      message: msgText,
      tempPassword: tempPass
    });
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
    setGeneratedInvite(null);
  };

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [cnh, setCnh] = useState("");
  const [cnhCategory, setCnhCategory] = useState("E");
  const [cnhExpiration, setCnhExpiration] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [observations, setObservations] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [bio, setBio] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setCpf("");
    setRg("");
    setPhone("");
    setWhatsapp("");
    setAddress("");
    setCity("");
    setState("SP");
    setCnh("");
    setCnhCategory("E");
    setCnhExpiration("");
    setAdmissionDate("");
    setObservations("");
    setPhoto("");
    setBio("");
    setBloodType("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setIsEditMode(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setFullName(d.fullName);
    setEmail(d.email || "");
    setCpf(d.cpf);
    setRg(d.rg);
    setPhone(d.phone);
    setWhatsapp(d.whatsapp);
    setAddress(d.address);
    setCity(d.city);
    setState(d.state);
    setCnh(d.cnh);
    setCnhCategory(d.cnhCategory);
    setCnhExpiration(d.cnhExpiration);
    setAdmissionDate(d.admissionDate);
    setObservations(d.observations || "");
    setPhoto(d.photo || "");
    setBio(d.bio || "");
    setBloodType(d.bloodType || "");
    setEmergencyContactName(d.emergencyContactName || "");
    setEmergencyContactPhone(d.emergencyContactPhone || "");
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result, folder: "driver-photos" })
        });
        const data = await res.json();
        if (data.success) setPhoto(data.url);
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDriver) return;
    setDocUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, fileName: file.name, folder: "driver-documents" })
        });
        const data = await res.json();
        if (data.success) {
          const newDoc = { id: `doc_${Date.now()}`, name: file.name, url: data.url, uploadedAt: todayLocalISO() };
          const updatedDocs = [...(selectedDriver.documents || []), newDoc];
          await onUpdateDriver(selectedDriver.id, { documents: updatedDocs });
        }
      } finally {
        setDocUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocDelete = async (docId: string) => {
    if (!selectedDriver) return;
    const updatedDocs = (selectedDriver.documents || []).filter(d => d.id !== docId);
    await onUpdateDriver(selectedDriver.id, { documents: updatedDocs });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !cpf || !cnh || !cnhExpiration || !email) {
      alert("Por favor, preencha os campos obrigatórios (*).");
      return;
    }

    const payload = {
      fullName,
      email: email.toLowerCase(),
      cpf,
      rg,
      phone,
      whatsapp,
      address,
      city,
      state,
      cnh,
      cnhCategory,
      cnhExpiration,
      admissionDate: admissionDate || todayLocalISO(),
      observations,
      photo,
      bio,
      bloodType,
      emergencyContactName,
      emergencyContactPhone
    };

    if (isEditMode && selectedDriver) {
      const ok = await onUpdateDriver(selectedDriver.id, payload);
      if (ok) {
        setIsFormOpen(false);
      }
    } else {
      const ok = await onAddDriver(payload);
      if (ok) {
        setIsFormOpen(false);
      }
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
    const ok = await onDeleteDriver(id);
    if (ok) {
      const remaining = drivers.filter(d => d.id !== id);
      setSelectedDriverId(remaining[0]?.id || null);
    }
    setConfirmDeleteId(null);
  };

  // Calculations for selected driver
  const getDriverStats = (drvId: string) => {
    const driverFreights = freights.filter(f => f.driverId === drvId && f.status === "Finalizado");
    const driverRefuels = refuels.filter(r => r.driverId === drvId);

    const totalVoyages = driverFreights.length;
    const totalKm = driverFreights.reduce((sum, f) => sum + (f.mileage?.total || 0), 0);
    const totalRevenue = driverFreights.reduce((sum, f) => sum + (f.financial.value || 0), 0);

    const totalFuelLiters = driverRefuels.reduce((sum, r) => sum + (r.liters || 0), 0);
    const totalFuelCost = driverRefuels.reduce((sum, r) => sum + (r.totalValue || 0), 0);

    const averageConsumption = totalFuelLiters > 0 && totalKm > 0 ? (totalKm / totalFuelLiters).toFixed(2) : "N/A";

    return {
      totalVoyages,
      totalKm,
      totalRevenue,
      totalFuelLiters,
      totalFuelCost,
      averageConsumption,
      freightHistory: driverFreights
    };
  };

  const getDriverCommissions = (drvId: string) => {
    const driverFreights = freights.filter(f => f.driverId === drvId && f.status !== "Cancelado");
    const rows = driverFreights.map(f => {
      const commission = f.financial?.commission || 0;
      const paid = Math.min(commission, f.financial?.commissionPaid !== undefined ? f.financial.commissionPaid : 0);
      const pending = commission - paid;
      return { freight: f, commission, paid, pending };
    }).sort((a, b) => b.freight.date.localeCompare(a.freight.date));
    const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
    const totalPending = rows.reduce((s, r) => s + r.pending, 0);
    return { rows, totalPaid, totalPending };
  };

  // Pagamento de comissao direto pela ficha do motorista
  const [payingCommissionFreight, setPayingCommissionFreight] = useState<Freight | null>(null);
  const [commissionPayAmount, setCommissionPayAmount] = useState("");
  const [commissionPaySubmitting, setCommissionPaySubmitting] = useState(false);

  const handleOpenPayCommission = (freight: Freight) => {
    setPayingCommissionFreight(freight);
    const commission = freight.financial?.commission || 0;
    const paid = freight.financial?.commissionPaid !== undefined ? freight.financial.commissionPaid : 0;
    setCommissionPayAmount((commission - paid).toFixed(2));
  };

  const handleSubmitCommissionPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCommissionFreight || !onUpdateFreight) return;
    const parsed = Number(commissionPayAmount.replace(",", "."));
    if (!parsed || parsed <= 0) {
      alert("Informe um valor de pagamento válido.");
      return;
    }
    const commission = payingCommissionFreight.financial?.commission || 0;
    const currentPaid = payingCommissionFreight.financial?.commissionPaid !== undefined ? payingCommissionFreight.financial.commissionPaid : 0;
    const newPaid = Math.min(commission, currentPaid + parsed);
    setCommissionPaySubmitting(true);
    const ok = await onUpdateFreight(payingCommissionFreight.id, {
      financial: {
        ...payingCommissionFreight.financial,
        commissionPaid: Number(newPaid.toFixed(2)),
        commissionPending: Number((commission - newPaid).toFixed(2))
      }
    });
    setCommissionPaySubmitting(false);
    if (ok) {
      setPayingCommissionFreight(null);
      setCommissionPayAmount("");
    }
  };

  // Edição direta dos valores de comissão (corrigir total ou valor já pago, sem passar pelo fluxo de "Pagar")
  const [editingCommissionFreight, setEditingCommissionFreight] = useState<Freight | null>(null);
  const [editCommissionTotal, setEditCommissionTotal] = useState("");
  const [editCommissionPaid, setEditCommissionPaid] = useState("");
  const [editCommissionSubmitting, setEditCommissionSubmitting] = useState(false);

  const handleOpenEditCommission = (freight: Freight) => {
    setEditingCommissionFreight(freight);
    setEditCommissionTotal(String(freight.financial?.commission || 0));
    setEditCommissionPaid(String(freight.financial?.commissionPaid !== undefined ? freight.financial.commissionPaid : 0));
  };

  const handleSubmitEditCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommissionFreight || !onUpdateFreight) return;
    const total = Number(editCommissionTotal.replace(",", ".")) || 0;
    const paid = Math.min(total, Number(editCommissionPaid.replace(",", ".")) || 0);
    setEditCommissionSubmitting(true);
    const ok = await onUpdateFreight(editingCommissionFreight.id, {
      financial: {
        ...editingCommissionFreight.financial,
        commission: Number(total.toFixed(2)),
        commissionPaid: Number(paid.toFixed(2)),
        commissionPending: Number((total - paid).toFixed(2))
      }
    });
    setEditCommissionSubmitting(false);
    if (ok) {
      setEditingCommissionFreight(null);
    }
  };

  const filteredDrivers = drivers.filter(d =>
    d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cpf.includes(searchTerm) ||
    d.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = selectedDriver ? getDriverStats(selectedDriver.id) : null;

  return (
    <div id="modulo-motoristas-container" className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs outline-none transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Convidar Motorista (Link)
          </button>
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <UserPlus className="w-4.5 h-4.5" />
            Cadastrar Novo Motorista
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Drivers List */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[550px]">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-xs text-gray-700 uppercase tracking-wider">
            Lista de Motoristas ({filteredDrivers.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredDrivers.map((d) => {
              const isSelected = selectedDriver?.id === d.id;
              // Check if CNH is near expiration
              const expDate = new Date(d.cnhExpiration);
              const curDate = new Date();
              const isNearExp = expDate.getTime() - curDate.getTime() < 30 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDriverId(d.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-all flex justify-between items-center ${
                    isSelected ? "bg-blue-50/60 border-l-4 border-blue-600 pl-3" : ""
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <p className="font-bold text-gray-950 text-xs flex items-center gap-1.5">
                      {d.fullName}
                      {isNearExp && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="CNH Próxima ao Vencimento" />
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">CPF: {d.cpf}</p>
                    <p className="text-[10px] text-gray-500">Cidade: {d.city} - {d.state}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full font-mono text-[9px] font-bold text-gray-600">
                    CNH: {d.cnhCategory}
                  </span>
                </div>
              );
            })}
            {filteredDrivers.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300 animate-pulse" />
                <p className="text-xs">Nenhum motorista encontrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Performance Panel & Driver File */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDriver && stats ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
              {/* Header profile info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center text-blue-600 text-lg font-black font-mono">
                    {selectedDriver.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{selectedDriver.fullName}</h3>
                    <p className="text-xs text-gray-500">Admissão em {selectedDriver.admissionDate}</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenEdit(selectedDriver)}
                    className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar Ficha
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDriver.id)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 ${
                      confirmDeleteId === selectedDriver.id
                        ? "bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white animate-pulse"
                        : "bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDeleteId === selectedDriver.id ? "Confirmar Exclusão?" : "Excluir"}
                  </button>
                </div>
              </div>

              {/* Performance Cards (Bento style) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Faturamento Gerado</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <Search className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Quilometragem Total</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {stats.totalKm.toLocaleString("pt-BR")} KM
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <Award className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Consumo Médio</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {stats.averageConsumption} KM/L
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <Users className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Viagens Realizadas</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    {stats.totalVoyages} Viagens
                  </p>
                </div>
              </div>

              {/* Comissões de Viagens: valores comissionados, pago vs pendente */}
              {(() => {
                const { rows, totalPaid, totalPending } = getDriverCommissions(selectedDriver.id);
                return (
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Comissões de Viagens</h4>
                      <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                        <span className="text-emerald-600">🟢 Pago: R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-orange-600">🟠 Pendente: R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    {rows.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">Nenhuma viagem com comissão lançada para este motorista ainda.</p>
                    )}
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {rows.map(({ freight: f, commission, paid, pending }) => (
                        <div key={f.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-200 bg-white text-xs">
                          <div className="min-w-0">
                            <span className="font-bold text-gray-800 block truncate">{f.freightNumber} · {f.date}</span>
                            <span className="text-[10px] text-gray-500">
                              Comissão: R$ {commission.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${pending <= 0.01 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-orange-50 text-orange-700 border border-orange-200"}`}>
                              {pending <= 0.01 ? "Pago" : `Pendente: R$ ${pending.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                            {onUpdateFreight && (
                              <button
                                onClick={() => handleOpenEditCommission(f)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-[10px] transition-all"
                              >
                                Editar
                              </button>
                            )}
                            {pending > 0.01 && onUpdateFreight && (
                              <button
                                onClick={() => handleOpenPayCommission(f)}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[10px] transition-all"
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Personal Data File */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2">
                  Ficha Cadastral e Dados de Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-gray-500">CPF: <strong className="text-gray-850 font-mono font-normal">{selectedDriver.cpf}</strong></p>
                    <p className="text-gray-500">RG: <strong className="text-gray-850 font-mono font-normal">{selectedDriver.rg || "Não cadastrado"}</strong></p>
                    <p className="text-gray-500">Telefone: <strong className="text-gray-850 font-normal">{selectedDriver.phone}</strong></p>
                    <p className="text-gray-500">WhatsApp: <strong className="text-gray-850 font-normal">{selectedDriver.whatsapp || "Não cadastrado"}</strong></p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-gray-500">Categoria CNH: <strong className="px-2 py-0.2 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">{selectedDriver.cnhCategory}</strong></p>
                    <p className="text-gray-500">Vencimento CNH: <strong className="text-gray-850 font-normal">{selectedDriver.cnhExpiration}</strong></p>
                    <p className="text-gray-500">Endereço: <strong className="text-gray-850 font-normal">{selectedDriver.address}, {selectedDriver.city} - {selectedDriver.state}</strong></p>
                  </div>
                </div>
                {/* Credentials and portal login access block */}
                <div className="border-t border-blue-100 bg-blue-50/40 p-3 rounded-xl border border-blue-250 mt-4 text-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono font-black text-blue-600 block flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      Credenciais de Acesso ao Portal do Motorista
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded uppercase">Acesso Ativo</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <p className="text-gray-600">E-mail de Login: <strong className="text-gray-900 font-mono select-all">{selectedDriver.email || "Não configurado"}</strong></p>
                    <p className="text-gray-600">Senha Temporária: <strong className="text-blue-750 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 select-all">{selectedDriver.temporaryPassword || "moto_1234"}</strong></p>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    * O motorista utilizará este e-mail e senha temporária para acessar o aplicativo móvel do motorista e lançar registros da viagem.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-blue-100/60">
                    <button
                      onClick={() => {
                        const loginUrl = window.location.origin;
                        const text = `Olá, *${selectedDriver.fullName}*!\n\nVocê foi cadastrado como motorista na frota. Aqui estão suas credenciais de acesso ao Portal do Motorista:\n\n🔗 *Acesso:* ${loginUrl}\n📧 *Login:* ${selectedDriver.email}\n🔑 *Senha Temporária:* ${selectedDriver.temporaryPassword || "moto_1234"}\n\nPor favor, faça seu login para começar a gerenciar suas viagens e despesas!`;
                        navigator.clipboard.writeText(text);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copiado!" : "Copiar Dados de Acesso"}
                    </button>
                    {selectedDriver.whatsapp && (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${selectedDriver.whatsapp.replace(/\D/g, "")}&text=${encodeURIComponent(
                          `Olá, *${selectedDriver.fullName}*!\n\nVocê foi cadastrado como motorista na frota. Aqui estão suas credenciais de acesso ao Portal do Motorista:\n\n🔗 *Acesso:* ${window.location.origin}\n📧 *Login:* ${selectedDriver.email}\n🔑 *Senha Temporária:* ${selectedDriver.temporaryPassword || "moto_1234"}\n\nPor favor, faça seu login para começar a gerenciar suas viagens e despesas!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Enviar via WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {selectedDriver.observations && (
                  <div className="border-t border-gray-200 pt-3 text-xs text-gray-500">
                    <p className="font-bold text-gray-750">Observações:</p>
                    <p className="mt-1 font-sans italic">{selectedDriver.observations}</p>
                  </div>
                )}
              </div>

              {/* History of shipments */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Histórico de Fretes do Motorista</h4>
                <div className="border border-gray-150 rounded-xl overflow-x-auto max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-mono border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 pl-4">Número</th>
                        <th className="p-2.5">Data</th>
                        <th className="p-2.5">Rota</th>
                        <th className="p-2.5">Carga</th>
                        <th className="p-2.5 text-right pr-4">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.freightHistory.map((f, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-2.5 pl-4 font-mono font-bold text-blue-600">{f.freightNumber}</td>
                          <td className="p-2.5 text-gray-600">{f.date}</td>
                          <td className="p-2.5 font-medium">{f.origin.city} → {f.destination.city}</td>
                          <td className="p-2.5 text-gray-500">{f.cargo.type}</td>
                          <td className="p-2.5 text-right font-bold pr-4">
                            R$ {f.financial.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                      {stats.freightHistory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400 italic">Nenhum frete concluído por este motorista.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Driver Documents */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Documentos do Motorista</h4>
                  <label className="px-2.5 py-1 bg-gray-900 hover:bg-gray-850 text-white font-mono text-[10px] rounded transition-all flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> {docUploading ? "Enviando..." : "Enviar Documento"}
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleDocUpload} disabled={docUploading} />
                  </label>
                </div>
                <div className="space-y-1.5">
                  {(selectedDriver.documents || []).length === 0 ? (
                    <p className="text-center py-4 text-xs text-gray-400 italic border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                      Nenhum documento anexado (CNH digitalizada, comprovante de residência, etc).
                    </p>
                  ) : (
                    selectedDriver.documents!.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-150 dark:border-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs font-semibold truncate">{doc.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{doc.uploadedAt}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleDocDelete(doc.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-400">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-xs font-semibold">Nenhum motorista selecionado.</p>
              <p className="text-[10px] text-gray-500 mt-1">Crie ou selecione um operador na barra lateral esquerda.</p>
            </div>
          )}
        </div>
      </div>

      <SessionAnnotations moduleKey="drivers" title="Anotações & Prints de Motoristas" />

      {/* CREATE/EDIT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in max-h-[calc(100vh-2rem)] my-auto flex flex-col">
            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0">
              {isEditMode ? "Editar Ficha de Motorista" : "Cadastrar Novo Motorista de Frota"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {photo ? (
                    <img src={photo} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-gray-400">{fullName ? fullName.split(" ").map(n => n[0]).slice(0, 2).join("") : "?"}</span>
                  )}
                </div>
                <label className="px-3 py-2 bg-gray-900 hover:bg-gray-850 text-white font-mono text-[10px] rounded-lg transition-all cursor-pointer">
                  {photoUploading ? "Enviando..." : "Alterar Foto de Perfil"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João da Silva Santos"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">E-mail para Login *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: joao@transportadora.com"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">CPF *</label>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="111.222.333-44"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">RG</label>
                    <input
                      type="text"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      placeholder="12.345.678-9"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Telefone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(81) 99999-9999"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">WhatsApp</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(81) 99999-9999"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Recife"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Estado</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="PE"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Endereço Residencial</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Paulista, 1000 - Apto 50"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Nº da CNH *</label>
                    <input
                      type="text"
                      required
                      value={cnh}
                      onChange={(e) => setCnh(e.target.value)}
                      placeholder="12345678901"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Categoria</label>
                    <select
                      value={cnhCategory}
                      onChange={(e) => setCnhCategory(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-xs outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Vencimento CNH *</label>
                    <input
                      type="date"
                      required
                      value={cnhExpiration}
                      onChange={(e) => setCnhExpiration(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Data Admissão</label>
                    <input
                      type="date"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Tipo Sanguíneo</label>
                  <input
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    placeholder="Ex: O+"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Contato de Emergência</label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Nome do contato"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Telefone de Emergência</label>
                    <input
                      type="text"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Bio / Sobre o Motorista</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Breve apresentação, experiência e especialidades do motorista..."
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none transition-all font-sans resize-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Observações / Restrições Médicas</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Histórico clínico relevante, restrições da CNH, contatos de emergência secundários..."
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2.5 text-xs outline-none transition-all font-sans resize-none"
                  />
                </div>
              </div>

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
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITATION MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 relative animate-scale-in my-auto flex flex-col">
            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-slate-850 pb-3 mb-4 flex-shrink-0 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              Convidar Novo Motorista de Frota
            </h3>

            {!generatedInvite ? (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Insira os dados do motorista para gerar um link exclusivo de cadastro ou para pré-criar o login dele de forma instantânea.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Nome Completo do Motorista *</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="ex: João da Silva Santos"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">E-mail Corporativo / Login *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ex: joao@transportadora.com"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">WhatsApp / Celular (Opcional)</label>
                  <input
                    type="text"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="ex: (81) 99999-9999"
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 rounded-lg p-2 text-xs outline-none transition-all"
                  />
                </div>

                <div className="bg-blue-50/50 dark:bg-slate-950/40 border border-blue-100 dark:border-slate-800/80 rounded-xl p-3 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preCreateLogin}
                      onChange={(e) => setPreCreateLogin(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-250 block">Pré-criar credenciais de login imediatamente</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block leading-tight">
                        Cria a ficha cadastral vazia e o usuário de login no banco de dados agora. O motorista poderá fazer login direto com uma senha temporária gerada.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-gray-150 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                  >
                    Gerar Link de Convite
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-center text-xs text-emerald-800 dark:text-emerald-400 font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Convite Gerado {preCreateLogin && "& Credenciais Pré-Criadas"} com Sucesso!
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider">Link Exclusivo de Cadastro</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInvite.link}
                      className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-800 rounded-lg p-2 text-xs font-mono select-all outline-none text-gray-600 dark:text-gray-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedInvite.link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-gray-500 dark:text-gray-400 tracking-wider font-sans">Texto do Convite (WhatsApp / E-mail)</span>
                  <textarea
                    readOnly
                    value={generatedInvite.message}
                    rows={6}
                    className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-250 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono select-all outline-none text-gray-700 dark:text-gray-350 resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-150 dark:border-slate-800">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInvite.message);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-250 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Texto Copiado!" : "Copiar Texto Completo"}
                  </button>
                  {invitePhone && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${invitePhone.replace(/\D/g, "")}&text=${encodeURIComponent(generatedInvite.message)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 text-center"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Enviar via WhatsApp
                    </a>
                  )}
                  <button
                    onClick={handleCloseInviteModal}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAGAR COMISSÃO DE VIAGEM */}
      {payingCommissionFreight && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-gray-200 shadow-2xl p-4 sm:p-6 relative animate-scale-in my-auto">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Pagar Comissão — {payingCommissionFreight.freightNumber}
            </h3>
            <div className="mb-4 space-y-1">
              <p className="text-lg font-black font-mono text-orange-600">
                R$ {((payingCommissionFreight.financial?.commission || 0) - (payingCommissionFreight.financial?.commissionPaid !== undefined ? payingCommissionFreight.financial.commissionPaid : 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[10px] font-semibold text-gray-400 ml-1">pendente</span>
              </p>
              <p className="text-[10px] font-semibold text-gray-500">
                Comissão total: R$ {(payingCommissionFreight.financial?.commission || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <form onSubmit={handleSubmitCommissionPay} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider">Valor a Pagar (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={commissionPayAmount}
                  onChange={(e) => setCommissionPayAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-2 text-xs outline-none font-mono font-bold"
                />
                <p className="text-[10px] text-gray-400">Pode ser um pagamento parcial ou o valor total pendente.</p>
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => { setPayingCommissionFreight(null); setCommissionPayAmount(""); }}
                  className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={commissionPaySubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDITAR COMISSÃO DE VIAGEM (valor total e valor já pago) */}
      {editingCommissionFreight && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-gray-200 shadow-2xl p-4 sm:p-6 relative animate-scale-in my-auto">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              Editar Comissão — {editingCommissionFreight.freightNumber}
            </h3>
            <form onSubmit={handleSubmitEditCommission} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider whitespace-nowrap">Comissão Total (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={editCommissionTotal}
                    onChange={(e) => setEditCommissionTotal(e.target.value)}
                    className="w-full min-w-0 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-2 text-xs outline-none font-mono font-bold"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider whitespace-nowrap">Já Pago (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={editCommissionPaid}
                    onChange={(e) => setEditCommissionPaid(e.target.value)}
                    className="w-full min-w-0 bg-gray-50 border border-gray-200 text-emerald-600 rounded-lg p-2 text-xs outline-none font-mono font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Corrige diretamente o valor total da comissão e quanto já foi pago, sem depender do fluxo de pagamento.</p>
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setEditingCommissionFreight(null)}
                  className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editCommissionSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
