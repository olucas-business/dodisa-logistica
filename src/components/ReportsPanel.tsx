import { useState } from "react";
import { Freight, Driver, Vehicle, Expense, Refuel } from "../types";
import { FileText, Download, CheckCircle, Search, Filter, Printer, HelpCircle } from "lucide-react";

interface ReportsPanelProps {
  freights: Freight[];
  drivers: Driver[];
  vehicles: Vehicle[];
  expenses: Expense[];
  refuels: Refuel[];
}

export default function ReportsPanel({ freights, drivers, vehicles, expenses, refuels }: ReportsPanelProps) {
  const [reportType, setReportType] = useState<"freights" | "expenses" | "refuels" | "drivers">("freights");
  const [exportFormat, setExportFormat] = useState<"CSV" | "PDF" | "XLSX">("CSV");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-23");
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFile, setExportedFile] = useState<string | null>(null);

  // Helper to filter items based on selected dates
  const isWithinDates = (itemDate: string) => {
    return itemDate >= startDate && itemDate <= endDate;
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportedFile(null);

    // Simulate analytical processing
    setTimeout(() => {
      setIsExporting(false);
      setExportedFile(`Relatorio_${reportType}_${startDate}_a_${endDate}.${exportFormat.toLowerCase()}`);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Preview data based on selection
  const getPreviewData = () => {
    switch (reportType) {
      case "freights":
        return freights.filter(f => isWithinDates(f.date)).slice(0, 5);
      case "expenses":
        return expenses.filter(e => isWithinDates(e.date)).slice(0, 5);
      case "refuels":
        return refuels.filter(r => isWithinDates(r.date)).slice(0, 5);
      case "drivers":
        return drivers.slice(0, 5);
      default:
        return [];
    }
  };

  const previewList = getPreviewData();

  return (
    <div id="modulo-relatorios-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selection Control Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4.5 h-4.5 text-blue-600" />
            Configurar Relatório Corporativo
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Defina os filtros de escoamento e faturamento para extração de dados.</p>
        </div>

        {/* 1. Select Report Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider">Módulo de Dados</label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 hover:border-blue-500 rounded-lg cursor-pointer transition-all text-xs">
              <input
                type="radio"
                name="reportType"
                checked={reportType === "freights"}
                onChange={() => setReportType("freights")}
                className="accent-blue-600"
              />
              <div>
                <p className="font-bold text-gray-900">Manifesto de Fretes e Cargas</p>
                <p className="text-[10px] text-gray-500">Viagens concluídas, rotas e faturamento bruto</p>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 hover:border-blue-500 rounded-lg cursor-pointer transition-all text-xs">
              <input
                type="radio"
                name="reportType"
                checked={reportType === "expenses"}
                onChange={() => setReportType("expenses")}
                className="accent-blue-600"
              />
              <div>
                <p className="font-bold text-gray-900">Despesas e Fluxo de Caixa</p>
                <p className="text-[10px] text-gray-500">Mapeamento de custos em categorias</p>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 hover:border-blue-500 rounded-lg cursor-pointer transition-all text-xs">
              <input
                type="radio"
                name="reportType"
                checked={reportType === "refuels"}
                onChange={() => setReportType("refuels")}
                className="accent-blue-600"
              />
              <div>
                <p className="font-bold text-gray-900">Combustível e Abastecimento</p>
                <p className="text-[10px] text-gray-500">Preços por litro, litros abastecidos e postos</p>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 hover:border-blue-500 rounded-lg cursor-pointer transition-all text-xs">
              <input
                type="radio"
                name="reportType"
                checked={reportType === "drivers"}
                onChange={() => setReportType("drivers")}
                className="accent-blue-600"
              />
              <div>
                <p className="font-bold text-gray-900">Motoristas e Fichas Cadastrais</p>
                <p className="text-[10px] text-gray-500">Contatos, CNHs, admissão e observações</p>
              </div>
            </label>
          </div>
        </div>

        {/* 2. Date ranges */}
        {reportType !== "drivers" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs font-mono outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-mono font-bold text-gray-500">Data de Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs font-mono outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* 3. Export format selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono font-bold text-gray-500 tracking-wider">Formato de Saída</label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "PDF", "XLSX"].map((format) => (
              <button
                key={format}
                onClick={() => setExportFormat(format as any)}
                className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                  exportFormat === format
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                .{format}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Gerando Relatório...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Exportar Dados</span>
            </>
          )}
        </button>

        {exportedFile && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
            <div className="truncate flex-1">
              <p className="font-bold">Arquivo pronto!</p>
              <p className="text-[10px] text-emerald-600 font-mono truncate">{exportedFile}</p>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Preview Area */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pré-visualização do Relatório</h3>
              <p className="text-[10px] text-gray-500">Exibindo primeiras linhas consolidadas do manifesto em formato de auditoria.</p>
            </div>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Relatório
            </button>
          </div>

          {/* Render active reports table */}
          <div className="border border-gray-150 rounded-xl overflow-hidden overflow-x-auto max-h-[280px]">
            {reportType === "freights" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[9px] font-mono border-b border-gray-200">
                  <tr>
                    <th className="p-2 pl-4">Manifesto</th>
                    <th className="p-2">Data</th>
                    <th className="p-2">Rota</th>
                    <th className="p-2">Carga</th>
                    <th className="p-2 text-right pr-4">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {previewList.map((f: any, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 font-sans">
                      <td className="p-2 pl-4 font-mono text-blue-600 font-bold">{f.freightNumber}</td>
                      <td className="p-2 font-mono text-gray-500 text-[10px]">{f.date}</td>
                      <td className="p-2 font-medium">{f.origin.city} → {f.destination.city}</td>
                      <td className="p-2 text-gray-500">{f.cargo.type}</td>
                      <td className="p-2 text-right pr-4 font-bold text-emerald-700 font-mono">R$ {f.financial.value.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "expenses" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[9px] font-mono border-b border-gray-200">
                  <tr>
                    <th className="p-2 pl-4">Data</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2 text-right pr-4">Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {previewList.map((e: any, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 font-sans">
                      <td className="p-2 pl-4 font-mono text-gray-500 text-[10px]">{e.date}</td>
                      <td className="p-2"><span className="px-2 py-0.2 bg-red-100 text-red-800 font-bold rounded text-[9px]">{e.category}</span></td>
                      <td className="p-2 text-gray-500 truncate max-w-xs">{e.description}</td>
                      <td className="p-2 text-right pr-4 font-bold text-red-600 font-mono">R$ {e.value.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "refuels" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[9px] font-mono border-b border-gray-200">
                  <tr>
                    <th className="p-2 pl-4">Data</th>
                    <th className="p-2">Posto</th>
                    <th className="p-2 text-right">Liters</th>
                    <th className="p-2 text-right">Preço Litro</th>
                    <th className="p-2 text-right pr-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {previewList.map((r: any, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 font-sans">
                      <td className="p-2 pl-4 font-mono text-gray-500 text-[10px]">{r.date}</td>
                      <td className="p-2 font-medium">{r.gasStation}</td>
                      <td className="p-2 text-right font-mono font-bold">{r.liters} L</td>
                      <td className="p-2 text-right font-mono text-gray-500">R$ {r.pricePerLiter.toFixed(3)}</td>
                      <td className="p-2 text-right pr-4 font-bold text-red-650 font-mono">R$ {r.totalValue.toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === "drivers" && (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[9px] font-mono border-b border-gray-200">
                  <tr>
                    <th className="p-2 pl-4">Nome</th>
                    <th className="p-2">CPF</th>
                    <th className="p-2">CNH</th>
                    <th className="p-2 font-sans">Cidade</th>
                    <th className="p-2 text-right pr-4">Admissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {previewList.map((d: any, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 font-sans">
                      <td className="p-2 pl-4 font-bold text-gray-900">{d.fullName}</td>
                      <td className="p-2 font-mono text-gray-500 text-[10px]">{d.cpf}</td>
                      <td className="p-2 font-mono"><span className="px-2 py-0.2 bg-blue-100 text-blue-800 font-bold rounded text-[9px]">{d.cnhCategory}</span></td>
                      <td className="p-2 font-medium">{d.city} - {d.state}</td>
                      <td className="p-2 text-right pr-4 font-mono text-gray-500">{d.admissionDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {previewList.length === 0 && (
              <div className="text-center py-10 text-gray-400 italic">
                Nenhum dado registrado para o período filtrado.
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-150 p-3 rounded-lg text-[10px] text-gray-500 font-mono leading-relaxed mt-4 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Observação de Auditoria:</strong> Os relatórios em formato PDF e Excel incluem assinaturas de controle de frota automatizadas e hashes de validação em conformidade com o Fisco de Transportes.
          </span>
        </div>
      </div>
    </div>
  );
}
