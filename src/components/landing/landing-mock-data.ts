// Dados meramente ilustrativos exibidos na landing page (não refletem clientes reais).
// Distintos do futuro dataset de demonstração navegável (ver nota em App.tsx / useSimpleRouter).

// Narrativa tipográfica (ScrollStorySection) — Problema → Caos → Fleet One → Controle → Resultados
export const scrollStorySteps = [
  "O problema começa pequeno.",
  "Planilhas. WhatsApp. Papel.",
  "Aos poucos, você perde o controle.",
  "Custos sem explicação.",
  "Informações espalhadas por todo lugar.",
  "Fleet One.",
  "Tudo organizado.",
  "Tudo sob controle.",
  "Resultados de verdade.",
];

// Seção Antes x Depois
export const antesProblemas = [
  { label: "Planilhas soltas", icon: "FileWarning" as const },
  { label: "Combinado pelo WhatsApp", icon: "MessageSquareOff" as const },
  { label: "Sem controle de custos", icon: "TrendingDown" as const },
];

export const depoisStats = {
  trucksActive: 18,
  driversActive: 12,
  billingMonth: 128400,
};

// Seção Benefícios — resultado, não funcionalidade
export const beneficios = [
  { label: "Saiba exatamente quanto custa cada viagem", icon: "DollarSign" as const },
  { label: "Tenha controle total da sua frota", icon: "ShieldCheck" as const },
  { label: "Centralize todas as informações", icon: "Database" as const },
  { label: "Tome decisões baseadas em dados", icon: "BarChart3" as const },
  { label: "Reduza desperdícios", icon: "TrendingDown" as const },
  { label: "Acompanhe toda a operação em tempo real", icon: "Activity" as const },
];

// Seção Números
export const numeros = [
  { value: 500, suffix: "+", label: "Registros organizados por transportadora" },
  { value: 50000, suffix: "+", label: "Quilômetros monitorados" },
  { value: 100, suffix: "%", label: "Controle financeiro em tempo real" },
];
