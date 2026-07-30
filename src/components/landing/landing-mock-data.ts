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

// Seção Benefícios — resultado, não funcionalidade
export const beneficios = [
  { label: "Saiba exatamente quanto custa cada viagem" },
  { label: "Tenha controle total da sua frota" },
  { label: "Centralize todas as informações" },
  { label: "Tome decisões baseadas em dados" },
  { label: "Reduza desperdícios" },
  { label: "Acompanhe toda a operação em tempo real" },
];

// Seção Como Funciona
export const comoFunciona = [
  {
    step: "01",
    title: "Cadastre sua frota",
    description: "Caminhões, motoristas e rotas — tudo em um só cadastro, em poucos minutos.",
  },
  {
    step: "02",
    title: "Acompanhe em tempo real",
    description: "Fretes, combustível, manutenção e caixa, atualizados conforme a operação acontece.",
  },
  {
    step: "03",
    title: "Decida com dados",
    description: "Relatórios e IA mostram exatamente onde estão os custos e as oportunidades.",
  },
  {
    step: "04",
    title: "Cresça com controle",
    description: "Escale a operação sabendo, a qualquer momento, o que está acontecendo e por quê.",
  },
];

// Seção Números
export const numeros = [
  { value: 500, suffix: "+", label: "Registros organizados por transportadora" },
  { value: 50000, suffix: "+", label: "Quilômetros monitorados" },
  { value: 100, suffix: "%", label: "Controle financeiro em tempo real" },
];
