import React, { useEffect, useState } from "react";
import { CompanyProfile as CompanyProfileType } from "../types";
import { Building2, FileText, Upload, Save, CheckCircle, Trash2, Download } from "lucide-react";

const EMPTY_COMPANY: CompanyProfileType = {
  name: "",
  cnpj: "",
  stateRegistration: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  email: "",
  contratoSocialUrl: "",
  contratoSocialName: "",
  logoUrl: "",
  taxRate: ""
};

export default function CompanyProfile() {
  const [company, setCompany] = useState<CompanyProfileType>(EMPTY_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/company")
      .then(res => res.json())
      .then(data => {
        if (data.success) setCompany({ ...EMPTY_COMPANY, ...data.company });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof CompanyProfileType, value: string) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Perfil da empresa atualizado com sucesso.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, fileName: file.name, folder: "company" })
        });
        const data = await res.json();
        if (data.success) {
          setCompany(prev => ({ ...prev, contratoSocialUrl: data.url, contratoSocialName: file.name }));
        }
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: reader.result, fileName: file.name, folder: "company-logo" })
        });
        const data = await res.json();
        if (data.success) {
          setCompany(prev => ({ ...prev, logoUrl: data.url }));
        }
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="text-center text-muted-foreground text-sm py-10">Carregando perfil da empresa...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-3">
        <div className="p-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black uppercase text-foreground tracking-wider">Perfil da Empresa</h2>
          <p className="text-xs text-muted-foreground">Dados cadastrais, CNPJ e documentos institucionais da transportadora.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b border-border pb-2.5">
          Logo da Empresa
        </h3>
        <p className="text-[11px] text-muted-foreground -mt-2">
          Usada na barra lateral e na tela de login em vez da marca padrão do Fleet One.
        </p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center flex-shrink-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="Logo da empresa" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {uploadingLogo ? "Enviando..." : company.logoUrl ? "Trocar logo" : "Enviar logo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
            {company.logoUrl && (
              <button
                onClick={() => handleChange("logoUrl", "")}
                className="p-2.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Remover logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b border-border pb-2.5">
          Informações Cadastrais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Razão Social</label>
            <input
              type="text"
              value={company.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Sua Transportadora LTDA"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">CNPJ</label>
            <input
              type="text"
              value={company.cnpj}
              onChange={(e) => handleChange("cnpj", e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Inscrição Estadual</label>
            <input
              type="text"
              value={company.stateRegistration}
              onChange={(e) => handleChange("stateRegistration", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Endereço</label>
            <input
              type="text"
              value={company.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Cidade</label>
            <input
              type="text"
              value={company.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Estado (UF)</label>
            <input
              type="text"
              maxLength={2}
              value={company.state}
              onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Telefone</label>
            <input
              type="text"
              value={company.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">E-mail Corporativo</label>
            <input
              type="email"
              value={company.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="border-b border-border pb-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Configuração Fiscal
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Alíquota de imposto sobre o faturamento — usada no anel "Impostos" do Dashboard/BI (também editável direto no anel).
          </p>
        </div>
        <div className="max-w-xs space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase">Alíquota de Imposto (%)</label>
          <input
            type="number"
            step="0.01"
            placeholder="Ex: 5.16"
            value={company.taxRate || ""}
            onChange={(e) => handleChange("taxRate", e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground border-b border-border pb-2.5">
          Contrato Social
        </h3>
        {company.contratoSocialUrl ? (
          <div className="flex items-center justify-between p-3 bg-muted/40 border border-border rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold truncate">{company.contratoSocialName || "Contrato Social.pdf"}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={company.contratoSocialUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                title="Baixar/Visualizar"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleChange("contratoSocialUrl", "")}
                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors cursor-pointer"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-blue-500/50 transition-colors">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-semibold">
              {uploading ? "Enviando..." : "Clique para enviar o Contrato Social (PDF)"}
            </span>
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}
