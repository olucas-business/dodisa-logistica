// Dados meramente ilustrativos exibidos na landing page (não refletem clientes reais).
// Distintos do futuro dataset de demonstração navegável (ver nota em App.tsx / useSimpleRouter).

export const rastreamentoStops = [
  { id: "sp", label: "São Paulo / SP", lat: -23.55, lng: -46.63 },
  { id: "cur", label: "Curitiba / PR", lat: -25.43, lng: -49.27 },
  { id: "poa", label: "Porto Alegre / RS", lat: -30.03, lng: -51.23 },
];

// Seção Antes x Depois
export const antesProblemas = [
  { label: "Planilhas soltas", icon: "FileWarning" as const },
  { label: "Sem controle de custos", icon: "TrendingDown" as const },
  { label: "Combinado pelo WhatsApp", icon: "MessageSquareOff" as const },
  { label: "Motoristas sem acompanhamento", icon: "UserX" as const },
];

export const depoisStats = {
  trucksActive: 18,
  billingMonth: 128400,
};

// Seção Timeline — jornada completa da operação
export const timelineSteps = [
  { label: "Planejamento", icon: "ClipboardList" as const },
  { label: "Carregamento", icon: "Package" as const },
  { label: "Viagem", icon: "Route" as const },
  { label: "Monitoramento", icon: "Satellite" as const },
  { label: "Abastecimento", icon: "Fuel" as const },
  { label: "Manutenção", icon: "Wrench" as const },
  { label: "Financeiro", icon: "Coins" as const },
  { label: "Entrega", icon: "PackageCheck" as const },
  { label: "Resultados", icon: "TrendingUp" as const },
];

// Seção Módulos do Dashboard
export const combustivelStats = {
  avgKmL: 2.9,
};

export const despesasBreakdown = [
  { categoria: "Combustível", valor: 46870, cor: "#3b82f6" },
  { categoria: "Pedágio", valor: 9820, cor: "#f59e0b" },
  { categoria: "Oficina", valor: 6340, cor: "#8b5cf6" },
  { categoria: "Manutenção", valor: 5210, cor: "#10b981" },
  { categoria: "Pneus", valor: 4180, cor: "#ef4444" },
];

export const motoristasPreview = [
  { id: "1", nome: "Carlos Silva", ativo: true },
  { id: "2", nome: "João Pereira", ativo: true },
];

export const freteExemplo = { cliente: "Distribuidora Alfa", valor: 8200, status: "Pago" as const };

// Seção Benefícios
export const beneficios = [
  { label: "Saiba exatamente onde seu dinheiro está", icon: "DollarSign" as const },
  { label: "Tenha controle total da sua frota", icon: "ShieldCheck" as const },
  { label: "Reduza desperdícios", icon: "TrendingDown" as const },
  { label: "Organize toda sua operação", icon: "LayoutGrid" as const },
  { label: "Acompanhe cada motorista", icon: "Users" as const },
  { label: "Controle combustível em tempo real", icon: "Fuel" as const },
  { label: "Centralize todas as informações", icon: "Database" as const },
];

// Seção Números
export const numeros = [
  { value: 500, suffix: "+", label: "Registros organizados por transportadora" },
  { value: 50000, suffix: "+", label: "Quilômetros monitorados" },
  { value: 100, suffix: "%", label: "Controle financeiro em tempo real" },
];

// Seção Demonstração
export const demoTiles = [
  { label: "Dashboard", icon: "LayoutGrid" as const },
  { label: "Financeiro", icon: "Coins" as const },
  { label: "Combustível", icon: "Fuel" as const },
  { label: "Mapa", icon: "MapPin" as const },
];
