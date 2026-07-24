import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
// Admin client (service role) for user management and data access, bypassing RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Public client (anon key) for password verification via Supabase Auth
const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Vercel serverless functions run in UTC, so `new Date().toISOString()` can
// already be tomorrow (or, on month-end, next month) from the perspective of
// a user in Brazil (UTC-3). These fallbacks only fire when a request omits
// `date`, but must still resolve to "hoje" in Brazil time, not UTC.
function todayBrazilISO(): string {
  const brazilNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return brazilNow.toISOString().split("T")[0];
}

// Gemini calls with a large response schema can take a very long time to
// "think" through, risking serverless function timeouts. Cap them so we fall
// back to the offline heuristic parser quickly and reliably instead of hanging.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Tempo limite de ${ms}ms excedido na chamada à IA.`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

// The AI occasionally writes the literal words "null"/"undefined"/"n/a" instead
// of an empty string for missing fields. Normalize those to "" recursively.
const PLACEHOLDER_VALUES = new Set(["null", "undefined", "n/a", "none", "não informado", "nao informado"]);
function sanitizePlaceholders(value: any): any {
  if (typeof value === "string") {
    return PLACEHOLDER_VALUES.has(value.trim().toLowerCase()) ? "" : value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizePlaceholders);
  }
  if (value && typeof value === "object") {
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = sanitizePlaceholders(value[key]);
    }
    return result;
  }
  return value;
}

app.use(express.json({ limit: "50mb" }));

// Define basic Database interface
interface Database {
  users: any[];
  company: any;
  drivers: any[];
  vehicles: any[];
  freights: any[];
  refuels: any[];
  expenses: any[];
  tires: any[];
  debts: any[];
  maintenance_logs: any[];
  annotations: any[];
  caixa_caminhao: any[];
  caixa_movimentacoes: any[];
  image_analyses?: any[];
  trip_logs: any[];
  trip_photos: any[];
  notifications: any[];
  expenseCategories?: string[];
  internationalCosts?: any[];
  companyContacts?: any[];
}

const DEFAULT_EXPENSE_CATEGORIES = [
  "Combustível",
  "Pedágio",
  "Oficina",
  "Manutenção",
  "Borracheiro",
  "Pneus",
  "Chapa",
  "Boletos",
  "Multas",
  "Cartão de Crédito",
  "Impostos",
  "Seguros",
  "Outros",
  "Despachante Argentina",
  "Despachante Chile",
  "Pedágio Argentina",
  "Pedágio Chile",
  "Pedágio Brasil",
  "Imigração Argentina",
  "Imigração Chile",
  "Estacionamento Argentina",
  "Estacionamento Chile",
  "Estacionamento Brasil",
  "Óleo Motor",
  "Filtros",
  "Diverso 1",
  "Diverso 2",
  "Assinatura 1",
  "Assinatura 2"
];

// Seed Initial Data
const DEFAULT_DB: Database = {
  image_analyses: [],
  users: [
    {
      id: "usr_1",
      name: "Admin Logística",
      email: "admin@transportadora.com",
      password: "admin123", // For this ERP simplicity, we check plain text
      phone: "(11) 98888-7777",
      role: "Gerente"
    }
  ],
  company: {
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
  },
  drivers: [],
  vehicles: [],
  freights: [],
  refuels: [],
  expenses: [],
  expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
  tires: [],
  debts: [],
  internationalCosts: [],
  companyContacts: [],
  maintenance_logs: [],
  annotations: [],
  caixa_caminhao: [],
  caixa_movimentacoes: [],
  trip_logs: [],
  trip_photos: [],
  notifications: []
};

export const DEPRECATED_DEFAULT_DB: any = {
  drivers: [
    {
      id: "drv_1",
      fullName: "João Silva",
      cpf: "111.222.333-44",
      rg: "12.345.678-9",
      phone: "(81) 99123-4567",
      whatsapp: "(81) 99123-4567",
      address: "Av. Boa Viagem, 100",
      city: "Recife",
      state: "PE",
      cnh: "12345678901",
      cnhCategory: "E",
      cnhExpiration: "2026-07-15", // Expiring soon (Alert!)
      photo: "",
      admissionDate: "2022-03-10",
      observations: "Motorista experiente, especialista em rotas do Nordeste."
    },
    {
      id: "drv_2",
      fullName: "Marcos Oliveira",
      cpf: "222.333.444-55",
      rg: "98.765.432-1",
      phone: "(11) 98111-2222",
      whatsapp: "(11) 98111-2222",
      address: "Rua das Palmeiras, 450",
      city: "São Paulo",
      state: "SP",
      cnh: "98765432100",
      cnhCategory: "D",
      cnhExpiration: "2026-06-28", // Expiring extremely soon! (Critical Alert!)
      photo: "",
      admissionDate: "2023-01-15",
      observations: "Opera principalmente a rota SP -> RJ."
    },
    {
      id: "drv_3",
      fullName: "Pedro Santos",
      cpf: "333.444.555-66",
      rg: "45.678.901-2",
      phone: "(31) 98222-3333",
      whatsapp: "(31) 98222-3333",
      address: "Av. do Contorno, 1200",
      city: "Belo Horizonte",
      state: "MG",
      cnh: "56789012345",
      cnhCategory: "E",
      cnhExpiration: "2027-11-20",
      photo: "",
      admissionDate: "2021-06-01",
      observations: "Excelente histórico de condução econômica."
    },
    {
      id: "drv_4",
      fullName: "Ana Souza",
      cpf: "444.555.666-77",
      rg: "23.456.789-0",
      phone: "(21) 98333-4444",
      whatsapp: "(21) 98333-4444",
      address: "Rua Copacabana, 88",
      city: "Rio de Janeiro",
      state: "RJ",
      cnh: "34567890123",
      cnhCategory: "C",
      cnhExpiration: "2026-10-05", // Expiring in a few months
      photo: "",
      admissionDate: "2024-02-18",
      observations: "Realiza rotas curtas de distribuição urbana e intermunicipal."
    }
  ],
  vehicles: [
    {
      id: "vhc_1",
      plate: "ABC-1234",
      model: "FH 540",
      brand: "Volvo",
      year: "2022",
      type: "Carreta",
      loadCapacity: "40.000 kg",
      tankCapacity: "800",
      averageConsumption: "2.5",
      renavam: "12345678901",
      chassi: "9BR12345678901234",
      licensingExpiration: "2026-09-30",
      photo: "",
      currentMileage: 124200,
      nextMaintenance: 125000, // Near Maintenance (Alert!)
      maintenanceHistory: [
        { date: "2026-04-10", km: 115000, type: "Oficina", description: "Troca de óleo e filtros", value: 1500 },
        { date: "2026-05-15", km: 120000, type: "Pneus", description: "Alinhamento e balanceamento", value: 800 }
      ]
    },
    {
      id: "vhc_2",
      plate: "XYZ-5678",
      model: "R 450",
      brand: "Scania",
      year: "2023",
      type: "Carreta",
      loadCapacity: "38.500 kg",
      tankCapacity: "750",
      averageConsumption: "2.7",
      renavam: "98765432109",
      chassi: "9BR98765432109876",
      licensingExpiration: "2026-06-25", // Expiring in 2 days! (Critical Alert!)
      photo: "",
      currentMileage: 89100,
      nextMaintenance: 95000,
      maintenanceHistory: [
        { date: "2026-03-20", km: 78000, type: "Oficina", description: "Revisão de freios", value: 2100 }
      ]
    },
    {
      id: "vhc_3",
      plate: "MNO-9012",
      model: "Actros 2651",
      brand: "Mercedes-Benz",
      year: "2021",
      type: "Truck",
      loadCapacity: "25.000 kg",
      tankCapacity: "600",
      averageConsumption: "3.2",
      renavam: "45678901234",
      chassi: "9BR45678901234567",
      licensingExpiration: "2026-11-15",
      photo: "",
      currentMileage: 156000,
      nextMaintenance: 160000,
      maintenanceHistory: [
        { date: "2026-05-02", km: 150000, type: "Pneus", description: "Troca de 2 pneus dianteiros", value: 3800 }
      ]
    },
    {
      id: "vhc_4",
      plate: "DEF-3456",
      model: "Cargo 1119",
      brand: "Ford",
      year: "2020",
      type: "ToCo",
      loadCapacity: "7.500 kg",
      tankCapacity: "250",
      averageConsumption: "5.5",
      renavam: "23456789012",
      chassi: "9BR23456789012345",
      licensingExpiration: "2026-08-20",
      photo: "",
      currentMileage: 41200,
      nextMaintenance: 45000,
      maintenanceHistory: []
    }
  ],
  freights: [
    {
      id: "frt_1",
      freightNumber: "FRT-1001",
      date: "2026-06-23", // Today
      departureTime: "06:00",
      arrivalTime: "14:30",
      status: "Finalizado",
      driverId: "drv_1",
      vehicleId: "vhc_1",
      origin: {
        city: "Recife",
        state: "PE",
        address: "Cais do Porto, s/n",
        company: "Porto de Recife Logística"
      },
      destination: {
        city: "Maceió",
        state: "AL",
        address: "Av. Industrial, 500",
        company: "Distribuidora Alagoana S/A"
      },
      cargo: {
        type: "Alimentos",
        description: "Carga de açúcar ensacado",
        qty: 35,
        unit: "Toneladas"
      },
      financial: {
        value: 7500,
        commission: 750,
        toll: 150,
        food: 120,
        lodging: 0,
        otherExpenses: 50
      },
      mileage: {
        start: 123650,
        end: 123910,
        total: 260
      }
    },
    {
      id: "frt_2",
      freightNumber: "FRT-1002",
      date: "2026-06-23", // Today
      departureTime: "08:15",
      arrivalTime: "19:45",
      status: "Em andamento",
      driverId: "drv_2",
      vehicleId: "vhc_2",
      origin: {
        city: "São Paulo",
        state: "SP",
        address: "Rodovia Pres. Dutra, KM 10",
        company: "Metalúrgica Paulista"
      },
      destination: {
        city: "Rio de Janeiro",
        state: "RJ",
        address: "Zona Portuária, Galpão 4",
        company: "Construtora Carioca S/A"
      },
      cargo: {
        type: "Metalurgia",
        description: "Tubos de aço carbono",
        qty: 28,
        unit: "Toneladas"
      },
      financial: {
        value: 12000,
        commission: 1200,
        toll: 380,
        food: 150,
        lodging: 200,
        otherExpenses: 100
      },
      mileage: {
        start: 88650,
        end: 89080,
        total: 430
      }
    },
    {
      id: "frt_3",
      freightNumber: "FRT-1003",
      date: "2026-06-20", // This week
      departureTime: "05:00",
      arrivalTime: "16:00",
      status: "Finalizado",
      driverId: "drv_3",
      vehicleId: "vhc_3",
      origin: {
        city: "Belo Horizonte",
        state: "MG",
        address: "Via Expressa de Contagem",
        company: "Siderúrgica Mineira"
      },
      destination: {
        city: "Brasília",
        state: "DF",
        address: "Setor de Cargas Norte",
        company: "Atacadão Brasília"
      },
      cargo: {
        type: "Grãos",
        description: "Sacos de café premium",
        qty: 22,
        unit: "Toneladas"
      },
      financial: {
        value: 14500,
        commission: 1450,
        toll: 250,
        food: 180,
        lodging: 150,
        otherExpenses: 0
      },
      mileage: {
        start: 154800,
        end: 155550,
        total: 750
      }
    },
    {
      id: "frt_4",
      freightNumber: "FRT-1004",
      date: "2026-06-18", // This week
      departureTime: "13:00",
      arrivalTime: "15:30",
      status: "Finalizado",
      driverId: "drv_4",
      vehicleId: "vhc_4",
      origin: {
        city: "Niterói",
        state: "RJ",
        address: "Rua do Porto, 200",
        company: "Bebidas Rio"
      },
      destination: {
        city: "Petrópolis",
        state: "RJ",
        address: "Av. de Petrópolis, 45",
        company: "Depósito Imperial"
      },
      cargo: {
        type: "Bebidas",
        description: "Engradados de cerveja e refrigerante",
        qty: 1200,
        unit: "Caixas"
      },
      financial: {
        value: 3800,
        commission: 380,
        toll: 65,
        food: 80,
        lodging: 0,
        otherExpenses: 20
      },
      mileage: {
        start: 40850,
        end: 40940,
        total: 90
      }
    },
    {
      id: "frt_5",
      freightNumber: "FRT-1005",
      date: "2026-06-15", // This month
      departureTime: "07:00",
      arrivalTime: "15:00",
      status: "Finalizado",
      driverId: "drv_1",
      vehicleId: "vhc_1",
      origin: {
        city: "Recife",
        state: "PE",
        address: "Cais do Porto, s/n",
        company: "Porto de Recife Logística"
      },
      destination: {
        city: "João Pessoa",
        state: "PB",
        address: "Distrito Industrial, Lote 4",
        company: "Fábrica de Plásticos Paraíba"
      },
      cargo: {
        type: "Matéria Prima",
        description: "Resina plástica pet",
        qty: 32,
        unit: "Toneladas"
      },
      financial: {
        value: 4800,
        commission: 480,
        toll: 45,
        food: 100,
        lodging: 0,
        otherExpenses: 0
      },
      mileage: {
        start: 123350,
        end: 123475,
        total: 125
      }
    },
    {
      id: "frt_6",
      freightNumber: "FRT-1006",
      date: "2026-06-10", // This month
      departureTime: "04:30",
      arrivalTime: "18:00",
      status: "Finalizado",
      driverId: "drv_2",
      vehicleId: "vhc_2",
      origin: {
        city: "Campinas",
        state: "SP",
        address: "Polo Industrial Norte",
        company: "AutoParts Brasil"
      },
      destination: {
        city: "Belo Horizonte",
        state: "MG",
        address: "Anel Rodoviário, KM 15",
        company: "Montadora Mineira S/A"
      },
      cargo: {
        type: "Autopeças",
        description: "Motores e eixos de transmissão",
        qty: 30,
        unit: "Paletes"
      },
      financial: {
        value: 15500,
        commission: 1550,
        toll: 340,
        food: 160,
        lodging: 150,
        otherExpenses: 50
      },
      mileage: {
        start: 87800,
        end: 88390,
        total: 590
      }
    },
    {
      id: "frt_7",
      freightNumber: "FRT-1007",
      date: "2026-05-20", // Past month
      departureTime: "06:00",
      arrivalTime: "19:00",
      status: "Finalizado",
      driverId: "drv_3",
      vehicleId: "vhc_3",
      origin: {
        city: "Belo Horizonte",
        state: "MG",
        address: "Anel Rodoviário, KM 5",
        company: "Indústria de Laticínios"
      },
      destination: {
        city: "São Paulo",
        state: "SP",
        address: "Ceagesp, Portão 3",
        company: "Laticínios Central SP"
      },
      cargo: {
        type: "Perecíveis",
        description: "Queijos e manteigas",
        qty: 18,
        unit: "Toneladas"
      },
      financial: {
        value: 9800,
        commission: 980,
        toll: 280,
        food: 120,
        lodging: 0,
        otherExpenses: 100
      },
      mileage: {
        start: 153800,
        end: 154390,
        total: 590
      }
    },
    {
      id: "frt_8",
      freightNumber: "FRT-1008",
      date: "2026-05-15", // Past month
      departureTime: "08:00",
      arrivalTime: "12:00",
      status: "Finalizado",
      driverId: "drv_4",
      vehicleId: "vhc_4",
      origin: {
        city: "Rio de Janeiro",
        state: "RJ",
        address: "Zona Norte, Galpão 2",
        company: "Supermercados Cariocas"
      },
      destination: {
        city: "Duque de Caxias",
        state: "RJ",
        address: "Rodovia Washington Luiz",
        company: "CD Logístico Caxias"
      },
      cargo: {
        type: "Alimentos",
        description: "Fardos de arroz e feijão",
        qty: 8,
        unit: "Toneladas"
      },
      financial: {
        value: 2500,
        commission: 250,
        toll: 15,
        food: 50,
        lodging: 0,
        otherExpenses: 0
      },
      mileage: {
        start: 40750,
        end: 40795,
        total: 45
      }
    }
  ],
  refuels: [
    {
      id: "ref_1",
      date: "2026-06-23",
      driverId: "drv_1",
      vehicleId: "vhc_1",
      gasStation: "Posto Petrobras Nordeste",
      city: "Recife",
      liters: 104,
      pricePerLiter: 5.85,
      totalValue: 608.4
    },
    {
      id: "ref_2",
      date: "2026-06-23",
      driverId: "drv_2",
      vehicleId: "vhc_2",
      gasStation: "Posto Ipiranga Dutra",
      city: "Resende",
      liters: 160,
      pricePerLiter: 5.92,
      totalValue: 947.2
    },
    {
      id: "ref_3",
      date: "2026-06-20",
      driverId: "drv_3",
      vehicleId: "vhc_3",
      gasStation: "Posto Shell Mineiro",
      city: "Belo Horizonte",
      liters: 235,
      pricePerLiter: 5.78,
      totalValue: 1358.3
    },
    {
      id: "ref_4",
      date: "2026-06-18",
      driverId: "drv_4",
      vehicleId: "vhc_4",
      gasStation: "Posto Ale Serrano",
      city: "Petrópolis",
      liters: 17,
      pricePerLiter: 5.99,
      totalValue: 101.83
    }
  ],
  expenses: [
    {
      id: "exp_1",
      date: "2026-06-23",
      category: "Combustível",
      value: 608.4,
      description: "Abastecimento Volvo FH 540 - ABC-1234",
      receipt: ""
    },
    {
      id: "exp_2",
      date: "2026-06-23",
      category: "Combustível",
      value: 947.2,
      description: "Abastecimento Scania R 450 - XYZ-5678",
      receipt: ""
    },
    {
      id: "exp_3",
      date: "2026-06-20",
      category: "Combustível",
      value: 1358.3,
      description: "Abastecimento MB Actros - MNO-9012",
      receipt: ""
    },
    {
      id: "exp_4",
      date: "2026-06-18",
      category: "Combustível",
      value: 101.83,
      description: "Abastecimento Ford Cargo - DEF-3456",
      receipt: ""
    },
    {
      id: "exp_5",
      date: "2026-06-10",
      category: "Oficina",
      value: 1500,
      description: "Revisão e troca de óleo Volvo FH 540 - ABC-1234",
      receipt: ""
    },
    {
      id: "exp_6",
      date: "2026-06-12",
      category: "Pneus",
      value: 3200,
      description: "Compra de 1 pneu novo para Scania XYZ-5678",
      receipt: ""
    },
    {
      id: "exp_7",
      date: "2026-06-15",
      category: "Pedágio",
      value: 340,
      description: "Despesa pedágio viagem SP -> BH",
      receipt: ""
    },
    {
      id: "exp_8",
      date: "2026-06-15",
      category: "Hospedagem",
      value: 150,
      description: "Hospedagem do motorista Marcos Oliveira em viagem",
      receipt: ""
    },
    {
      id: "exp_9",
      date: "2026-06-15",
      category: "Alimentação",
      value: 160,
      description: "Refeições viagem SP -> BH Marcos",
      receipt: ""
    },
    {
      id: "exp_10",
      date: "2026-06-05",
      category: "Seguro",
      value: 4500,
      description: "Mensalidade do seguro de frota completa",
      receipt: ""
    }
  ],
  tires: [
    {
      id: "tir_1",
      serialNumber: "DOT-MICH-2024-01",
      brand: "Michelin",
      model: "X Multi T2",
      size: "295/80 R22.5",
      status: "Em uso",
      vehicleId: "vhc_1",
      position: "Dianteiro Esquerdo",
      currentMileage: 45000,
      estimatedLife: 120000,
      changesHistory: [
        {
          id: "ch_1",
          date: "2025-01-15",
          type: "Instalação",
          km: 80000,
          vehicleId: "vhc_1",
          position: "Dianteiro Esquerdo",
          description: "Instalação inicial de pneu novo Michelin."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_2",
      serialNumber: "DOT-MICH-2024-02",
      brand: "Michelin",
      model: "X Multi T2",
      size: "295/80 R22.5",
      status: "Em uso",
      vehicleId: "vhc_1",
      position: "Dianteiro Direito",
      currentMileage: 45000,
      estimatedLife: 120000,
      changesHistory: [
        {
          id: "ch_2",
          date: "2025-01-15",
          type: "Instalação",
          km: 80000,
          vehicleId: "vhc_1",
          position: "Dianteiro Direito",
          description: "Instalação inicial de pneu novo Michelin."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_3",
      serialNumber: "DOT-GOOD-2025-05",
      brand: "Goodyear",
      model: "KMax S Gen2",
      size: "295/80 R22.5",
      status: "Em uso",
      vehicleId: "vhc_2",
      position: "Dianteiro Esquerdo",
      currentMileage: 18000,
      estimatedLife: 100000,
      changesHistory: [
        {
          id: "ch_3",
          date: "2026-02-10",
          type: "Instalação",
          km: 71100,
          vehicleId: "vhc_2",
          position: "Dianteiro Esquerdo",
          description: "Troca do pneu dianteiro esquerdo por Goodyear novo."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_4",
      serialNumber: "DOT-GOOD-2025-06",
      brand: "Goodyear",
      model: "KMax S Gen2",
      size: "295/80 R22.5",
      status: "Em uso",
      vehicleId: "vhc_2",
      position: "Dianteiro Direito",
      currentMileage: 18000,
      estimatedLife: 100000,
      changesHistory: [
        {
          id: "ch_4",
          date: "2026-02-10",
          type: "Instalação",
          km: 71100,
          vehicleId: "vhc_2",
          position: "Dianteiro Direito",
          description: "Troca do pneu dianteiro direito por Goodyear novo."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_5",
      serialNumber: "DOT-BRID-2023-11",
      brand: "Bridgestone",
      model: "R268 Ecopia",
      size: "275/80 R22.5",
      status: "Estoque",
      currentMileage: 62000,
      estimatedLife: 110000,
      changesHistory: [
        {
          id: "ch_5",
          date: "2026-05-10",
          type: "Remoção",
          km: 150000,
          vehicleId: "vhc_3",
          position: "Traseiro Esquerdo",
          description: "Pneu removido com 62.000km rodados para rotação de estoque."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_6",
      serialNumber: "DOT-PIRE-2025-09",
      brand: "Pirelli",
      model: "FR:01",
      size: "295/80 R22.5",
      status: "Estoque",
      currentMileage: 0,
      estimatedLife: 95000,
      changesHistory: [
        {
          id: "ch_6",
          date: "2026-06-01",
          type: "Instalação",
          km: 0,
          description: "Aquisição de pneu Pirelli novo, mantido em estoque de segurança."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_7",
      serialNumber: "DOT-MICH-2023-45",
      brand: "Michelin",
      model: "X Multi D",
      size: "295/80 R22.5",
      status: "Recapagem",
      currentMileage: 105000,
      estimatedLife: 140000,
      changesHistory: [
        {
          id: "ch_7",
          date: "2026-06-12",
          type: "Recapagem",
          km: 124200,
          vehicleId: "vhc_1",
          description: "Enviado para recapagem de banda de rodagem devido a desgaste uniforme."
        }
      ],
      rotationsHistory: []
    },
    {
      id: "tir_8",
      serialNumber: "DOT-CHIN-2022-12",
      brand: "Linglong",
      model: "KTA12",
      size: "295/80 R22.5",
      status: "Descartado",
      currentMileage: 85000,
      estimatedLife: 80000,
      changesHistory: [
        {
          id: "ch_8",
          date: "2026-04-18",
          type: "Descarte",
          km: 112000,
          vehicleId: "vhc_3",
          description: "Descartado por desgaste excessivo e danos na carcaça lateral."
        }
      ],
      rotationsHistory: []
    }
  ],
  debts: [
    {
      id: "debt_1",
      description: "Manutenção Preventiva Turbina Volvo FH 540",
      category: "Oficina",
      value: 4500,
      dueDate: "2026-07-10",
      status: "Quitar Primeiro",
      notes: "Peças importadas já compradas. Serviço prioritário para evitar quebra em rota.",
      createdAt: "2026-06-15"
    },
    {
      id: "debt_2",
      description: "Pneus Novos Michelin 295/80 R22.5 (Par)",
      category: "Pneus",
      value: 3600,
      dueDate: "2026-07-15",
      status: "Quitar Primeiro",
      notes: "Substituição emergencial necessária para o veículo ABC-1234.",
      createdAt: "2026-06-20"
    },
    {
      id: "debt_3",
      description: "Licenciamento Anual Scania XYZ-5678",
      category: "Impostos",
      value: 1250,
      dueDate: "2026-06-25",
      status: "Pago",
      notes: "Pago via internet banking.",
      createdAt: "2026-06-10"
    },
    {
      id: "debt_4",
      description: "Combustível Posto Ipiranga Rota Nordeste",
      category: "Combustível",
      value: 12400,
      dueDate: "2026-07-20",
      status: "Falta Pagar",
      notes: "Faturamento quinzenal de óleo diesel.",
      createdAt: "2026-06-25"
    },
    {
      id: "debt_5",
      description: "Seguro de Cargas Porto Seguro (Parcela 04/12)",
      category: "Seguro",
      value: 2800,
      dueDate: "2026-07-05",
      status: "Falta Pagar",
      notes: "Débito automático programado.",
      createdAt: "2026-06-01"
    },
    {
      id: "debt_6",
      description: "Salários de Motoristas e Equipe de Apoio",
      category: "Salários",
      value: 18500,
      dueDate: "2026-07-05",
      status: "Quitar Primeiro",
      notes: "Folha de pagamento mensal operacional. Prioridade máxima.",
      createdAt: "2026-06-28"
    }
  ],
  caixa_caminhao: [
    {
      id: "caixa_1",
      veiculo_id: "vhc_1",
      saldo_inicial: 20000.00,
      saldo_atual: 16750.00,
      observacao: "Fundo rotativo para viagens do Volvo FH 540",
      created_at: "2026-06-25",
      updated_at: "2026-06-30"
    },
    {
      id: "caixa_2",
      veiculo_id: "vhc_2",
      saldo_inicial: 15000.00,
      saldo_atual: 14500.00,
      observacao: "Verba operacional padrão do Scania R450",
      created_at: "2026-06-25",
      updated_at: "2026-06-30"
    },
    {
      id: "caixa_3",
      veiculo_id: "vhc_3",
      saldo_inicial: 10000.00,
      saldo_atual: 450.00,
      observacao: "Verba para pequenas rotas locais",
      created_at: "2026-06-25",
      updated_at: "2026-06-30"
    },
    {
      id: "caixa_4",
      veiculo_id: "vhc_4",
      saldo_inicial: 5000.00,
      saldo_atual: -120.00,
      observacao: "Caixa reserva Mercedes-Benz Accelo",
      created_at: "2026-06-25",
      updated_at: "2026-06-30"
    }
  ],
  caixa_movimentacoes: [
    {
      id: "mov_1",
      caixa_id: "caixa_1",
      categoria: "Pneus",
      valor: 2000.00,
      descricao: "Troca de dois pneus dianteiros.",
      data: "2026-06-30",
      created_at: "2026-06-30T14:32:00Z",
      updated_at: "2026-06-30T14:32:00Z"
    },
    {
      id: "mov_2",
      caixa_id: "caixa_1",
      categoria: "Pedágio",
      valor: 350.00,
      descricao: "BR-116.",
      data: "2026-06-30",
      created_at: "2026-06-30T16:10:00Z",
      updated_at: "2026-06-30T16:10:00Z"
    },
    {
      id: "mov_3",
      caixa_id: "caixa_1",
      categoria: "Alimentação",
      valor: 120.00,
      descricao: "Almoço motorista.",
      data: "2026-06-29",
      created_at: "2026-06-29T12:00:00Z",
      updated_at: "2026-06-29T12:00:00Z"
    },
    {
      id: "mov_4",
      caixa_id: "caixa_1",
      categoria: "Combustível",
      valor: 780.00,
      descricao: "Abastecimento Diesel S10",
      data: "2026-06-29",
      created_at: "2026-06-29T15:30:00Z",
      updated_at: "2026-06-29T15:30:00Z"
    },
    {
      id: "mov_5",
      caixa_id: "caixa_2",
      categoria: "Lavagem",
      valor: 500.00,
      descricao: "Lavagem completa e higienização interna",
      data: "2026-06-28",
      created_at: "2026-06-28T09:00:00Z",
      updated_at: "2026-06-28T09:00:00Z"
    },
    {
      id: "mov_6",
      caixa_id: "caixa_3",
      categoria: "Manutenção",
      valor: 9550.00,
      descricao: "Conserto do alternador e troca de óleo",
      data: "2026-06-27",
      created_at: "2026-06-27T10:00:00Z",
      updated_at: "2026-06-27T10:00:00Z"
    },
    {
      id: "mov_7",
      caixa_id: "caixa_4",
      categoria: "Pedágio",
      valor: 120.00,
      descricao: "Pedágios da viagem local",
      data: "2026-06-30",
      created_at: "2026-06-30T08:00:00Z",
      updated_at: "2026-06-30T08:00:00Z"
    },
    {
      id: "mov_8",
      caixa_id: "caixa_4",
      categoria: "Oficina",
      valor: 5000.00,
      descricao: "Serviço de suspensão",
      data: "2026-06-29",
      created_at: "2026-06-29T14:00:00Z",
      updated_at: "2026-06-29T14:00:00Z"
    }
  ]
};

async function loadDB(): Promise<Database> {
  try {
    const { data: row, error } = await supabase
      .from("app_state")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      await supabase.from("app_state").insert({ id: 1, data: DEFAULT_DB });
      return DEFAULT_DB;
    }
    const db = row.data as Database;
    let modified = false;
    if (!db.company) {
      db.company = DEFAULT_DB.company;
      modified = true;
    }
    if (!db.tires) {
      db.tires = DEFAULT_DB.tires || [];
      modified = true;
    }
    if (!db.debts) {
      db.debts = DEFAULT_DB.debts || [];
      modified = true;
    }
    if (!db.maintenance_logs) {
      db.maintenance_logs = [];
      modified = true;
    }
    if (!db.annotations) {
      db.annotations = [];
      modified = true;
    }
    if (!db.internationalCosts) {
      db.internationalCosts = [];
      modified = true;
    }
    if (!db.expenseCategories || db.expenseCategories.length === 0) {
      db.expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];
      modified = true;
    } else {
      const missingCategories = DEFAULT_EXPENSE_CATEGORIES.filter(
        c => !db.expenseCategories!.some(existing => existing.toLowerCase() === c.toLowerCase())
      );
      if (missingCategories.length > 0) {
        db.expenseCategories = [...db.expenseCategories, ...missingCategories];
        modified = true;
      }
    }
    if (!db.caixa_caminhao) {
      db.caixa_caminhao = DEFAULT_DB.caixa_caminhao || [];
      modified = true;
    }
    if (!db.caixa_movimentacoes) {
      db.caixa_movimentacoes = DEFAULT_DB.caixa_movimentacoes || [];
      modified = true;
    }
    if (!db.image_analyses) {
      db.image_analyses = [];
      modified = true;
    }
    if (!db.trip_logs) {
      db.trip_logs = [];
      modified = true;
    }
    if (!db.trip_photos) {
      db.trip_photos = [];
      modified = true;
    }
    if (!db.notifications) {
      db.notifications = [];
      modified = true;
    }
    if (modified) {
      await saveDB(db);
    }
    return db;
  } catch (error) {
    console.error("Erro ao ler DB. Carregando padrão.", error);
    return DEFAULT_DB;
  }
}

async function saveDB(db: Database): Promise<void> {
  try {
    const { error } = await supabase.from("app_state").update({ data: db }).eq("id", 1);
    if (error) throw error;
  } catch (error) {
    console.error("Erro ao salvar DB:", error);
  }
}

// REST endpoints
// Auth APIs
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
  }
  const meta = data.user.user_metadata || {};
  res.json({
    success: true,
    user: {
      id: data.user.id,
      name: meta.name,
      email: data.user.email,
      phone: meta.phone,
      role: meta.role,
      driverId: meta.driverId,
      token: data.session?.access_token
    }
  });
});

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const db = (await loadDB());
  const finalRole = role || "Operador";
  let driverId: string | undefined;

  if (finalRole === "Motorista") {
    const driver = db.drivers.find(d => d.email && d.email.toLowerCase() === email.toLowerCase());
    if (driver) {
      driverId = driver.id;
    } else {
      driverId = `drv_${Date.now()}`;
      db.drivers.push({
        id: driverId,
        fullName: name,
        email: email.toLowerCase(),
        cpf: "Não cadastrado",
        rg: "",
        phone: phone || "",
        whatsapp: phone || "",
        address: "Não cadastrado",
        city: "Não cadastrado",
        state: "SP",
        cnh: "Não cadastrado",
        cnhCategory: "D",
        cnhExpiration: "2030-12-31",
        admissionDate: todayBrazilISO(),
        status: "Ativo"
      });
    }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name, phone, role: finalRole, driverId }
  });

  if (error || !data.user) {
    const isDuplicate = /already|exists/i.test(error?.message || "");
    return res.status(400).json({ success: false, message: isDuplicate ? "Este e-mail já está cadastrado." : (error?.message || "Falha ao registrar usuário.") });
  }

  if (finalRole === "Motorista") {
    const drv = db.drivers.find(d => d.id === driverId);
    if (drv) drv.authUserId = data.user.id;
  }

  await saveDB(db);
  res.json({ success: true, message: "Cadastro realizado com sucesso." });
});

// Photo upload -> Supabase Storage, returns a public URL
app.post("/api/upload-photo", async (req, res) => {
  const { image, folder } = req.body;
  if (!image || typeof image !== "string") {
    return res.status(400).json({ success: false, message: "A imagem em base64 é obrigatória." });
  }
  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  const mimeType = match ? match[1] : "image/jpeg";
  const base64Data = match ? match[2] : image;
  const ext = mimeType.split("/")[1] || "jpg";
  const path = `${folder || "misc"}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(path, Buffer.from(base64Data, "base64"), { contentType: mimeType });

  if (error) {
    return res.status(500).json({ success: false, message: "Falha ao enviar imagem: " + error.message });
  }

  const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(path);
  res.json({ success: true, url: publicUrlData.publicUrl });
});

// Generic document upload (PDFs, images) -> Supabase Storage, returns a public URL
app.post("/api/upload-document", async (req, res) => {
  const { file, fileName, folder } = req.body;
  if (!file || typeof file !== "string") {
    return res.status(400).json({ success: false, message: "O arquivo em base64 é obrigatório." });
  }
  const match = file.match(/^data:([\w/.+-]+);base64,(.+)$/);
  const mimeType = match ? match[1] : "application/octet-stream";
  const base64Data = match ? match[2] : file;
  const ext = (fileName && fileName.includes(".")) ? fileName.split(".").pop() : (mimeType.split("/")[1] || "bin");
  const path = `${folder || "documents"}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(path, Buffer.from(base64Data, "base64"), { contentType: mimeType });

  if (error) {
    return res.status(500).json({ success: false, message: "Falha ao enviar documento: " + error.message });
  }

  const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(path);
  res.json({ success: true, url: publicUrlData.publicUrl, name: fileName || path });
});

// Company profile
app.get("/api/company", async (req, res) => {
  const db = await loadDB();
  res.json({ success: true, company: db.company || {} });
});

app.put("/api/company", async (req, res) => {
  const db = await loadDB();
  db.company = { ...db.company, ...req.body };
  await saveDB(db);
  res.json({ success: true, company: db.company });
});

// Custos Operacionais por País (Brasil/Argentina/Chile) - lançamento manual
app.get("/api/international-costs", async (req, res) => {
  const db = await loadDB();
  res.json({ success: true, costs: db.internationalCosts || [] });
});

app.post("/api/international-costs", async (req, res) => {
  const db = await loadDB();
  const newCost = {
    id: `intcost_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.internationalCosts = db.internationalCosts || [];
  db.internationalCosts.push(newCost);
  await saveDB(db);
  res.json({ success: true, cost: newCost });
});

app.put("/api/international-costs/:id", async (req, res) => {
  const { id } = req.params;
  const db = await loadDB();
  db.internationalCosts = db.internationalCosts || [];
  const idx = db.internationalCosts.findIndex((c: any) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Custo não encontrado." });
  }
  db.internationalCosts[idx] = { ...db.internationalCosts[idx], ...req.body };
  await saveDB(db);
  res.json({ success: true, cost: db.internationalCosts[idx] });
});

app.delete("/api/international-costs/:id", async (req, res) => {
  const { id } = req.params;
  const db = await loadDB();
  db.internationalCosts = (db.internationalCosts || []).filter((c: any) => c.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Contatos & Anotações de empresas parceiras (despachantes, oficinas, fornecedores etc.)
app.get("/api/company-contacts", async (req, res) => {
  const db = await loadDB();
  res.json({ success: true, contacts: db.companyContacts || [] });
});

app.post("/api/company-contacts", async (req, res) => {
  const db = await loadDB();
  const newContact = {
    id: `contact_${Date.now()}`,
    createdAt: new Date().toISOString(),
    files: [],
    ...req.body
  };
  db.companyContacts = db.companyContacts || [];
  db.companyContacts.push(newContact);
  await saveDB(db);
  res.json({ success: true, contact: newContact });
});

app.put("/api/company-contacts/:id", async (req, res) => {
  const { id } = req.params;
  const db = await loadDB();
  db.companyContacts = db.companyContacts || [];
  const idx = db.companyContacts.findIndex((c: any) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Contato não encontrado." });
  }
  db.companyContacts[idx] = { ...db.companyContacts[idx], ...req.body };
  await saveDB(db);
  res.json({ success: true, contact: db.companyContacts[idx] });
});

app.delete("/api/company-contacts/:id", async (req, res) => {
  const { id } = req.params;
  const db = await loadDB();
  db.companyContacts = (db.companyContacts || []).filter((c: any) => c.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Categorias de despesas (customizáveis pelo usuário em Controle de Despesas)
app.get("/api/expense-categories", async (req, res) => {
  const db = await loadDB();
  res.json({ success: true, categories: db.expenseCategories || DEFAULT_EXPENSE_CATEGORIES });
});

app.post("/api/expense-categories", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Nome da categoria é obrigatório." });
  }
  const trimmed = name.trim();
  const db = await loadDB();
  db.expenseCategories = db.expenseCategories || [...DEFAULT_EXPENSE_CATEGORIES];
  if (db.expenseCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    return res.status(400).json({ success: false, message: "Essa categoria já existe." });
  }
  db.expenseCategories.push(trimmed);
  await saveDB(db);
  res.json({ success: true, categories: db.expenseCategories });
});

app.delete("/api/expense-categories/:name", async (req, res) => {
  const { name } = req.params;
  const db = await loadDB();
  db.expenseCategories = (db.expenseCategories || [...DEFAULT_EXPENSE_CATEGORIES]).filter(
    c => c.toLowerCase() !== decodeURIComponent(name).toLowerCase()
  );
  await saveDB(db);
  res.json({ success: true, categories: db.expenseCategories });
});

// Vehicle GPS tracking (Fulltrack2 integration)
const FULLTRACK_BASE_URL = "https://ws.fulltrack2.com";
function fulltrackHeaders() {
  return {
    apikey: process.env.FULLTRACK_API_KEY || "",
    secretkey: process.env.FULLTRACK_SECRET_KEY || ""
  };
}

// Live position + speed for every tracked vehicle
app.get("/api/tracking/live", async (req, res) => {
  try {
    const response = await fetch(`${FULLTRACK_BASE_URL}/events/all`, { headers: fulltrackHeaders() });
    const data = await response.json();
    if (!data.status) {
      return res.status(502).json({ success: false, message: data.message || "Falha ao consultar rastreador." });
    }
    const vehicles = (data.data || []).map((v: any) => ({
      vehicleId: v.ras_vei_id,
      plate: v.ras_vei_placa,
      model: v.ras_vei_veiculo,
      lat: Number(v.ras_eve_latitude),
      lng: Number(v.ras_eve_longitude),
      speed: Number(v.ras_eve_velocidade) || 0,
      ignition: v.ras_eve_ignicao === "1",
      heading: Number(v.ras_eve_direcao) || 0,
      satellites: Number(v.ras_eve_satelites) || 0,
      gpsTime: v.ras_eve_data_gps
    }));
    res.json({ success: true, vehicles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao conectar com o rastreador: " + error.message });
  }
});

// Speed history (min/avg/max) for a single vehicle over the last N hours
app.get("/api/tracking/history/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const hours = Number(req.query.hours) || 24;
    const end = Math.floor(Date.now() / 1000);
    const begin = end - hours * 3600;
    const response = await fetch(
      `${FULLTRACK_BASE_URL}/events/interval/id/${vehicleId}/begin/${begin}/end/${end}`,
      { headers: fulltrackHeaders() }
    );
    const data = await response.json();
    if (!data.status) {
      return res.status(502).json({ success: false, message: data.message || "Falha ao consultar histórico." });
    }
    const points = (Array.isArray(data.data) ? data.data : []).map((p: any) => ({
      lat: Number(p.ras_eve_latitude),
      lng: Number(p.ras_eve_longitude),
      speed: Number(p.ras_eve_velocidade) || 0,
      time: p.ras_eve_data_gps
    }));
    const speeds = points.map((p: any) => p.speed).filter((s: number) => s >= 0);

    // Distance traveled: sum of the haversine distance between consecutive GPS points
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };
    let distanceKm = 0;
    for (let i = 1; i < points.length; i++) {
      distanceKm += haversineKm(points[i - 1], points[i]);
    }

    const stats = {
      current: points.length > 0 ? points[points.length - 1].speed : 0,
      min: speeds.length > 0 ? Math.min(...speeds) : 0,
      max: speeds.length > 0 ? Math.max(...speeds) : 0,
      avg: speeds.length > 0 ? Math.round((speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length) * 10) / 10 : 0,
      distanceKm: Math.round(distanceKm * 10) / 10
    };
    res.json({ success: true, points, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erro ao conectar com o rastreador: " + error.message });
  }
});

// Drivers CRUD
app.get("/api/drivers", async (req, res) => {
  res.json((await loadDB()).drivers);
});

app.post("/api/drivers", async (req, res) => {
  const db = (await loadDB());
  const id = `drv_${Date.now()}`;

  // Generate temporary password
  const tempPassword = `moto_${Math.floor(1000 + Math.random() * 9000)}`;

  const newDriver: any = {
    id,
    status: req.body.status || "Ativo",
    temporaryPassword: tempPassword,
    ...req.body
  };

  // Automatically create a Supabase Auth login if email is provided
  if (newDriver.email) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: newDriver.email.toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: newDriver.fullName, phone: newDriver.phone || "", role: "Motorista", driverId: id }
    });
    if (!error && data.user) {
      newDriver.authUserId = data.user.id;
    }
  }

  db.drivers.push(newDriver);
  await saveDB(db);
  res.json({ success: true, driver: newDriver });
});

app.put("/api/drivers/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  const idx = db.drivers.findIndex(d => d.id === id);
  if (idx !== -1) {
    const oldDriver = db.drivers[idx];
    const updatedDriver = { ...oldDriver, ...req.body };
    db.drivers[idx] = updatedDriver;

    // Check if we need to sync the Supabase Auth login
    if (updatedDriver.email) {
      if (updatedDriver.authUserId) {
        await supabase.auth.admin.updateUserById(updatedDriver.authUserId, {
          email: updatedDriver.email.toLowerCase(),
          ...(updatedDriver.temporaryPassword && updatedDriver.temporaryPassword !== oldDriver.temporaryPassword
            ? { password: updatedDriver.temporaryPassword }
            : {}),
          user_metadata: { name: updatedDriver.fullName, phone: updatedDriver.phone || "", role: "Motorista", driverId: id }
        });
      } else {
        // Create login if it didn't exist before
        const tempPassword = updatedDriver.temporaryPassword || `moto_${Math.floor(1000 + Math.random() * 9000)}`;
        updatedDriver.temporaryPassword = tempPassword;
        const { data, error } = await supabase.auth.admin.createUser({
          email: updatedDriver.email.toLowerCase(),
          password: tempPassword,
          email_confirm: true,
          user_metadata: { name: updatedDriver.fullName, phone: updatedDriver.phone || "", role: "Motorista", driverId: id }
        });
        if (!error && data.user) {
          updatedDriver.authUserId = data.user.id;
        }
      }
      db.drivers[idx] = updatedDriver;
    } else if (oldDriver.authUserId) {
      // If email was removed, remove the login
      await supabase.auth.admin.deleteUser(oldDriver.authUserId);
      delete updatedDriver.authUserId;
      db.drivers[idx] = updatedDriver;
    }

    await saveDB(db);
    res.json({ success: true, driver: updatedDriver });
  } else {
    res.status(404).json({ success: false, message: "Motorista não encontrado." });
  }
});

app.delete("/api/drivers/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  const driver = db.drivers.find(d => d.id === id);
  if (driver?.authUserId) {
    await supabase.auth.admin.deleteUser(driver.authUserId);
  }
  db.drivers = db.drivers.filter(d => d.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Vehicles CRUD
app.get("/api/vehicles", async (req, res) => {
  res.json((await loadDB()).vehicles);
});

app.post("/api/vehicles", async (req, res) => {
  const db = (await loadDB());
  const newVehicle = {
    id: `vhc_${Date.now()}`,
    currentMileage: Number(req.body.currentMileage) || 0,
    nextMaintenance: Number(req.body.nextMaintenance) || 0,
    maintenanceHistory: [],
    ...req.body
  };
  db.vehicles.push(newVehicle);
  await saveDB(db);
  res.json({ success: true, vehicle: newVehicle });
});

app.put("/api/vehicles/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  const idx = db.vehicles.findIndex(v => v.id === id);
  if (idx !== -1) {
    db.vehicles[idx] = { ...db.vehicles[idx], ...req.body };
    await saveDB(db);
    res.json({ success: true, vehicle: db.vehicles[idx] });
  } else {
    res.status(404).json({ success: false, message: "Veículo não encontrado." });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.vehicles = db.vehicles.filter(v => v.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Freights CRUD
app.get("/api/freights", async (req, res) => {
  res.json((await loadDB()).freights);
});

app.post("/api/freights", async (req, res) => {
  const db = (await loadDB());
  const count = db.freights.length + 1001;
  const newFreight = {
    id: `frt_${Date.now()}`,
    freightNumber: `FRT-${count}`,
    ...req.body
  };

  // Update vehicle mileage if it is completed and final mileage is higher
  if (newFreight.status === "Finalizado" && newFreight.mileage?.end) {
    const vehicle = db.vehicles.find(v => v.id === newFreight.vehicleId);
    if (vehicle) {
      const deltaKm = Number(newFreight.mileage.total) || (Number(newFreight.mileage.end) - Number(newFreight.mileage.start)) || 0;
      vehicle.currentMileage = Math.max(vehicle.currentMileage, Number(newFreight.mileage.end));

      // Update tires mileage
      if (deltaKm > 0) {
        db.tires.forEach(t => {
          if (t.vehicleId === newFreight.vehicleId && t.status === "Em uso") {
            t.currentMileage += deltaKm;
          }
        });
      }
    }
  }

  db.freights.push(newFreight);

  // Atividade do motorista: registro do novo frete atribuído
  const assignedDriver = db.drivers.find(d => d.id === newFreight.driverId);
  if (assignedDriver) {
    db.notifications = db.notifications || [];
    db.notifications.push({
      id: `ntf_${Date.now()}`,
      message: `📋 Frete ${newFreight.freightNumber} atribuído a ${assignedDriver.fullName} (${newFreight.origin?.city || "?"} → ${newFreight.destination?.city || "?"})`,
      date: newFreight.date || new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      read: false,
      driverName: assignedDriver.fullName,
      freightId: newFreight.id
    });
  }

  await saveDB(db);
  res.json({ success: true, freight: newFreight });
});

app.put("/api/freights/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  const idx = db.freights.findIndex(f => f.id === id);
  if (idx !== -1) {
    const oldFreight = db.freights[idx];
    const updated = { ...oldFreight, ...req.body };
    db.freights[idx] = updated;

    // Update vehicle mileage if state changed to finished
    if (updated.status === "Finalizado" && updated.mileage?.end) {
      const vehicle = db.vehicles.find(v => v.id === updated.vehicleId);
      if (vehicle) {
        const oldStatus = oldFreight.status;
        if (oldStatus !== "Finalizado") {
          const deltaKm = Number(updated.mileage.total) || (Number(updated.mileage.end) - Number(updated.mileage.start)) || 0;
          vehicle.currentMileage = Math.max(vehicle.currentMileage, Number(updated.mileage.end));
          
          // Update tires mileage
          if (deltaKm > 0) {
            db.tires.forEach(t => {
              if (t.vehicleId === updated.vehicleId && t.status === "Em uso") {
                t.currentMileage += deltaKm;
              }
            });
          }
        }
      }
    }

    // Atividade do motorista: status alterado ou comissão paga
    const freightDriver = db.drivers.find(d => d.id === updated.driverId);
    if (freightDriver) {
      db.notifications = db.notifications || [];
      const nowTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const today = new Date().toISOString().split("T")[0];

      if (oldFreight.status !== updated.status) {
        db.notifications.push({
          id: `ntf_${Date.now()}_status`,
          message: `🚚 Frete ${updated.freightNumber} de ${freightDriver.fullName} mudou para "${updated.status}"`,
          date: today,
          time: nowTime,
          read: false,
          driverName: freightDriver.fullName,
          freightId: updated.id
        });
      }

      const oldCommissionPaid = oldFreight.financial?.commissionPaid || 0;
      const newCommissionPaid = updated.financial?.commissionPaid || 0;
      if (newCommissionPaid > oldCommissionPaid) {
        const paidNow = newCommissionPaid - oldCommissionPaid;
        db.notifications.push({
          id: `ntf_${Date.now()}_commission`,
          message: `💰 Comissão de R$ ${paidNow.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paga a ${freightDriver.fullName} (Frete ${updated.freightNumber})`,
          date: today,
          time: nowTime,
          read: false,
          driverName: freightDriver.fullName,
          freightId: updated.id
        });
      }
    }

    await saveDB(db);
    res.json({ success: true, freight: updated });
  } else {
    res.status(404).json({ success: false, message: "Frete não encontrado." });
  }
});

app.delete("/api/freights/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.freights = db.freights.filter(f => f.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// ==========================================
// TMS - MOTORISTAS & VIAGENS API ENDPOINTS
// ==========================================

// Trip logs
app.get("/api/trip_logs", async (req, res) => {
  res.json((await loadDB()).trip_logs || []);
});

app.post("/api/trip_logs", async (req, res) => {
  const db = (await loadDB());
  const { freightId, driverId, category, description, value, date, time, location, photos, notes } = req.body;
  
  const newLog = {
    id: `log_${Date.now()}`,
    freightId,
    driverId,
    category,
    description,
    value: value ? Number(value) : undefined,
    date,
    time,
    location: location || "",
    photos: photos || [],
    notes: notes || "",
    approved: true,
    createdAt: new Date().toISOString()
  };
  
  db.trip_logs.push(newLog);
  
  // Also store into trip_photos table if any are attached
  if (photos && Array.isArray(photos)) {
    photos.forEach((photoUrl, idx) => {
      db.trip_photos.push({
        id: `photo_${Date.now()}_${idx}`,
        freightId,
        driverId,
        logId: newLog.id,
        photoUrl,
        category,
        description: description || category,
        date,
        time
      });
    });
  }
  
  // Notification to admin
  const driver = db.drivers.find(d => d.id === driverId);
  const driverName = driver ? driver.fullName : "Motorista";
  
  db.notifications.push({
    id: `ntf_${Date.now()}`,
    message: `🔔 ${driverName} registrou ${category}: ${description || ""}`,
    date,
    time,
    read: false,
    driverName,
    freightId
  });
  
  await saveDB(db);
  res.json({ success: true, log: newLog });
});

// Trip photos
app.get("/api/trip_photos", async (req, res) => {
  res.json((await loadDB()).trip_photos || []);
});

// Notifications
app.get("/api/notifications", async (req, res) => {
  res.json((await loadDB()).notifications || []);
});

// Preenche o feed de Atividade de Motoristas retroativamente, a partir dos
// fretes e comissões já cadastrados (uso único, não duplica se rodado de novo)
app.post("/api/notifications/backfill", async (req, res) => {
  const db = await loadDB();
  db.notifications = db.notifications || [];
  const existingFreightRefs = new Set(db.notifications.map((n: any) => `${n.freightId}_${n.message}`));
  let created = 0;

  db.freights.forEach(f => {
    const driver = db.drivers.find(d => d.id === f.driverId);
    if (!driver) return;
    const time = "12:00";

    const assignMsg = `📋 Frete ${f.freightNumber} atribuído a ${driver.fullName} (${f.origin?.city || "?"} → ${f.destination?.city || "?"})`;
    if (!existingFreightRefs.has(`${f.id}_${assignMsg}`)) {
      db.notifications.push({
        id: `ntf_bf_${f.id}_assign`,
        message: assignMsg,
        date: f.date || new Date().toISOString().split("T")[0],
        time,
        read: true,
        driverName: driver.fullName,
        freightId: f.id
      });
      created++;
    }

    if (f.status === "Finalizado") {
      const statusMsg = `🚚 Frete ${f.freightNumber} de ${driver.fullName} mudou para "Finalizado"`;
      if (!existingFreightRefs.has(`${f.id}_${statusMsg}`)) {
        db.notifications.push({
          id: `ntf_bf_${f.id}_status`,
          message: statusMsg,
          date: f.date || new Date().toISOString().split("T")[0],
          time,
          read: true,
          driverName: driver.fullName,
          freightId: f.id
        });
        created++;
      }
    }

    const paidAmount = f.financial?.commissionPaid || 0;
    if (paidAmount > 0) {
      const commissionMsg = `💰 Comissão de R$ ${paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paga a ${driver.fullName} (Frete ${f.freightNumber})`;
      if (!existingFreightRefs.has(`${f.id}_${commissionMsg}`)) {
        db.notifications.push({
          id: `ntf_bf_${f.id}_commission`,
          message: commissionMsg,
          date: f.date || new Date().toISOString().split("T")[0],
          time,
          read: true,
          driverName: driver.fullName,
          freightId: f.id
        });
        created++;
      }
    }
  });

  await saveDB(db);
  res.json({ success: true, created });
});

app.post("/api/notifications/read", async (req, res) => {
  const db = (await loadDB());
  if (db.notifications) {
    db.notifications.forEach(n => { n.read = true; });
  }
  await saveDB(db);
  res.json({ success: true });
});

// Driver Start Trip
app.post("/api/driver_start_trip", async (req, res) => {
  const db = (await loadDB());
  const { driverId, vehicleId, origin, destination, startKm, date, time, panelPhoto, frontPhoto, observations } = req.body;
  
  const driver = db.drivers.find(d => d.id === driverId);
  const vehicle = db.vehicles.find(v => v.id === vehicleId);
  
  if (!driver) {
    return res.status(400).json({ success: false, message: "Motorista não encontrado." });
  }
  if (!vehicle) {
    return res.status(400).json({ success: false, message: "Caminhão não encontrado." });
  }
  
  // Update Driver and Vehicle status
  driver.status = "Em viagem";
  driver.vehicleId = vehicleId;
  vehicle.status = "Em viagem";
  vehicle.currentMileage = Math.max(vehicle.currentMileage, Number(startKm) || 0);
  
  const count = db.freights.length + 1001;
  const freightId = `frt_${Date.now()}`;
  
  const newFreight = {
    id: freightId,
    freightNumber: `FRT-${count}`,
    date,
    departureTime: time,
    arrivalTime: "",
    status: "Em andamento",
    driverId,
    vehicleId,
    origin: {
      city: origin || "",
      state: "",
      address: "",
      company: ""
    },
    destination: {
      city: destination || "",
      state: "",
      address: "",
      company: ""
    },
    cargo: {
      type: "Geral",
      description: "Carga de Viagem",
      qty: 0,
      unit: "Toneladas"
    },
    financial: {
      value: 0,
      commission: 0,
      toll: 0,
      food: 0,
      lodging: 0,
      otherExpenses: 0,
      advance: 0,
      balance: 0,
      balanceStatus: "Pendente"
    },
    mileage: {
      start: Number(startKm) || 0,
      end: 0,
      total: 0
    },
    observations: observations || ""
  };
  
  db.freights.push(newFreight);
  
  // Register start trip log
  const logId = `log_start_${Date.now()}`;
  const startPhotos = [];
  if (panelPhoto) startPhotos.push(panelPhoto);
  if (frontPhoto) startPhotos.push(frontPhoto);
  
  db.trip_logs.push({
    id: logId,
    freightId,
    driverId,
    category: "Observação",
    description: "🚛 Viagem iniciada",
    value: undefined,
    date,
    time,
    location: origin || "",
    photos: startPhotos,
    notes: `Painel e caminhão fotografados. Km Inicial: ${startKm}. ${observations || ""}`,
    approved: true,
    createdAt: new Date().toISOString()
  });
  
  // Save start photos in trip_photos table too
  if (panelPhoto) {
    db.trip_photos.push({
      id: `photo_panel_${Date.now()}`,
      freightId,
      driverId,
      logId,
      photoUrl: panelPhoto,
      category: "Painel",
      description: "Foto do painel (Início da viagem)",
      date,
      time
    });
  }
  if (frontPhoto) {
    db.trip_photos.push({
      id: `photo_front_${Date.now()}`,
      freightId,
      driverId,
      logId,
      photoUrl: frontPhoto,
      category: "Frente",
      description: "Foto da frente do caminhão (Início da viagem)",
      date,
      time
    });
  }
  
  // Create active admin notification
  db.notifications.push({
    id: `ntf_${Date.now()}`,
    message: `🚛 ${driver.fullName} iniciou viagem com o caminhão ${vehicle.plate}. Km Inicial: ${startKm}`,
    date,
    time,
    read: false,
    driverName: driver.fullName,
    freightId
  });
  
  await saveDB(db);
  res.json({ success: true, freight: newFreight });
});

// Driver End Trip
app.post("/api/driver_end_trip/:freightId", async (req, res) => {
  const { freightId } = req.params;
  const db = (await loadDB());
  const { endKm, date, time, panelPhoto, vehiclePhoto, observations } = req.body;
  
  const freight = db.freights.find(f => f.id === freightId);
  if (!freight) {
    return res.status(404).json({ success: false, message: "Viagem não encontrada." });
  }
  if (freight.status === "Finalizado") {
    return res.status(400).json({ success: false, message: "Esta viagem já está finalizada." });
  }
  
  const driver = db.drivers.find(d => d.id === freight.driverId);
  const vehicle = db.vehicles.find(v => v.id === freight.vehicleId);
  
  const startKm = Number(freight.mileage.start) || 0;
  const finalKm = Number(endKm) || startKm;
  const totalKm = Math.max(0, finalKm - startKm);
  
  // Update freight details
  freight.status = "Finalizado";
  freight.arrivalTime = time;
  freight.mileage.end = finalKm;
  freight.mileage.total = totalKm;
  if (observations) {
    freight.observations = (freight.observations ? freight.observations + " | " : "") + observations;
  }
  
  // Restore Driver and Vehicle statuses
  if (driver) {
    driver.status = "Ativo";
  }
  if (vehicle) {
    vehicle.status = "Ativo";
    vehicle.currentMileage = Math.max(vehicle.currentMileage, finalKm);
    
    // Update tires mileage for tires currently in use on this vehicle
    db.tires.forEach(t => {
      if (t.vehicleId === vehicle.id && t.status === "Em uso") {
        t.currentMileage += totalKm;
      }
    });
  }
  
  // Register end trip log
  const logId = `log_end_${Date.now()}`;
  const endPhotos = [];
  if (panelPhoto) endPhotos.push(panelPhoto);
  if (vehiclePhoto) endPhotos.push(vehiclePhoto);
  
  db.trip_logs.push({
    id: logId,
    freightId,
    driverId: freight.driverId,
    category: "Observação",
    description: "🏁 Viagem finalizada",
    value: undefined,
    date,
    time,
    location: freight.destination.city || "",
    photos: endPhotos,
    notes: `Painel e caminhão fotografados. Km Final: ${finalKm}. Percorridos: ${totalKm} Km. ${observations || ""}`,
    approved: true,
    createdAt: new Date().toISOString()
  });
  
  // Save end photos
  if (panelPhoto) {
    db.trip_photos.push({
      id: `photo_panel_end_${Date.now()}`,
      freightId,
      driverId: freight.driverId,
      logId,
      photoUrl: panelPhoto,
      category: "Painel",
      description: "Foto do painel (Fim da viagem)",
      date,
      time
    });
  }
  if (vehiclePhoto) {
    db.trip_photos.push({
      id: `photo_vehicle_end_${Date.now()}`,
      freightId,
      driverId: freight.driverId,
      logId,
      photoUrl: vehiclePhoto,
      category: "Frente",
      description: "Foto do caminhão (Fim da viagem)",
      date,
      time
    });
  }
  
  // Calculate expenditures during this voyage
  const logs = db.trip_logs.filter(l => l.freightId === freightId);
  const totalExpenses = logs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
  freight.financial.value = totalExpenses;
  
  // Create notifications
  const driverName = driver ? driver.fullName : "Motorista";
  db.notifications.push({
    id: `ntf_${Date.now()}`,
    message: `🏁 ${driverName} finalizou viagem. Km Final: ${finalKm}. Total percorrido: ${totalKm} Km. Gastos totais: R$ ${totalExpenses.toFixed(2)}`,
    date,
    time,
    read: false,
    driverName,
    freightId
  });
  
  await saveDB(db);
  res.json({ success: true, freight });
});

// Refuels CRUD
app.get("/api/refuels", async (req, res) => {
  res.json((await loadDB()).refuels);
});

app.post("/api/refuels", async (req, res) => {
  const db = (await loadDB());
  const newRefuel = {
    id: `ref_${Date.now()}`,
    ...req.body
  };
  db.refuels.push(newRefuel);

  // Auto-create fueling expense corresponding to this refueling
  const newExpense = {
    id: `exp_ref_${newRefuel.id}`,
    date: newRefuel.date,
    category: "Combustível",
    value: Number(newRefuel.totalValue) || 0,
    description: `Abastecimento (${newRefuel.liters}L Diesel${newRefuel.arlaLiters ? ` + ${newRefuel.arlaLiters}L Arla` : ""}) - Posto: ${newRefuel.gasStation}`,
    receipt: ""
  };
  db.expenses.push(newExpense);

  await saveDB(db);
  res.json({ success: true, refuel: newRefuel });
});

app.put("/api/refuels/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  const idx = db.refuels.findIndex(r => r.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: "Abastecimento não encontrado." });
    return;
  }
  const updatedRefuel = { ...db.refuels[idx], ...req.body };
  db.refuels[idx] = updatedRefuel;

  // Keep the linked fueling expense in sync with the edited refuel
  const expenseIdx = db.expenses.findIndex(e => e.id === `exp_ref_${id}`);
  if (expenseIdx !== -1) {
    db.expenses[expenseIdx] = {
      ...db.expenses[expenseIdx],
      date: updatedRefuel.date,
      value: Number(updatedRefuel.totalValue) || 0,
      description: `Abastecimento (${updatedRefuel.liters}L Diesel${updatedRefuel.arlaLiters ? ` + ${updatedRefuel.arlaLiters}L Arla` : ""}) - Posto: ${updatedRefuel.gasStation}`
    };
  }

  await saveDB(db);
  res.json({ success: true, refuel: updatedRefuel });
});

app.delete("/api/refuels/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.refuels = db.refuels.filter(r => r.id !== id);
  // Also delete corresponding expense
  db.expenses = db.expenses.filter(e => e.id !== `exp_ref_${id}`);
  await saveDB(db);
  res.json({ success: true });
});

// Expenses CRUD
app.get("/api/expenses", async (req, res) => {
  res.json((await loadDB()).expenses);
});

app.post("/api/expenses", async (req, res) => {
  const db = (await loadDB());
  const newExpense = {
    id: `exp_${Date.now()}`,
    ...req.body
  };
  db.expenses.push(newExpense);
  await saveDB(db);
  res.json({ success: true, expense: newExpense });
});

app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  const idx = db.expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    db.expenses[idx] = { ...db.expenses[idx], ...req.body };
    await saveDB(db);
    res.json({ success: true, expense: db.expenses[idx] });
  } else {
    res.status(404).json({ success: false, message: "Despesa não encontrada." });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.expenses = db.expenses.filter(e => e.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Tires CRUD
app.get("/api/tires", async (req, res) => {
  res.json({ success: true, tires: (await loadDB()).tires || [] });
});

app.post("/api/tires", async (req, res) => {
  const db = (await loadDB());
  const newTire = {
    id: `tir_${Date.now()}`,
    serialNumber: req.body.serialNumber || "",
    brand: req.body.brand || "",
    model: req.body.model || "",
    size: req.body.size || "",
    status: req.body.status || "Estoque",
    vehicleId: req.body.vehicleId || "",
    position: req.body.position || "",
    currentMileage: Number(req.body.currentMileage) || 0,
    estimatedLife: Number(req.body.estimatedLife) || 100000,
    changesHistory: req.body.changesHistory || [],
    rotationsHistory: req.body.rotationsHistory || []
  };

  // If created as installed, add an initial installation change
  if (newTire.status === "Em uso" && newTire.vehicleId) {
    newTire.changesHistory.push({
      id: `ch_${Date.now()}`,
      date: todayBrazilISO(),
      type: "Instalação",
      km: Number(req.body.currentMileage) || 0,
      vehicleId: newTire.vehicleId,
      position: newTire.position,
      description: `Instalação inicial na criação do pneu.`
    });
  }

  db.tires = db.tires || [];
  db.tires.push(newTire);
  await saveDB(db);
  res.json({ success: true, tire: newTire });
});

app.put("/api/tires/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.tires = db.tires || [];
  const idx = db.tires.findIndex(t => t.id === id);
  if (idx !== -1) {
    db.tires[idx] = { ...db.tires[idx], ...req.body };
    await saveDB(db);
    res.json({ success: true, tire: db.tires[idx] });
  } else {
    res.status(404).json({ success: false, message: "Pneu não encontrado." });
  }
});

app.delete("/api/tires/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.tires = db.tires || [];
  db.tires = db.tires.filter(t => t.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Record Tire Change (Installation / Removal / Repair / Retread / Discard)
app.post("/api/tires/:id/changes", async (req, res) => {
  const { id } = req.params;
  const { date, type, km, vehicleId, position, description, cost } = req.body;
  const db = (await loadDB());
  db.tires = db.tires || [];
  const tire = db.tires.find(t => t.id === id);

  if (!tire) {
    return res.status(404).json({ success: false, message: "Pneu não encontrado." });
  }

  const change = {
    id: `ch_${Date.now()}`,
    date: date || todayBrazilISO(),
    type,
    km: Number(km) || 0,
    vehicleId: vehicleId || "",
    position: position || "",
    description: description || ""
  };

  tire.changesHistory = tire.changesHistory || [];
  tire.changesHistory.push(change);

  // Apply state transitions based on type of change
  if (type === "Instalação") {
    tire.status = "Em uso";
    tire.vehicleId = vehicleId;
    tire.position = position;
  } else if (type === "Remoção") {
    tire.status = "Estoque";
    tire.vehicleId = "";
    tire.position = "";
  } else if (type === "Recapagem") {
    tire.status = "Recapagem";
    tire.vehicleId = "";
    tire.position = "";
  } else if (type === "Descarte") {
    tire.status = "Descartado";
    tire.vehicleId = "";
    tire.position = "";
  }

  // If there's a cost associated with the change, log it as an expense
  if (cost && Number(cost) > 0) {
    const expense = {
      id: `exp_tire_${change.id}`,
      date: change.date,
      category: "Pneus",
      value: Number(cost),
      description: `Gasto com Pneu (${type}): ${tire.brand} ${tire.model} (S/N: ${tire.serialNumber}). ${description}`,
      receipt: ""
    };
    db.expenses.push(expense);
  }

  await saveDB(db);
  res.json({ success: true, tire });
});

// Record Tire Rotation
app.post("/api/tires/:id/rotations", async (req, res) => {
  const { id } = req.params;
  const { date, km, fromPosition, toPosition, description } = req.body;
  const db = (await loadDB());
  db.tires = db.tires || [];
  const tire = db.tires.find(t => t.id === id);

  if (!tire) {
    return res.status(404).json({ success: false, message: "Pneu não encontrado." });
  }

  const rotation = {
    id: `rot_${Date.now()}`,
    date: date || todayBrazilISO(),
    km: Number(km) || 0,
    fromPosition,
    toPosition,
    description: description || ""
  };

  tire.rotationsHistory = tire.rotationsHistory || [];
  tire.rotationsHistory.push(rotation);
  tire.position = toPosition;

  await saveDB(db);
  res.json({ success: true, tire });
});

// Debts CRUD
app.get("/api/debts", async (req, res) => {
  res.json({ success: true, debts: (await loadDB()).debts || [] });
});

app.post("/api/debts", async (req, res) => {
  const db = (await loadDB());
  const newDebt = {
    id: `debt_${Date.now()}`,
    description: req.body.description || "",
    category: req.body.category || "",
    value: Number(req.body.value) || 0,
    dueDate: req.body.dueDate || todayBrazilISO(),
    status: req.body.status || "Falta Pagar",
    notes: req.body.notes || "",
    createdAt: todayBrazilISO()
  };
  db.debts = db.debts || [];
  db.debts.push(newDebt);
  await saveDB(db);
  res.json({ success: true, debt: newDebt });
});

app.put("/api/debts/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.debts = db.debts || [];
  const idx = db.debts.findIndex(d => d.id === id);
  if (idx !== -1) {
    db.debts[idx] = {
      ...db.debts[idx],
      description: req.body.description !== undefined ? req.body.description : db.debts[idx].description,
      category: req.body.category !== undefined ? req.body.category : db.debts[idx].category,
      value: req.body.value !== undefined ? Number(req.body.value) : db.debts[idx].value,
      dueDate: req.body.dueDate !== undefined ? req.body.dueDate : db.debts[idx].dueDate,
      status: req.body.status !== undefined ? req.body.status : db.debts[idx].status,
      notes: req.body.notes !== undefined ? req.body.notes : db.debts[idx].notes
    };
    await saveDB(db);
    res.json({ success: true, debt: db.debts[idx] });
  } else {
    res.status(404).json({ success: false, message: "Dívida não encontrada." });
  }
});

app.delete("/api/debts/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.debts = db.debts || [];
  db.debts = db.debts.filter(d => d.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Preventive Maintenance (Óleo/Filtros/Freios/Direção/Lubrificação) CRUD
app.get("/api/maintenance-logs", async (req, res) => {
  res.json({ success: true, maintenanceLogs: (await loadDB()).maintenance_logs || [] });
});

app.post("/api/maintenance-logs", async (req, res) => {
  const db = (await loadDB());
  const newLog = {
    id: `maint_${Date.now()}`,
    vehicleId: req.body.vehicleId || "",
    item: req.body.item || "",
    category: req.body.category || "Outros",
    date: req.body.date || todayBrazilISO(),
    km: Number(req.body.km) || 0,
    cost: Number(req.body.cost) || 0,
    notes: req.body.notes || "",
    nextDueKm: req.body.nextDueKm !== undefined && req.body.nextDueKm !== "" ? Number(req.body.nextDueKm) : undefined,
    createdAt: new Date().toISOString()
  };
  db.maintenance_logs = db.maintenance_logs || [];
  db.maintenance_logs.push(newLog);
  await saveDB(db);
  res.json({ success: true, maintenanceLog: newLog });
});

app.delete("/api/maintenance-logs/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.maintenance_logs = db.maintenance_logs || [];
  db.maintenance_logs = db.maintenance_logs.filter(m => m.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Session Annotations (upload de imagem + transcricao automatica por IA, por modulo)
app.get("/api/annotations", async (req, res) => {
  const { module: moduleKey } = req.query;
  const db = (await loadDB());
  const all = db.annotations || [];
  const filtered = moduleKey ? all.filter(a => a.module === moduleKey) : all;
  res.json({ success: true, annotations: filtered });
});

// Reads an uploaded image (recibo, print, comprovante) and transcreve os campos
// estruturados encontrados. Nunca inventa dados - deixa em branco se nao encontrar.
app.post("/api/annotations/extract", async (req, res) => {
  const { image, mimeType } = req.body;
  if (!image || typeof image !== "string") {
    return res.status(400).json({ success: false, message: "A imagem em base64 é obrigatória." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ success: false, message: "IA não configurada. Preencha as informações manualmente." });
  }

  const cleanMimeType = mimeType || "image/png";
  const base64Data = image.includes(",") ? image.split(",")[1] : image;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const imagePart = { inlineData: { mimeType: cleanMimeType, data: base64Data } };
    const systemPrompt = `Você é o motor de IA da Fleet One. Analise a imagem enviada (recibo, nota fiscal, comprovante, print de gasto ou documento operacional) e transcreva SOMENTE as informações que estiverem clara e explicitamente visíveis na imagem, separando-as em campos estruturados.

REGRAS CRÍTICAS:
- NUNCA invente, estime ou "chute" valores, datas, descrições ou categorias que não estejam explicitamente legíveis na imagem.
- Se um campo não for encontrado ou não estiver legível, retorne string vazia "" (ou 0 para o valor numérico) — nunca invente um valor plausível.
- O campo "description" deve ser um resumo curto e objetivo do que a imagem representa (ex: "Troca de óleo - Posto Ipiranga", "Pedágio BR-116 km 80").
- O campo "value" deve ser o valor monetário PRINCIPAL/total encontrado no documento, como número puro (sem "R$", sem separador de milhar).
- O campo "date" deve estar no formato YYYY-MM-DD, apenas se uma data estiver visível no documento.
- O campo "category" deve ser a categoria mais provável dentre exatamente estas opções: "Combustível", "Pedágio", "Oficina", "Pneus", "Alimentação", "Hospedagem", "Manutenção", "Documentação", "Multas", "Boletos", "Cartão de Crédito", "Seguros", "Outros". Se não for possível inferir com confiança, use "Outros".`;

    const response = await withTimeout(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        imagePart,
        { text: "Transcreva e estruture as informações desta imagem de acordo com as instruções do sistema." }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            value: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["description", "value", "date", "category"]
        }
      }
    }), 25000);

    if (!response.text) {
      return res.status(503).json({ success: false, message: "Não foi possível analisar a imagem no momento. Tente novamente ou preencha manualmente." });
    }

    const extracted = sanitizePlaceholders(JSON.parse(response.text));
    res.json({ success: true, extracted });
  } catch (err: any) {
    console.warn("Erro ao transcrever anotação com IA:", err);
    res.status(503).json({ success: false, message: "Não foi possível analisar a imagem no momento. Tente novamente ou preencha manualmente." });
  }
});

app.post("/api/annotations", async (req, res) => {
  const db = (await loadDB());
  const { module: moduleKey, imageUrl, note, description, value, date, category } = req.body;
  if (!moduleKey || !imageUrl) {
    return res.status(400).json({ success: false, message: "Módulo e imagem são obrigatórios." });
  }
  const newAnnotation = {
    id: `note_${Date.now()}`,
    module: moduleKey,
    imageUrl,
    note: note || "",
    description: description || "",
    value: value !== undefined && value !== "" ? Number(value) : 0,
    category: category || "",
    date: date || todayBrazilISO(),
    createdAt: new Date().toISOString()
  };
  db.annotations = db.annotations || [];
  db.annotations.push(newAnnotation);
  await saveDB(db);
  res.json({ success: true, annotation: newAnnotation });
});

app.delete("/api/annotations/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.annotations = db.annotations || [];
  db.annotations = db.annotations.filter(a => a.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

// Truck Cash (Caixa do Caminhão) CRUD
app.get("/api/caixa-caminhao", async (req, res) => {
  const db = (await loadDB());
  res.json({
    success: true,
    caixas: db.caixa_caminhao || [],
    movimentacoes: db.caixa_movimentacoes || []
  });
});

app.post("/api/caixa-caminhao/saldo", async (req, res) => {
  const db = (await loadDB());
  const { veiculo_id, saldo_inicial, observacao } = req.body;
  
  if (!veiculo_id) {
    return res.status(400).json({ success: false, message: "ID do veículo é obrigatório." });
  }
  
  db.caixa_caminhao = db.caixa_caminhao || [];
  db.caixa_movimentacoes = db.caixa_movimentacoes || [];
  
  let caixa = db.caixa_caminhao.find(c => c.veiculo_id === veiculo_id);
  const initialVal = Number(saldo_inicial) || 0;
  const now = todayBrazilISO();
  
  if (caixa) {
    caixa.saldo_inicial = initialVal;
    caixa.observacao = observacao || "";
    caixa.updated_at = now;
  } else {
    caixa = {
      id: `caixa_${Date.now()}`,
      veiculo_id,
      saldo_inicial: initialVal,
      saldo_atual: initialVal,
      observacao: observacao || "",
      created_at: now,
      updated_at: now
    };
    db.caixa_caminhao.push(caixa);
  }
  
  // Recalculate saldo_atual: saldo_atual = saldo_inicial - sum(movimentacoes.valor)
  const gastos = db.caixa_movimentacoes.filter(m => m.caixa_id === caixa.id);
  const totalGasto = gastos.reduce((sum, item) => sum + Number(item.valor), 0);
  caixa.saldo_atual = caixa.saldo_inicial - totalGasto;
  
  await saveDB(db);
  res.json({ success: true, caixa });
});

app.post("/api/caixa-caminhao/gasto", async (req, res) => {
  const db = (await loadDB());
  const { caixa_id, categoria, valor, descricao, data, anexo, moeda, valorOriginal, cotacao } = req.body;

  if (!caixa_id || !categoria || !valor) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes." });
  }

  db.caixa_movimentacoes = db.caixa_movimentacoes || [];
  db.caixa_caminhao = db.caixa_caminhao || [];

  const caixa = db.caixa_caminhao.find(c => c.id === caixa_id);
  if (!caixa) {
    return res.status(404).json({ success: false, message: "Caixa do caminhão não encontrado." });
  }

  const now = new Date().toISOString();
  const newMov = {
    id: `mov_${Date.now()}`,
    caixa_id,
    categoria,
    valor: Number(valor) || 0,
    descricao: descricao || "",
    anexo: anexo || "",
    data: data || now.split("T")[0],
    moeda: moeda || "BRL",
    valorOriginal: valorOriginal !== undefined ? Number(valorOriginal) || 0 : Number(valor) || 0,
    cotacao: cotacao !== undefined ? Number(cotacao) || 1 : 1,
    created_at: now,
    updated_at: now
  };
  
  db.caixa_movimentacoes.push(newMov);
  
  // Recalculate saldo_atual
  const gastos = db.caixa_movimentacoes.filter(m => m.caixa_id === caixa.id);
  const totalGasto = gastos.reduce((sum, item) => sum + Number(item.valor), 0);
  caixa.saldo_atual = caixa.saldo_inicial - totalGasto;
  caixa.updated_at = now.split("T")[0];
  
  await saveDB(db);
  res.json({ success: true, movimentacao: newMov, caixa });
});

app.put("/api/caixa-caminhao/gasto/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.caixa_movimentacoes = db.caixa_movimentacoes || [];
  db.caixa_caminhao = db.caixa_caminhao || [];
  
  const mov = db.caixa_movimentacoes.find(m => m.id === id);
  if (!mov) {
    return res.status(404).json({ success: false, message: "Lançamento não encontrado." });
  }
  
  const { categoria, valor, descricao, data, anexo, moeda, valorOriginal, cotacao } = req.body;
  const now = new Date().toISOString();

  if (categoria !== undefined) mov.categoria = categoria;
  if (valor !== undefined) mov.valor = Number(valor) || 0;
  if (descricao !== undefined) mov.descricao = descricao;
  if (data !== undefined) mov.data = data;
  if (anexo !== undefined) mov.anexo = anexo;
  if (moeda !== undefined) mov.moeda = moeda;
  if (valorOriginal !== undefined) mov.valorOriginal = Number(valorOriginal) || 0;
  if (cotacao !== undefined) mov.cotacao = Number(cotacao) || 1;
  mov.updated_at = now;
  
  // Recalculate saldo_atual for the related caixa
  const caixa = db.caixa_caminhao.find(c => c.id === mov.caixa_id);
  if (caixa) {
    const gastos = db.caixa_movimentacoes.filter(m => m.caixa_id === caixa.id);
    const totalGasto = gastos.reduce((sum, item) => sum + Number(item.valor), 0);
    caixa.saldo_atual = caixa.saldo_inicial - totalGasto;
    caixa.updated_at = now.split("T")[0];
  }
  
  await saveDB(db);
  res.json({ success: true, movimentacao: mov, caixa });
});

app.delete("/api/caixa-caminhao/gasto/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.caixa_movimentacoes = db.caixa_movimentacoes || [];
  db.caixa_caminhao = db.caixa_caminhao || [];
  
  const movIndex = db.caixa_movimentacoes.findIndex(m => m.id === id);
  if (movIndex === -1) {
    return res.status(404).json({ success: false, message: "Lançamento não encontrado." });
  }
  
  const caixaId = db.caixa_movimentacoes[movIndex].caixa_id;
  db.caixa_movimentacoes.splice(movIndex, 1);
  
  // Recalculate saldo_atual for the related caixa
  const caixa = db.caixa_caminhao.find(c => c.id === caixaId);
  const now = todayBrazilISO();
  if (caixa) {
    const gastos = db.caixa_movimentacoes.filter(m => m.caixa_id === caixa.id);
    const totalGasto = gastos.reduce((sum, item) => sum + Number(item.valor), 0);
    caixa.saldo_atual = caixa.saldo_inicial - totalGasto;
    caixa.updated_at = now;
  }
  
  await saveDB(db);
  res.json({ success: true, caixa });
});

// Reset Specific Module or Database Endpoint
app.post("/api/reset/:module", async (req, res) => {
  const { module } = req.params;
  const db = (await loadDB());
  
  if (module === "drivers") {
    db.drivers = [];
  } else if (module === "vehicles") {
    db.vehicles = [];
  } else if (module === "freights") {
    db.freights = [];
  } else if (module === "refuels") {
    db.refuels = [];
  } else if (module === "expenses") {
    db.expenses = [];
  } else if (module === "tires") {
    db.tires = [];
  } else if (module === "maintenance-logs") {
    db.maintenance_logs = [];
  } else if (module === "debts") {
    db.debts = [];
  } else if (module === "caixa-caminhao") {
    db.caixa_caminhao = [];
  } else if (module === "image-analyses") {
    db.image_analyses = [];
  } else if (module === "international-costs") {
    db.internationalCosts = [];
  } else if (module === "company-contacts") {
    db.companyContacts = [];
  } else if (module === "all") {
    db.drivers = [];
    db.vehicles = [];
    db.freights = [];
    db.refuels = [];
    db.expenses = [];
    db.tires = [];
    db.maintenance_logs = [];
    db.debts = [];
    db.caixa_caminhao = [];
    db.image_analyses = [];
  } else {
    return res.status(400).json({ success: false, message: `Módulo inválido: ${module}` });
  }
  
  await saveDB(db);
  res.json({ success: true, message: `Módulo ${module} zerado com sucesso.` });
});

// Reset Database Endpoint (Clear all operational data)
app.post("/api/reset", async (req, res) => {
  const db = (await loadDB());
  db.drivers = [];
  db.vehicles = [];
  db.freights = [];
  db.refuels = [];
  db.expenses = [];
  db.tires = [];
  db.debts = [];
  db.caixa_caminhao = [];
  db.image_analyses = [];
  await saveDB(db);
  res.json({ success: true, message: "Todos os dados operacionais foram resetados com sucesso." });
});

// AI Assistant Endpoint
// AI Assistant Endpoint - Intelligent Operational Assistant
app.post("/api/ai/ask", async (req, res) => {
  const { question, user, image, imageMimeType } = req.body;
  if (!question && !image) {
    return res.status(400).json({ success: false, message: "Mensagem ou imagem é obrigatória." });
  }

  try {
    const db = (await loadDB());
    
    // Create condensed representation of current database entities
    const stateSummary = {
      drivers: db.drivers.map(d => ({
        id: d.id,
        name: d.fullName,
        city: d.city,
        state: d.state,
        cnhCategory: d.cnhCategory,
        status: d.status,
        vehicleId: d.vehicleId
      })),
      vehicles: db.vehicles.map(v => ({
        id: v.id,
        plate: v.plate,
        model: v.model,
        brand: v.brand,
        type: v.type,
        avgConsump: v.averageConsumption,
        currentMileage: v.currentMileage,
        status: v.status
      })),
      freights: db.freights.map(f => {
        const d = db.drivers.find(drv => drv.id === f.driverId);
        const v = db.vehicles.find(vhc => vhc.id === f.vehicleId);
        return {
          id: f.id,
          number: f.freightNumber,
          date: f.date,
          status: f.status,
          driverId: f.driverId,
          driverName: d ? d.fullName : "N/A",
          vehicleId: f.vehicleId,
          vehiclePlate: v ? v.plate : "N/A",
          origin: `${f.origin?.city || ""}-${f.origin?.state || ""}`,
          destination: `${f.destination?.city || ""}-${f.destination?.state || ""}`,
          cargoType: f.cargo?.type || "",
          freightVal: f.financial?.value || 0,
          advance: f.financial?.advance || 0,
          balance: f.financial?.balance || 0,
          startKm: f.mileage?.start || 0
        };
      }),
      caixas: (db.caixa_caminhao || []).map(cx => {
        const v = db.vehicles.find(vhc => vhc.id === cx.veiculo_id);
        return {
          id: cx.id,
          vehicleId: cx.veiculo_id,
          vehiclePlate: v ? v.plate : "N/A",
          saldo_inicial: cx.saldo_inicial,
          saldo_atual: cx.saldo_atual
        };
      }),
      refuels: db.refuels.map(r => ({
        id: r.id,
        date: r.date,
        driverId: r.driverId,
        vehicleId: r.vehicleId,
        gasStation: r.gasStation,
        totalCost: r.totalValue,
        liters: r.liters
      })),
      expensesSummary: db.expenses.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + (Number(e.value) || 0);
        return acc;
      }, {})
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        isCommand: false,
        answer: "A chave API do Gemini (`GEMINI_API_KEY`) não está configurada no painel de Secrets. Por favor, ative-a nas configurações para habilitar a inteligência operacional completa!"
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Clean user object
    const activeUser = user || { role: "Administrador" };

    const systemPrompt = `Você é o "Assistente Operacional Inteligente", um funcionário administrativo virtual para uma transportadora logística brasileira.
Sua missão é interpretar comandos em linguagem natural de motoristas e administradores e traduzi-los em ações estruturadas do sistema, além de responder a dúvidas operacionais reais com base no banco de dados fornecido abaixo.

A data e hora atuais são: ${new Date().toLocaleString("pt-BR")}. A data simulada padrão do sistema de hoje é: 2026-07-01.

DADOS REAIS DA TRANSPORTADORA EM TEMPO REAL:
${JSON.stringify(stateSummary, null, 2)}

DIRETRIZES DE FUNCIONAMENTO:
1. IDENTIFICAR INTENÇÃO:
   - Se o usuário estiver apenas tirando dúvidas gerais (ex: "Quanto gastei com combustível?", "Qual é o saldo do caminhão ABC-1234?", "Mostre todas as despesas do João."), defina "isCommand: false", calcule os valores correspondentes usando os dados reais fornecidos acima e responda de forma elegante em "answer" com tabelas Markdown.
   - Se o usuário estiver tentando registrar, cadastrar ou alterar algo (ex: "Abasteci R$ 1.480 no Posto Pelanda", "Hoje troquei dois pneus por R$ 2.350", "Iniciei a viagem com 285.420 km"), defina "isCommand: true", selecione o "commandType" correto e extraia os dados para "extractedData".

2. SELEÇÃO DE "commandType":
   - "create_expense": Despesas em geral como pedágio, manutenção, alimentação, hospedagem, pneus, etc.
   - "create_refuel": Abastecimento de diesel/combustível.
   - "create_revenue": Recebimento de frete, adiantamento ou faturamento (ex: "Recebi R$ 8.500 de frete").
   - "start_trip": Iniciar uma nova viagem (parâmetros: startKm/odometer, veículo, motorista, origem/destino).
   - "end_trip": Finalizar viagem ativa (parâmetros: endKm/odometer, data, hora).
   - "add_trip_log": Acontecimentos de viagem.
   - "define_caixa_saldo": Definir saldo inicial do caixa de um caminhão.
   - "create_caixa_gasto": Registros específicos de saídas do caixa do motorista.

3. EXTRAÇÃO DE CAMPOS EM "extractedData":
   Tente identificar e associar automaticamente todos os IDs do banco de dados:
   - "vehicleId": Procure o caminhão na lista correspondente pela placa (ex: se disserem "ABC-1234", ache o veículo e defina "vehicleId" como "vhc_1").
   - "driverId": Procure o ID correspondente ao motorista mencionado (ex: "João" corresponde ao ID do motorista "João da Silva").
   - "freightId": Procure um frete "Em andamento" associado ao veículo ou motorista ativo.
   - "value": Valor numérico limpo (ex: "R$ 1.480" -> 1480).
   - "odometer": Quilometragem (número limpo, ex: "285.420 km" -> 285420).
   - "category": Categoria correspondente (ex: "Combustível", "Pneus", "Pedágio", "Alimentação", "Hospedagem", "Manutenção", "Carga", "Descarga", "Outros").
   - "date": Formato YYYY-MM-DD. Use a data atual simulada (2026-07-01) se disser "hoje".
   - "time": Formato HH:MM.
   - "supplier": Nome do posto ou estabelecimento (ex: "Posto Pelanda").
   - "description": Descrição amigável resumindo a operação.

4. NUNCA INVENTE INFORMAÇÕES:
   - Trabalhe apenas com dados informados pelo usuário ou existentes.
   - Se faltar algum dado essencial para o cadastro (ex: valor da despesa, ou qual caminhão foi abastecido), liste-o em "missingFields" e peça na resposta "answer" para o usuário informar o dado faltante.
   - Se houver ambiguidades (ex: dois caminhões elegíveis, ou dois motoristas chamados "João"), não escolha sozinho. Liste em "ambiguities" e pergunte amigavelmente em "answer".

5. RESTRIÇÕES DE PERMISSÕES:
   O usuário atual é: ${JSON.stringify(activeUser)}.
   - Se o papel (role) do usuário for "Motorista", ele só pode registrar e visualizar dados da sua própria viagem ou caminhão! Se tentar registrar para terceiros, recuse na resposta em "answer", definindo "isCommand: false".
   - Administradores têm permissão total para registrar e consultar qualquer dado.

6. LEITURA DE IMAGENS (OCR):
   Se uma imagem for enviada (comprovante, nota fiscal, etc.), faça a análise/OCR dela para preencher automaticamente campos de valor, fornecedor, data, descrição e placa, apresentando o resumo para confirmação.

O SEU RETORNO DEVE SER ESTRITAMENTE UM OBJETO JSON VÁLIDO COM ESTA ESTRUTURA:
{
  "isCommand": boolean,
  "commandType": string | null,
  "extractedData": {
    "category": string | null,
    "value": number | null,
    "date": string | null,
    "time": string | null,
    "vehiclePlate": string | null,
    "vehicleId": string | null,
    "driverName": string | null,
    "driverId": string | null,
    "supplier": string | null,
    "description": string | null,
    "odometer": number | null,
    "location": string | null,
    "freightId": string | null
  } | null,
  "answer": "Sua resposta simpática e formatada ao usuário",
  "missingFields": string[],
  "ambiguities": string[]
}`;

    // Multi-modal parts creation
    const contents: any[] = [];
    if (image && imageMimeType) {
      const cleanBase64 = image.split(",")[1] || image;
      contents.push({
        inlineData: {
          mimeType: imageMimeType,
          data: cleanBase64
        }
      });
    }
    contents.push({ text: question || "Leia esta imagem e extraia os dados operacionais." });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.15,
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json({ success: true, ...parsedJson });

  } catch (error: any) {
    console.error("Erro no assistente operacional Gemini:", error);
    res.status(500).json({ success: false, message: "Erro ao processar inteligência operacional.", details: error.message });
  }
});

// Endpoint to Execute/Save the Confirmed Command
app.post("/api/ai/execute-command", async (req, res) => {
  const { commandType, extractedData, image, user } = req.body;
  if (!commandType || !extractedData) {
    return res.status(400).json({ success: false, message: "Parâmetros incompletos para gravação." });
  }

  try {
    const db = (await loadDB());
    const cleanDate = extractedData.date || todayBrazilISO();
    const cleanTime = extractedData.time || new Date().toTimeString().split(" ")[0].substring(0, 5);
    const valueNum = Number(extractedData.value) || 0;
    const odoNum = Number(extractedData.odometer) || null;

    let responseMessage = "Operação registrada com sucesso!";

    switch (commandType) {
      case "create_expense": {
        const newExpense = {
          id: "exp_" + Date.now(),
          date: cleanDate,
          category: extractedData.category || "Outros",
          value: valueNum,
          description: extractedData.description || `Despesa registrada via Assistente IA`,
          receipt: image || undefined
        };
        db.expenses.push(newExpense);
        responseMessage = `✅ Despesa de R$ ${valueNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${extractedData.category}) registrada com sucesso no sistema!`;

        // If there's a vehicleId, also register in caixa
        if (extractedData.vehicleId) {
          const caixa = db.caixa_caminhao?.find(c => c.veiculo_id === extractedData.vehicleId);
          if (caixa) {
            db.caixa_movimentacoes = db.caixa_movimentacoes || [];
            db.caixa_movimentacoes.push({
              id: "mov_" + Date.now(),
              caixa_id: caixa.id,
              categoria: extractedData.category || "Outros",
              valor: valueNum,
              descricao: extractedData.description || `Gasto registrado via Assistente IA`,
              anexo: image || undefined,
              data: cleanDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            caixa.saldo_atual = (Number(caixa.saldo_atual) || 0) - valueNum;
            caixa.updated_at = new Date().toISOString();
          }
        }

        // Add trip_log if there's an active trip
        const activeFreight = extractedData.freightId ? db.freights.find(f => f.id === extractedData.freightId) : db.freights.find(f => f.vehicleId === extractedData.vehicleId && f.status === "Em andamento");
        if (activeFreight) {
          db.trip_logs.push({
            id: "log_" + Date.now(),
            freightId: activeFreight.id,
            driverId: activeFreight.driverId,
            category: "Outros",
            description: `💸 Despesa: ${extractedData.description || extractedData.category} (R$ ${valueNum})`,
            value: valueNum,
            date: cleanDate,
            time: cleanTime,
            photos: image ? [image] : [],
            approved: true,
            createdAt: new Date().toISOString()
          });
        }
        break;
      }

      case "create_refuel": {
        const liters = Number(extractedData.liters) || (valueNum / 6.0);
        const priceL = Number(extractedData.pricePerLiter) || 6.0;

        const newRefuel = {
          id: "ref_" + Date.now(),
          date: cleanDate,
          driverId: extractedData.driverId || user?.driverId || "",
          vehicleId: extractedData.vehicleId || "",
          gasStation: extractedData.supplier || "Posto via Assistente IA",
          city: extractedData.location || "N/A",
          liters: Number(liters.toFixed(2)),
          pricePerLiter: Number(priceL.toFixed(2)),
          totalValue: valueNum,
          receipt: image || undefined
        };
        db.refuels.push(newRefuel);

        // Save as Expense
        db.expenses.push({
          id: "exp_" + Date.now(),
          date: cleanDate,
          category: "Combustível",
          value: valueNum,
          description: `Abastecimento de combustível no ${extractedData.supplier || "Posto"}`,
          receipt: image || undefined
        });

        responseMessage = `⛽ Abastecimento de R$ ${valueNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${liters.toFixed(1)} Litros) no ${extractedData.supplier || "Posto"} cadastrado com sucesso!`;

        // Register in Caixa
        if (extractedData.vehicleId) {
          const caixa = db.caixa_caminhao?.find(c => c.veiculo_id === extractedData.vehicleId);
          if (caixa) {
            db.caixa_movimentacoes = db.caixa_movimentacoes || [];
            db.caixa_movimentacoes.push({
              id: "mov_" + Date.now(),
              caixa_id: caixa.id,
              categoria: "Combustível",
              valor: valueNum,
              descricao: `Abastecimento de combustível via IA`,
              anexo: image || undefined,
              data: cleanDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            caixa.saldo_atual = (Number(caixa.saldo_atual) || 0) - valueNum;
            caixa.updated_at = new Date().toISOString();
          }
        }

        // Add trip_log
        const activeFreight = db.freights.find(f => (f.vehicleId === extractedData.vehicleId || f.driverId === extractedData.driverId) && f.status === "Em andamento");
        if (activeFreight) {
          db.trip_logs.push({
            id: "log_" + Date.now(),
            freightId: activeFreight.id,
            driverId: activeFreight.driverId,
            category: "Abastecimento",
            description: `⛽ Abastecimento: R$ ${valueNum} no ${extractedData.supplier || "Posto"}`,
            value: valueNum,
            date: cleanDate,
            time: cleanTime,
            photos: image ? [image] : [],
            notes: `L/Preço: ${liters.toFixed(1)}L por R$ ${priceL}/L`,
            approved: true,
            createdAt: new Date().toISOString()
          });
        }

        // Update odometer
        if (odoNum && extractedData.vehicleId) {
          const vhc = db.vehicles.find(v => v.id === extractedData.vehicleId);
          if (vhc) {
            vhc.currentMileage = Math.max(vhc.currentMileage, odoNum);
          }
        }
        break;
      }

      case "create_revenue": {
        responseMessage = `💰 Receita de R$ ${valueNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrada!`;
        
        // Update freight advance if applicable
        if (extractedData.freightId) {
          const freight = db.freights.find(f => f.id === extractedData.freightId);
          if (freight) {
            freight.financial.advance = (Number(freight.financial.advance) || 0) + valueNum;
            freight.financial.balance = Math.max(0, (Number(freight.financial.value) || 0) - freight.financial.advance);
            responseMessage += ` Associada ao Frete ${freight.freightNumber}.`;
          }
        }

        // Save in Caixa
        if (extractedData.vehicleId) {
          const caixa = db.caixa_caminhao?.find(c => c.veiculo_id === extractedData.vehicleId);
          if (caixa) {
            db.caixa_movimentacoes = db.caixa_movimentacoes || [];
            db.caixa_movimentacoes.push({
              id: "mov_" + Date.now(),
              caixa_id: caixa.id,
              categoria: "Adiantamento",
              valor: valueNum,
              descricao: extractedData.description || `Recebimento de frete/adiantamento via Assistente IA`,
              anexo: image || undefined,
              data: cleanDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            caixa.saldo_atual = (Number(caixa.saldo_atual) || 0) + valueNum;
            caixa.updated_at = new Date().toISOString();
          }
        }
        break;
      }

      case "start_trip": {
        const { driverId, vehicleId, location } = extractedData;
        const startKm = odoNum || 0;
        
        const driver = db.drivers.find(d => d.id === driverId);
        const vehicle = db.vehicles.find(v => v.id === vehicleId);

        if (!driver || !vehicle) {
          return res.status(400).json({ success: false, message: "Motorista ou Veículo inválido para início de viagem." });
        }

        driver.status = "Em viagem";
        driver.vehicleId = vehicleId;
        vehicle.status = "Em viagem";
        vehicle.currentMileage = Math.max(vehicle.currentMileage, startKm);

        const count = db.freights.length + 1001;
        const freightId = `frt_${Date.now()}`;
        const newFreight = {
          id: freightId,
          freightNumber: `FRT-${count}`,
          date: cleanDate,
          departureTime: cleanTime,
          arrivalTime: "",
          status: "Em andamento",
          driverId,
          vehicleId,
          origin: { city: location || "Origem", state: "", address: "", company: "" },
          destination: { city: "Destino", state: "", address: "", company: "" },
          cargo: { type: "Geral", description: "Carga de Viagem", qty: 0, unit: "Toneladas" },
          financial: { value: 0, commission: 0, toll: 0, food: 0, lodging: 0, otherExpenses: 0, advance: 0, balance: 0, balanceStatus: "Pendente" },
          mileage: { start: startKm, end: 0, total: 0 },
          observations: extractedData.description || ""
        };
        db.freights.push(newFreight);

        db.trip_logs.push({
          id: "log_start_" + Date.now(),
          freightId,
          driverId,
          category: "Observação",
          description: "🚛 Viagem iniciada via Assistente IA",
          value: undefined,
          date: cleanDate,
          time: cleanTime,
          location: location || "",
          photos: image ? [image] : [],
          notes: `Iniciada com Km: ${startKm}.`,
          approved: true,
          createdAt: new Date().toISOString()
        });

        db.notifications.push({
          id: `ntf_${Date.now()}`,
          message: `🚛 ${driver.fullName} iniciou viagem com o caminhão ${vehicle.plate}. Km Inicial: ${startKm}`,
          date: cleanDate,
          time: cleanTime,
          read: false,
          driverName: driver.fullName,
          freightId
        });

        responseMessage = `🚛 Viagem ${newFreight.freightNumber} do veículo ${vehicle.plate} iniciada com sucesso via Assistente IA!`;
        break;
      }

      case "end_trip": {
        const { freightId } = extractedData;
        const endKm = odoNum || 0;

        const freight = freightId ? db.freights.find(f => f.id === freightId) : db.freights.find(f => (f.vehicleId === extractedData.vehicleId || f.driverId === extractedData.driverId) && f.status === "Em andamento");

        if (!freight) {
          return res.status(400).json({ success: false, message: "Nenhuma viagem em andamento encontrada para este encerramento." });
        }

        const driver = db.drivers.find(d => d.id === freight.driverId);
        const vehicle = db.vehicles.find(v => v.id === freight.vehicleId);

        const startKm = Number(freight.mileage.start) || 0;
        const finalKm = Math.max(startKm, endKm);
        const totalKm = finalKm - startKm;

        freight.status = "Finalizado";
        freight.mileage.end = finalKm;
        freight.mileage.total = totalKm;
        freight.arrivalTime = cleanTime;

        if (driver) driver.status = "Ativo";
        if (vehicle) {
          vehicle.status = "Disponível";
          vehicle.currentMileage = finalKm;
        }

        db.trip_logs.push({
          id: "log_end_" + Date.now(),
          freightId: freight.id,
          driverId: freight.driverId,
          category: "Observação",
          description: "🏁 Viagem finalizada via Assistente IA",
          value: undefined,
          date: cleanDate,
          time: cleanTime,
          photos: image ? [image] : [],
          notes: `Km Final: ${finalKm}. Percorridos: ${totalKm} km.`,
          approved: true,
          createdAt: new Date().toISOString()
        });

        db.notifications.push({
          id: `ntf_${Date.now()}`,
          message: `🏁 ${driver?.fullName || "Motorista"} finalizou viagem do caminhão ${vehicle?.plate || ""}. Rodou ${totalKm} km.`,
          date: cleanDate,
          time: cleanTime,
          read: false,
          driverName: driver?.fullName || "Motorista",
          freightId: freight.id
        });

        responseMessage = `🏁 Viagem ${freight.freightNumber} finalizada com sucesso! Quilômetros rodados: ${totalKm} km.`;
        break;
      }

      case "add_trip_log": {
        const { freightId, category, description, location } = extractedData;
        const activeFreight = freightId ? db.freights.find(f => f.id === freightId) : db.freights.find(f => f.status === "Em andamento");
        
        if (!activeFreight) {
          return res.status(400).json({ success: false, message: "Nenhuma viagem ativa para vincular este acontecimento." });
        }

        db.trip_logs.push({
          id: "log_" + Date.now(),
          freightId: activeFreight.id,
          driverId: activeFreight.driverId,
          category: category || "Observação",
          description: description || "Registro de histórico via Assistente IA",
          value: valueNum || undefined,
          date: cleanDate,
          time: cleanTime,
          location: location || "",
          photos: image ? [image] : [],
          approved: true,
          createdAt: new Date().toISOString()
        });

        responseMessage = `📝 Novo acontecimento (${category}) registrado no histórico da viagem ${activeFreight.freightNumber}!`;
        break;
      }

      case "define_caixa_saldo": {
        const { vehicleId } = extractedData;
        if (!vehicleId) {
          return res.status(400).json({ success: false, message: "ID de Veículo obrigatório para definir saldo." });
        }

        db.caixa_caminhao = db.caixa_caminhao || [];
        let caixa = db.caixa_caminhao.find(c => c.veiculo_id === vehicleId);
        if (caixa) {
          caixa.saldo_inicial = valueNum;
          caixa.saldo_atual = valueNum;
          caixa.observacao = extractedData.description || "Definido via Assistente IA";
          caixa.updated_at = new Date().toISOString();
        } else {
          caixa = {
            id: "cx_" + Date.now(),
            veiculo_id: vehicleId,
            saldo_inicial: valueNum,
            saldo_atual: valueNum,
            observacao: extractedData.description || "Criado via Assistente IA",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          db.caixa_caminhao.push(caixa);
        }
        responseMessage = `💰 Saldo do caixa do caminhão definido em R$ ${valueNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}!`;
        break;
      }

      case "create_caixa_gasto": {
        const { vehicleId, category, description } = extractedData;
        if (!vehicleId) {
          return res.status(400).json({ success: false, message: "ID de Veículo obrigatório para gasto de caixa." });
        }

        const caixa = db.caixa_caminhao?.find(c => c.veiculo_id === vehicleId);
        if (!caixa) {
          return res.status(400).json({ success: false, message: "Este caminhão não possui caixa ativo." });
        }

        db.caixa_movimentacoes = db.caixa_movimentacoes || [];
        db.caixa_movimentacoes.push({
          id: "mov_" + Date.now(),
          caixa_id: caixa.id,
          categoria: category || "Outros",
          valor: valueNum,
          descricao: description || "Gasto de caixa registrado via Assistente IA",
          anexo: image || undefined,
          data: cleanDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        caixa.saldo_atual = (Number(caixa.saldo_atual) || 0) - valueNum;
        caixa.updated_at = new Date().toISOString();
        responseMessage = `💸 Gasto de caixa no valor de R$ ${valueNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrado!`;
        break;
      }

      default:
        return res.status(400).json({ success: false, message: "Tipo de comando desconhecido." });
    }

    await saveDB(db);
    res.json({ success: true, message: responseMessage });

  } catch (error: any) {
    console.error("Erro ao gravar comando IA:", error);
    res.status(500).json({ success: false, message: "Erro interno ao salvar dados.", details: error.message });
  }
});


// Smart Spreadsheet Import Endpoint using Gemini
app.post("/api/ai/import-spreadsheet", async (req, res) => {
  const { content, filename, useHeuristic, customMapping } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: "Conteúdo da planilha é obrigatório." });
  }

  // Robust CSV Line splitting that respects quotes
  function splitCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    // Only a double-quote toggles quoting (RFC 4180). A single quote is a
    // literal character (apostrophes in names/addresses like "D'Ávila"
    // must not corrupt the column split for the rest of the line).
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Parses city and state from strings like "Recife, PE", "Maceió/AL", or "São Paulo - SP"
  function parseCityState(input: string) {
    if (!input) return { city: "", state: "" };
    const parts = input.split(/[,-\/]/).map(p => p.trim());
    if (parts.length >= 2) {
      return { city: parts[0], state: parts[1].toUpperCase().substring(0, 2) };
    }
    return { city: input, state: "" };
  }

  // Robust number parsing (removes R$, currency formatting, spaces, etc.).
  // Detects whether the decimal separator is "," (Brazilian, e.g. "1.234,56")
  // or "." (international, e.g. "1,234.56" or "1234.56") instead of assuming
  // Brazilian formatting unconditionally.
  function parseNumber(input: string | number | undefined | null): number {
    if (input === undefined || input === null) return 0;
    if (typeof input === "number") return input;
    let cleaned = input.replace(/[R$\s]/g, "").trim();
    if (!cleaned) return 0;

    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");

    if (hasComma && hasDot) {
      // Whichever separator appears last is the decimal mark; the other is the thousands separator.
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (hasComma) {
      // Only a comma: treat as decimal mark if 1-2 digits follow it (e.g. "123,45"),
      // otherwise it's a thousands separator with no decimals (e.g. "1,234").
      const afterLastComma = cleaned.split(",").pop() || "";
      cleaned = afterLastComma.length <= 2 ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
    }
    // Only a dot (or no separator): already parseFloat-compatible as-is.

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  // Normalizes dates from spreadsheet cells to YYYY-MM-DD. Handles ISO strings
  // already in that format, DD/MM/YYYY (and DD-MM-YYYY), and Excel's serial
  // date number (days since 1899-12-30) which arrives as a plain numeric string
  // when a date-formatted cell is flattened to CSV.
  function parseDate(input: string | undefined | null): string {
    if (!input) return "";
    const trimmed = input.trim();
    if (!trimmed) return "";

    // Already ISO (YYYY-MM-DD), optionally with a time component.
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

    // Excel serial date number (e.g. "45678").
    if (/^\d{4,6}(\.\d+)?$/.test(trimmed)) {
      const serial = parseFloat(trimmed);
      if (serial > 0) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        const parsed = new Date(epoch.getTime() + serial * 86400000);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
      }
    }

    // DD/MM/YYYY or DD-MM-YYYY (also accepts 2-digit years).
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmyMatch) {
      let [, d, m, y] = dmyMatch;
      if (y.length === 2) y = (Number(y) < 50 ? "20" : "19") + y;
      const day = d.padStart(2, "0");
      const month = m.padStart(2, "0");
      if (Number(month) <= 12 && Number(day) <= 31) {
        return `${y}-${month}-${day}`;
      }
    }

    // Unrecognized format: return as-is rather than guessing further.
    return trimmed;
  }

  try {
    const db = (await loadDB());

    // Prompt instructions for structuring spreadsheet content
    const systemPrompt = `Você é um Analista de Dados e Engenheiro de Dados IA para Transportadoras.
O usuário enviou uma planilha em texto (CSV ou representação textual de XLSX) e você deve analisá-la de forma inteligente, extraindo entidades e mapeando para o nosso banco de dados.

O banco de dados aceita as seguintes entidades e formatos:
1. Drivers (Motoristas): { fullName, cpf, rg, phone, whatsapp, address, city, state, cnh, cnhCategory, cnhExpiration, admissionDate, observations }
2. Vehicles (Veículos): { plate, model, brand, year, type, loadCapacity, tankCapacity, averageConsumption, renavam, chassi, licensingExpiration, currentMileage, nextMaintenance }
3. Freights (Fretes): { date, departureTime, arrivalTime, status (Pendente, Em andamento, Finalizado, Cancelado), origin: { city, state, address, company }, destination: { city, state, address, company }, cargo: { type, description, qty, unit (Quilos, Toneladas, Litros, Sacos, Caixas, Paletes) }, financial: { value, commission, toll, food, lodging, otherExpenses }, mileage: { start, end, total } }
4. Refuels (Abastecimentos): { date, gasStation, city, liters, pricePerLiter, totalValue }
5. Expenses (Despesas): { date, category (Combustível, Alimentação, Hospedagem, Pedágio, Oficina, Pneus, Seguro, Outros), value, description }

Instruções críticas:
- Se encontrar uma linha como "João Silva | Recife | Maceió | 550 KM | R$ 7.500 | 100L", você deve inteligir e deduzir as relações correspondentes.
- Extraia apenas os dados que estão realmente presentes na planilha. NUNCA invente, deduza ou gere valores fictícios para campos que não estejam explicitamente na planilha (CPF, CNH, placa, RG, etc.) — isso pode gerar cadastros com documentos incorretos numa transportadora real.
- Se um campo obrigatório (ex: CPF, CNH) não estiver presente na planilha, retorne esse campo como string vazia ("") em vez de inventar um valor. É preferível um campo vazio a um dado incorreto.
- O "Nome do arquivo" enviado junto ao conteúdo é apenas metadado de contexto, NUNCA um dado da planilha. Nunca use o nome do arquivo (ou qualquer parte dele) como valor de placa, motorista, categoria ou qualquer outro campo extraído.
- Corrija apenas inconsistências óbvias de formatação (espaços, capitalização), sem alterar o conteúdo real dos dados. Elimine registros duplicados.
- Se houver motoristas ou veículos novos descritos na planilha, adicione-os na lista de drivers/vehicles criados.
- Se a planilha estiver com cabeçalhos ou campos em português, faça a tradução e mapeamento cognitivo correto (ex: 'Motorista' -> driverName ou fullName; 'Placa' -> vehiclePlate; 'Destino' -> destination.city; 'Custo', 'Valor' ou 'Preço' -> value; 'Combustível' ou 'Abastecimento' -> Refuels).
- Retorne a resposta ESTRITAMENTE em formato JSON que segue o schema de resposta especificado, sem blocos markdown extras (no \`\`\`json \`\`\` tags).

O formato de retorno do JSON deve ser:
{
  "summary": "Resumo em uma frase do que foi importado com sucesso.",
  "newDrivers": [ ... ],
  "newVehicles": [ ... ],
  "newFreights": [ ... ],
  "newExpenses": [ ... ],
  "newRefuels": [ ... ]
}`;

    let parsedResult = {
      summary: "Importação realizada com sucesso no modo local.",
      newDrivers: [] as any[],
      newVehicles: [] as any[],
      newFreights: [] as any[],
      newExpenses: [] as any[],
      newRefuels: [] as any[]
    };

    let usedOfflineFallback = false;
    let offlineFallbackReason = "";

    // Force Heuristic Local Parser if specified
    if (useHeuristic) {
      usedOfflineFallback = true;
      offlineFallbackReason = "Importação processada com sucesso usando o algoritmo de mapeamento de colunas de alta precisão.";
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        const response = await withTimeout(ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Conteúdo da planilha (extraia dados SOMENTE deste conteúdo, ignore tudo abaixo desta linha ao extrair valores):\n${content}\n\n--- FIM DO CONTEÚDO DA PLANILHA ---\n\nEstas informações abaixo são apenas metadados de contexto e NUNCA devem ser usadas como valores extraídos (ex: o nome do arquivo não é uma placa, motorista ou qualquer outro dado):\nNome do arquivo: ${filename || "import.csv"}${customMapping ? `\nMapeamento Manual fornecido pelo usuário:\n${JSON.stringify(customMapping, null, 2)}` : ""}`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                newDrivers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      fullName: { type: Type.STRING },
                      cpf: { type: Type.STRING },
                      rg: { type: Type.STRING },
                      phone: { type: Type.STRING },
                      whatsapp: { type: Type.STRING },
                      address: { type: Type.STRING },
                      city: { type: Type.STRING },
                      state: { type: Type.STRING },
                      cnh: { type: Type.STRING },
                      cnhCategory: { type: Type.STRING },
                      cnhExpiration: { type: Type.STRING },
                      admissionDate: { type: Type.STRING },
                      observations: { type: Type.STRING }
                    }
                  }
                },
                newVehicles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      plate: { type: Type.STRING },
                      model: { type: Type.STRING },
                      brand: { type: Type.STRING },
                      year: { type: Type.STRING },
                      type: { type: Type.STRING },
                      loadCapacity: { type: Type.STRING },
                      tankCapacity: { type: Type.STRING },
                      averageConsumption: { type: Type.STRING },
                      renavam: { type: Type.STRING },
                      chassi: { type: Type.STRING },
                      licensingExpiration: { type: Type.STRING },
                      currentMileage: { type: Type.NUMBER },
                      nextMaintenance: { type: Type.NUMBER }
                    }
                  }
                },
                newFreights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      departureTime: { type: Type.STRING },
                      arrivalTime: { type: Type.STRING },
                      status: { type: Type.STRING },
                      driverName: { type: Type.STRING, description: "Name of the driver to match or create" },
                      vehiclePlate: { type: Type.STRING, description: "Plate of the vehicle to match or create" },
                      origin: {
                        type: Type.OBJECT,
                        properties: {
                          city: { type: Type.STRING },
                          state: { type: Type.STRING },
                          address: { type: Type.STRING },
                          company: { type: Type.STRING }
                        }
                      },
                      destination: {
                        type: Type.OBJECT,
                        properties: {
                          city: { type: Type.STRING },
                          state: { type: Type.STRING },
                          address: { type: Type.STRING },
                          company: { type: Type.STRING }
                        }
                      },
                      cargo: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          description: { type: Type.STRING },
                          qty: { type: Type.NUMBER },
                          unit: { type: Type.STRING }
                        }
                      },
                      financial: {
                        type: Type.OBJECT,
                        properties: {
                          value: { type: Type.NUMBER },
                          commission: { type: Type.NUMBER },
                          toll: { type: Type.NUMBER },
                          food: { type: Type.NUMBER },
                          lodging: { type: Type.NUMBER },
                          otherExpenses: { type: Type.NUMBER }
                        }
                      },
                      mileage: {
                        type: Type.OBJECT,
                        properties: {
                          start: { type: Type.NUMBER },
                          end: { type: Type.NUMBER },
                          total: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                },
                newExpenses: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      category: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      description: { type: Type.STRING }
                    }
                  }
                },
                newRefuels: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      driverName: { type: Type.STRING },
                      vehiclePlate: { type: Type.STRING },
                      gasStation: { type: Type.STRING },
                      city: { type: Type.STRING },
                      liters: { type: Type.NUMBER },
                      pricePerLiter: { type: Type.NUMBER },
                      totalValue: { type: Type.NUMBER }
                    }
                  }
                }
              },
              required: ["newDrivers", "newVehicles", "newFreights", "newExpenses", "newRefuels"]
            }
          }
        }), 25000);

        if (response.text) {
          const aiResult = sanitizePlaceholders(JSON.parse(response.text));
          parsedResult = {
            summary: "",
            newDrivers: aiResult.newDrivers || [],
            newVehicles: aiResult.newVehicles || [],
            newFreights: aiResult.newFreights || [],
            newExpenses: aiResult.newExpenses || [],
            newRefuels: aiResult.newRefuels || []
          };
        }
      } catch (geminiError: any) {
        console.warn("Erro ao chamar o Gemini API (ativando fallback offline):", geminiError);
        usedOfflineFallback = true;
        offlineFallbackReason = "A Inteligência Artificial está temporariamente indisponível devido a alta demanda de rede (Erro 503). O motor heurístico offline local da Fleet One foi ativado e processou seus dados com sucesso!";
      }
    }

    if (!process.env.GEMINI_API_KEY || usedOfflineFallback) {
      // Offline CSV parser fallback
      const lines = content.split("\n").filter((l: string) => l.trim().length > 0);
      if (lines.length > 0) {
        // Delimiter detection
        const delimiters = [";", ",", "|", "\t"];
        let delimiter = ";";
        let maxCount = 0;
        const sampleLines = lines.slice(0, 5);
        for (const delim of delimiters) {
          let count = 0;
          for (const l of sampleLines) {
            count += (l.split(delim).length - 1);
          }
          if (count > maxCount) {
            maxCount = count;
            delimiter = delim;
          }
        }

        const headers = splitCSVLine(lines[0], delimiter).map(h => h.trim());
        const headersLower = headers.map(h => h.toLowerCase());

        // Whole-word/phrase matching only — a loose substring match (e.g. "de" inside
        // "Cidade", or positional guessing when a column isn't found) is what caused
        // values from one column to leak into the wrong field.
        const headerMatchesKeyword = (header: string, keyword: string) => {
          if (header === keyword) return true;
          const words = header.split(/[^a-z0-9çãáàâéêíóôõúü]+/i).filter(Boolean);
          if (!keyword.includes(" ")) return words.includes(keyword);
          const keywordWords = keyword.split(" ").filter(Boolean);
          for (let i = 0; i <= words.length - keywordWords.length; i++) {
            if (keywordWords.every((kw, j) => words[i + j] === kw)) return true;
          }
          return false;
        };

        const getColIndex = (mappedName: string | undefined, keys: string[]): number => {
          if (mappedName) {
            const idx = headers.findIndex(h => h === mappedName);
            if (idx !== -1) return idx;
          }
          return headersLower.findIndex(h => keys.some(k => headerMatchesKeyword(h, k)));
        };

        const driverIdx = getColIndex(customMapping?.driverCol, ["motorista", "driver", "condutor", "funcionario", "colaborador", "piloto"]);
        const plateIdx = getColIndex(customMapping?.vehicleCol, ["placa", "veiculo", "veículo", "caminhao", "caminhão", "carro", "plate", "vehicle", "cavalo"]);
        const originIdx = getColIndex(customMapping?.originCol, ["origem", "departure", "origin", "partida"]);
        const destIdx = getColIndex(customMapping?.destinationCol, ["destino", "para", "arrival", "destination", "chegada"]);
        const valueIdx = getColIndex(customMapping?.valueCol, ["valor", "frete", "preço", "preco", "custo", "total", "value", "receita", "faturamento"]);
        const kmIdx = getColIndex(customMapping?.mileageCol, ["km", "distancia", "distância", "quilometragem", "mileage", "dist"]);
        const dateIdx = getColIndex(customMapping?.dateCol, ["data", "date", "dia", "periodo", "período"]);
        const litersIdx = getColIndex(customMapping?.litersCol, ["litros", "litro", "liters", "vol", "volume", "abastecido"]);
        const categoryIdx = getColIndex(customMapping?.categoryCol, ["categoria", "category", "tipo despesa", "despesa"]);
        const descIdx = getColIndex(customMapping?.descCol, ["descricao", "descrição", "obs", "observacao", "observações", "memo", "detalhe"]);

        let addedCount = 0;
        const tempAddedDrivers: any[] = [];
        const tempAddedVehicles: any[] = [];

        // Determine if we should treat row 0 as a header or skip it
        const hasHeader = driverIdx !== -1 || plateIdx !== -1 || originIdx !== -1 || destIdx !== -1;
        const startRowIdx = hasHeader ? 1 : 0;

        for (let i = startRowIdx; i < lines.length; i++) {
          const line = lines[i];
          const cells = splitCSVLine(line, delimiter);
          if (cells.length < 2) continue; // Skip empty/unstructured lines

          // Extract row values strictly by matched column index. A column that wasn't
          // detected is left empty rather than guessed by position — guessing caused
          // values from unrelated columns (e.g. Origem) to leak into the wrong field.
          const name = (driverIdx !== -1 && driverIdx < cells.length) ? cells[driverIdx] : "";
          const plate = (plateIdx !== -1 && plateIdx < cells.length) ? cells[plateIdx] : "";
          const originStr = (originIdx !== -1 && originIdx < cells.length) ? cells[originIdx] : "";
          const destStr = (destIdx !== -1 && destIdx < cells.length) ? cells[destIdx] : "";
          const valStr = (valueIdx !== -1 && valueIdx < cells.length) ? cells[valueIdx] : "";
          const kmStr = (kmIdx !== -1 && kmIdx < cells.length) ? cells[kmIdx] : "";
          const dateStr = (dateIdx !== -1 && dateIdx < cells.length) ? cells[dateIdx] : "";
          const litersStr = (litersIdx !== -1 && litersIdx < cells.length) ? cells[litersIdx] : "";
          const categoryStr = (categoryIdx !== -1 && categoryIdx < cells.length) ? cells[categoryIdx] : "";
          const descStr = (descIdx !== -1 && descIdx < cells.length) ? cells[descIdx] : "";

          if (!name && !plate && !originStr && !destStr && !valStr) {
            continue; // Empty row
          }

          // Skip headers repeating in columns
          if (name?.toLowerCase() === "motorista" || name?.toLowerCase() === "nome" || plate?.toLowerCase() === "placa") {
            continue;
          }

          // 1. Process Driver
          let drvId = "drv_1";
          if (name) {
            const driverExists = db.drivers.some(d => d.fullName.toLowerCase() === name.toLowerCase()) ||
                                 tempAddedDrivers.some(d => d.fullName.toLowerCase() === name.toLowerCase());
            if (!driverExists) {
              const newDrv = {
                id: `drv_${Date.now()}_local_${addedCount}`,
                fullName: name,
                cpf: "",
                rg: "",
                phone: "",
                whatsapp: "",
                address: "",
                city: originStr ? parseCityState(originStr).city : "",
                state: originStr ? parseCityState(originStr).state : "",
                cnh: "",
                cnhCategory: "",
                cnhExpiration: "",
                photo: "",
                admissionDate: new Date().toISOString().split('T')[0],
                observations: "Importado via planilha. Complete o cadastro."
              };
              tempAddedDrivers.push(newDrv);
              drvId = newDrv.id;
              parsedResult.newDrivers.push(newDrv);
            } else {
              const found = db.drivers.find(d => d.fullName.toLowerCase() === name.toLowerCase()) ||
                            tempAddedDrivers.find(d => d.fullName.toLowerCase() === name.toLowerCase());
              if (found) drvId = found.id;
            }
          }

          // 2. Process Vehicle
          let vhcId = "vhc_1";
          if (plate) {
            const normPlate = plate.toUpperCase().replace(/[^A-Z0-9-]/g, "");
            const vehicleExists = db.vehicles.some(v => v.plate.toUpperCase().replace(/[^A-Z0-9-]/g, "") === normPlate) ||
                                  tempAddedVehicles.some(v => v.plate.toUpperCase().replace(/[^A-Z0-9-]/g, "") === normPlate);
            if (!vehicleExists) {
              const newVhc = {
                id: `vhc_${Date.now()}_local_${addedCount}`,
                plate: plate.toUpperCase(),
                model: "",
                brand: "",
                year: "",
                type: "",
                loadCapacity: "",
                tankCapacity: "",
                averageConsumption: "",
                renavam: "",
                chassi: "",
                licensingExpiration: "",
                currentMileage: 0,
                nextMaintenance: 0,
                maintenanceHistory: []
              };
              tempAddedVehicles.push(newVhc);
              vhcId = newVhc.id;
              parsedResult.newVehicles.push(newVhc);
            } else {
              const found = db.vehicles.find(v => v.plate.toUpperCase().replace(/[^A-Z0-9-]/g, "") === normPlate) ||
                            tempAddedVehicles.find(v => v.plate.toUpperCase().replace(/[^A-Z0-9-]/g, "") === normPlate);
              if (found) vhcId = found.id;
            }
          }

          const km = parseNumber(kmStr);
          const val = parseNumber(valStr);
          const liters = parseNumber(litersStr);
          const formattedDate = parseDate(dateStr) || new Date().toISOString().split('T')[0];

          // Is it a refuel row?
          if (liters > 0 || categoryStr.toLowerCase().includes("combustivel") || descStr.toLowerCase().includes("abastec") || descStr.toLowerCase().includes("posto")) {
            const price = liters > 0 && val > 0 ? Math.round((val / liters) * 100) / 100 : 0;
            parsedResult.newRefuels.push({
              date: formattedDate,
              driverName: name || "",
              driverId: drvId,
              vehiclePlate: plate || "",
              vehicleId: vhcId,
              gasStation: descStr || "",
              city: originStr ? parseCityState(originStr).city : "",
              liters: liters,
              pricePerLiter: price,
              totalValue: val
            });
          }
          // Is it an expense row?
          else if (categoryStr || (val > 0 && !originStr && !destStr)) {
            parsedResult.newExpenses.push({
              date: formattedDate,
              category: (categoryStr || "Outros"),
              value: val,
              description: descStr || ""
            });
          }
          // Otherwise it's a freight/route
          else {
            const originInfo = parseCityState(originStr);
            const destInfo = parseCityState(destStr);
            parsedResult.newFreights.push({
              id: `frt_${Date.now()}_local_${addedCount}`,
              freightNumber: `FRT-${db.freights.length + 1001 + addedCount}`,
              date: formattedDate,
              departureTime: "",
              arrivalTime: "",
              status: "Pendente",
              driverName: name || "",
              driverId: drvId,
              vehiclePlate: plate || "",
              vehicleId: vhcId,
              origin: {
                city: originInfo.city || "",
                state: originInfo.state || "",
                address: "",
                company: ""
              },
              destination: {
                city: destInfo.city || "",
                state: destInfo.state || "",
                address: "",
                company: ""
              },
              cargo: {
                type: "",
                description: descStr || "",
                qty: 0,
                unit: "Quilos"
              },
              financial: {
                value: val,
                commission: 0,
                toll: 0,
                food: 0,
                lodging: 0,
                otherExpenses: 0
              },
              mileage: {
                start: 0,
                end: km,
                total: km
              }
            });
          }
          addedCount++;
        }
      }
      
    }

    // Build the summary ourselves from the actual counts instead of trusting free-form
    // AI-generated prose, which has produced malformed numbers in practice.
    const countsSummary = `Encontramos ${parsedResult.newDrivers.length} motorista(s), ${parsedResult.newVehicles.length} veículo(s), ${parsedResult.newFreights.length} frete(s), ${parsedResult.newRefuels.length} abastecimento(s) e ${parsedResult.newExpenses.length} despesa(s).`;
    parsedResult.summary = usedOfflineFallback
      ? `${offlineFallbackReason} ${countsSummary}`
      : countsSummary;

    res.json({ success: true, ...parsedResult, offlineFallback: usedOfflineFallback });
  } catch (error: any) {
    console.error("Erro ao analisar planilha com IA:", error);
    res.status(500).json({ success: false, message: "Erro ao analisar planilha com inteligência artificial.", details: error.message });
  }
});

// Endpoint to confirm and persist mapped data to db.json
app.post("/api/ai/save-imported-data", async (req, res) => {
  const { parsedResult } = req.body;
  if (!parsedResult) {
    return res.status(400).json({ success: false, message: "Resultado para salvamento é obrigatório." });
  }

  try {
    const db = (await loadDB());

    // 1. Process new drivers
    parsedResult.newDrivers?.forEach((d: any) => {
      const exists = db.drivers.some((existing: any) => existing.fullName?.toLowerCase() === d.fullName?.toLowerCase());
      if (!exists) {
        if (!d.id) {
          d.id = `drv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        }
        db.drivers.push(d);
      }
    });

    // 2. Process new vehicles
    parsedResult.newVehicles?.forEach((v: any) => {
      const exists = db.vehicles.some((existing: any) => existing.plate?.toUpperCase().replace(/[^A-Z0-9-]/g, "") === v.plate?.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
      if (!exists) {
        if (!v.id) {
          v.id = `vhc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        }
        v.maintenanceHistory = v.maintenanceHistory || [];
        db.vehicles.push(v);
      }
    });

    // Helpers to link driver and vehicle securely, creating them dynamically if they don't exist yet.
    // Fields we don't actually know from the spreadsheet are left blank rather than
    // fabricated (a random CPF/CNH/RENAVAM would be a real, incorrect document).
    const getOrCreateDriverByName = (name: string | undefined | null): string => {
      if (!name || typeof name !== 'string') return db.drivers[0]?.id || "";
      const normalized = name.trim().toLowerCase();

      const matched = db.drivers.find((d: any) => d.fullName?.trim().toLowerCase() === normalized);
      if (matched) return matched.id;

      const newDrv = {
        id: `drv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fullName: name.trim(),
        cpf: "",
        rg: "",
        phone: "",
        whatsapp: "",
        address: "",
        city: "",
        state: "",
        cnh: "",
        cnhCategory: "",
        cnhExpiration: "",
        admissionDate: new Date().toISOString().split('T')[0],
        observations: "Criado automaticamente via correspondência de nome na planilha. Complete o cadastro."
      };

      db.drivers.push(newDrv);
      return newDrv.id;
    };

    const getOrCreateVehicleByPlate = (plate: string | undefined | null): string => {
      if (!plate || typeof plate !== 'string') return db.vehicles[0]?.id || "";
      const normalized = plate.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");

      const matched = db.vehicles.find((v: any) => v.plate?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") === normalized);
      if (matched) return matched.id;

      const newVhc = {
        id: `vhc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        plate: plate.trim().toUpperCase(),
        model: "",
        brand: "",
        year: "",
        type: "",
        loadCapacity: "",
        tankCapacity: "",
        averageConsumption: "",
        renavam: "",
        chassi: "",
        licensingExpiration: "",
        currentMileage: 0,
        nextMaintenance: 0,
        maintenanceHistory: []
      };

      db.vehicles.push(newVhc);
      return newVhc.id;
    };

    // 3. Process new freights
    parsedResult.newFreights?.forEach((f: any) => {
      f.id = `frt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      f.freightNumber = `FRT-${db.freights.length + 1001}`;
      f.driverId = getOrCreateDriverByName(f.driverName || f.driverId);
      f.vehicleId = getOrCreateVehicleByPlate(f.vehiclePlate || f.vehicleId);
      delete f.driverName;
      delete f.vehiclePlate;
      db.freights.push(f);
    });

    // 4. Process new expenses
    parsedResult.newExpenses?.forEach((e: any) => {
      e.id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      db.expenses.push(e);
    });

    // 5. Process new refuels
    parsedResult.newRefuels?.forEach((r: any) => {
      r.id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      r.driverId = getOrCreateDriverByName(r.driverName || r.driverId);
      r.vehicleId = getOrCreateVehicleByPlate(r.vehiclePlate || r.vehicleId);
      delete r.driverName;
      delete r.vehiclePlate;

      db.refuels.push(r);
      
      // Also create Fuel expense
      db.expenses.push({
        id: `exp_ref_${r.id}`,
        date: r.date || new Date().toISOString().split('T')[0],
        category: "Combustível",
        value: Number(r.totalValue) || 0,
        description: `Abastecimento (${r.liters}L) - Posto: ${r.gasStation || "Posto Importado"}`,
        receipt: ""
      });
    });

    await saveDB(db);
    res.json({ success: true, message: "Dados importados e salvos com sucesso na Fleet One!" });
  } catch (error: any) {
    console.error("Erro ao salvar dados importados:", error);
    res.status(500).json({ success: false, message: "Erro ao salvar registros na Fleet One.", details: error.message });
  }
});

// =========================================================
// LEITURA INTELIGENTE DE IMAGENS - ENDPOINTS
// =========================================================

app.get("/api/image-analyses", async (req, res) => {
  const db = (await loadDB());
  res.json({ success: true, analyses: db.image_analyses || [] });
});

app.put("/api/image-analyses/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.image_analyses = db.image_analyses || [];
  const idx = db.image_analyses.findIndex(a => a.id === id);
  if (idx !== -1) {
    db.image_analyses[idx].result = req.body.result;
    db.image_analyses[idx].infoCount = 
      (req.body.result.values?.length || 0) + 
      (req.body.result.categories?.length || 0) + 
      (req.body.result.dates?.length || 0) +
      (req.body.result.tables?.length || 0) +
      (req.body.result.charts?.length || 0);
    await saveDB(db);
    res.json({ success: true, analysis: db.image_analyses[idx] });
  } else {
    res.status(404).json({ success: false, message: "Análise não encontrada." });
  }
});

app.delete("/api/image-analyses/:id", async (req, res) => {
  const { id } = req.params;
  const db = (await loadDB());
  db.image_analyses = db.image_analyses || [];
  db.image_analyses = db.image_analyses.filter(a => a.id !== id);
  await saveDB(db);
  res.json({ success: true });
});

app.post("/api/image-analyses/analyze", async (req, res) => {
  const { image, imageName, mimeType } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: "A imagem em formato base64 é obrigatória." });
  }

  const cleanMimeType = mimeType || "image/png";
  const base64Data = image.split(",")[1] || image;

  let parsedResult: any = null;
  let usedOfflineFallback = false;
  let offlineFallbackReason = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const imagePart = {
        inlineData: {
          mimeType: cleanMimeType,
          data: base64Data,
        },
      };

      const systemPrompt = `Você é o motor de IA Cognitivo e Multimodal da transportadora Fleet One. Sua missão é analisar imagens de qualquer tipo de documento operacional (como recibos, notas, faturas, planilhas, tabelas, gráficos, relatórios, comprovantes, etc.) e extrair todas as informações de forma estruturada, contextual e inteligente.
Extraia:
- Todos os textos importantes e números isolados relevantes.
- Todos os valores monetários com uma descrição curta, valor em número real e tipo de lançamento: 'despesa', 'receita', ou 'neutro'.
- Categorias operacionais (identifique se é 'Pneus', 'Combustível', 'Oficina', 'Pedágio', 'Alimentação', 'Hospedagem', 'Seguro', 'Outros', ou 'Receitas').
- Todas as datas encontradas (preferred format YYYY-MM-DD), horários, códigos/seriais relevantes, telefones, CPF/CNPJ, endereços físicos e placas de veículos.
- Cores de destaque utilizadas para organizar informações e o seu significado no contexto (com nível de certeza: 'Certa', 'Incertas', ou 'Nenhuma').
- Se houver tabelas, reconstrua-as com títulos, cabeçalhos de coluna e linhas de dados (rows).
- Se houver gráficos ou diagramas, explique de forma descritiva detalhada as tendências, os picos, as quedas e conclusões operacionais.
- Gere um resumo inteligente estruturado contendo KPIs de negócios (total de registros encontrados, total de gastos, total de receitas, lucro estimado do documento, contagem de categorias distintas e avisos ou alertas de atenção em vermelho ou urgente).
- Coordenadas de visualização (Interactive Highlights): para ajudar o usuário a localizar dados chaves, identifique onde na imagem essas informações aparecem através de uma bounding box com coordenadas normalizadas de 0 a 100 (x, y do canto superior esquerdo, largura (width) e altura (height) relativas ao tamanho total da imagem). Tente mapear de 3 a 8 itens chave.
Retorne a resposta estritamente em formato JSON que segue o schema de resposta especificado. Se não houver alguma informação, retorne um array vazio ou campo correspondente coerente.`;

      const response = await withTimeout(ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          imagePart,
          { text: "Analise esta imagem de documento de transporte de acordo com as instruções do sistema." }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              texts: { type: Type.ARRAY, items: { type: Type.STRING } },
              numbers: { type: Type.ARRAY, items: { type: Type.STRING } },
              values: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    original: { type: Type.STRING },
                    type: { type: Type.STRING }
                  }
                }
              },
              dates: { type: Type.ARRAY, items: { type: Type.STRING } },
              times: { type: Type.ARRAY, items: { type: Type.STRING } },
              codes: { type: Type.ARRAY, items: { type: Type.STRING } },
              phones: { type: Type.ARRAY, items: { type: Type.STRING } },
              documents: { type: Type.ARRAY, items: { type: Type.STRING } },
              addresses: { type: Type.ARRAY, items: { type: Type.STRING } },
              plates: { type: Type.ARRAY, items: { type: Type.STRING } },
              quantities: { type: Type.ARRAY, items: { type: Type.STRING } },
              percentages: { type: Type.ARRAY, items: { type: Type.STRING } },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    color: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    confidence: { type: Type.STRING }
                  }
                }
              },
              tables: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
                  }
                }
              },
              charts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  }
                }
              },
              summary: {
                type: Type.OBJECT,
                properties: {
                  totalRecords: { type: Type.NUMBER },
                  totalExpenses: { type: Type.NUMBER },
                  totalRevenues: { type: Type.NUMBER },
                  estimatedProfit: { type: Type.NUMBER },
                  categoriesCount: { type: Type.NUMBER },
                  alerts: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              interactiveHighlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    fieldName: { type: Type.STRING },
                    valueText: { type: Type.STRING },
                    boundingPercent: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              },
              observations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["texts", "numbers", "values", "dates", "categories", "tables", "summary", "observations"]
          }
        }
      }), 25000);

      if (response.text) {
        parsedResult = sanitizePlaceholders(JSON.parse(response.text));
      }
    } catch (geminiError: any) {
      console.warn("Erro ao processar imagem no Gemini (ativando simulador offline):", geminiError);
      usedOfflineFallback = true;
      offlineFallbackReason = "Serviço de Inteligência Artificial ocupado (Erro 503). O processador heurístico local da Fleet One interpretou o documento offline.";
    }
  } else {
    usedOfflineFallback = true;
    offlineFallbackReason = "API Key do Gemini não configurada. Ativando o simulador heurístico cognitivo de alta fidelidade para fins de demonstração.";
  }

  // If the AI couldn't analyze the image, be honest about it instead of returning
  // fabricated data (a fake receipt/report) that has nothing to do with the
  // actual uploaded document.
  if (!parsedResult || usedOfflineFallback) {
    return res.status(503).json({
      success: false,
      message: offlineFallbackReason || "Não foi possível analisar a imagem no momento. Tente novamente em instantes."
    });
  }

  // Create record
  const db = (await loadDB());
  db.image_analyses = db.image_analyses || [];

  const infoCount = 
    (parsedResult.values?.length || 0) + 
    (parsedResult.categories?.length || 0) + 
    (parsedResult.dates?.length || 0) +
    (parsedResult.tables?.length || 0) +
    (parsedResult.charts?.length || 0);

  // Persist the analyzed image in Storage instead of embedding the base64 blob
  let storedImageUrl = image;
  const ext = cleanMimeType.split("/")[1] || "png";
  const storagePath = `image-analyses/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(storagePath, Buffer.from(base64Data, "base64"), { contentType: cleanMimeType });
  if (!uploadError) {
    const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(storagePath);
    storedImageUrl = publicUrlData.publicUrl;
  }

  const newRecord = {
    id: "img_" + Date.now(),
    imageName: imageName || "imagem_analisada.png",
    imageData: storedImageUrl, // Store the uploaded image itself to render visual outlines on click
    mimeType: cleanMimeType,
    date: new Date().toISOString(),
    infoCount: infoCount,
    status: "Concluído",
    result: parsedResult
  };

  db.image_analyses.unshift(newRecord);
  await saveDB(db);

  res.json({ success: true, record: newRecord });
});

// Setup Vite & Express
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
