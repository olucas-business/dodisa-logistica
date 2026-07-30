// Dados meramente ilustrativos exibidos na landing page (não refletem clientes reais).
// Distintos do futuro dataset de demonstração navegável (ver nota em App.tsx / useSimpleRouter).

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

// Seção Benefícios — resultado, não funcionalidade. Frases curtas de propósito.
export const beneficios = [
  { label: "Quanto custa cada viagem" },
  { label: "Controle total da frota" },
  { label: "Decisões com dados" },
  { label: "Tudo em tempo real" },
];

// Seção Como Funciona — só o passo, sem explicação longa
export const comoFunciona = [
  { step: "01", title: "Cadastre sua frota" },
  { step: "02", title: "Acompanhe em tempo real" },
  { step: "03", title: "Decida com dados" },
  { step: "04", title: "Cresça com controle" },
];

// Seção Números
export const numeros = [
  { value: 500, suffix: "+", label: "Registros organizados por transportadora" },
  { value: 50000, suffix: "+", label: "Quilômetros monitorados" },
  { value: 100, suffix: "%", label: "Controle financeiro em tempo real" },
];
