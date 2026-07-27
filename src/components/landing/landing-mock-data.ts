// Dados meramente ilustrativos exibidos na landing page (não refletem clientes reais).
// Distintos do futuro dataset de demonstração navegável (ver nota em App.tsx / useSimpleRouter).

export const operacaoStats = {
  trucksActive: 18,
  driversOnRoute: 12,
  tripsToday: 7,
};

export const rastreamentoStops = [
  { id: "sp", label: "São Paulo / SP", lat: -23.55, lng: -46.63 },
  { id: "cur", label: "Curitiba / PR", lat: -25.43, lng: -49.27 },
  { id: "poa", label: "Porto Alegre / RS", lat: -30.03, lng: -51.23 },
];

export const combustivelStats = {
  avgKmL: 2.9,
  litersMonth: 8420,
  costMonth: 46870,
};

export const combustivelTrend = [
  { mes: "Fev", litros: 7200 },
  { mes: "Mar", litros: 7650 },
  { mes: "Abr", litros: 7980 },
  { mes: "Mai", litros: 8100 },
  { mes: "Jun", litros: 8340 },
  { mes: "Jul", litros: 8420 },
];

export const despesasBreakdown = [
  { categoria: "Combustível", valor: 46870, cor: "#3b82f6" },
  { categoria: "Pedágio", valor: 9820, cor: "#f59e0b" },
  { categoria: "Oficina", valor: 6340, cor: "#8b5cf6" },
  { categoria: "Manutenção", valor: 5210, cor: "#10b981" },
  { categoria: "Pneus", valor: 4180, cor: "#ef4444" },
];

export const despesasStats = {
  tiresChangedMonth: 6,
  nextMaintenanceDays: 12,
};

export const fretesFinanceiro = [
  { id: "1", cliente: "Distribuidora Alfa", valor: 8200, status: "Pago" as const },
  { id: "2", cliente: "Comércio Beta Ltda", valor: 5400, status: "Pendente" as const },
  { id: "3", cliente: "Indústria Gama S/A", valor: 12300, status: "Adiantamento" as const },
  { id: "4", cliente: "Atacado Delta", valor: 3100, status: "Pendente" as const },
];

export const motoristas = [
  { id: "1", nome: "Carlos Silva", viagensMes: 14, comissao: 3200, kmRodados: 9840, ativo: true },
  { id: "2", nome: "João Pereira", viagensMes: 11, comissao: 2650, kmRodados: 8120, ativo: true },
  { id: "3", nome: "Marcos Souza", viagensMes: 9, comissao: 2100, kmRodados: 6890, ativo: false },
];
