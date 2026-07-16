export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  token?: string;
  driverId?: string; // Linked driver id
}

export interface DriverDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Driver {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiration: string;
  photo?: string;
  admissionDate: string;
  observations?: string;
  email?: string;
  vehicleId?: string;
  status?: string; // Ativo, Em Viagem, Inativo, etc.
  temporaryPassword?: string;
  authUserId?: string;
  bio?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  documents?: DriverDocument[];
}

export interface MaintenanceRecord {
  date: string;
  km: number;
  type: string;
  description: string;
  value: number;
}

export interface VehicleDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: string;
  type: string;
  loadCapacity: string;
  tankCapacity: string;
  averageConsumption: string;
  renavam: string;
  chassi: string;
  licensingExpiration: string;
  photo?: string;
  status?: string;
  currentMileage: number;
  nextMaintenance: number;
  maintenanceHistory: MaintenanceRecord[];
  documents?: VehicleDocument[];
}

export interface CompanyProfile {
  name: string;
  cnpj: string;
  stateRegistration: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  contratoSocialUrl: string;
  contratoSocialName: string;
  logoUrl: string;
  taxRate?: string;
}

export interface RouteStop {
  city: string;
  state: string;
  address: string;
  company: string;
  country?: string;
}

export interface CargoDetails {
  type: string;
  description: string;
  qty: number;
  unit: "Quilos" | "Toneladas" | "Litros" | "Sacos" | "Caixas" | "Paletes";
}

export interface FinancialDetails {
  value: number;
  commission: number;
  toll: number;
  food: number;
  lodging: number;
  otherExpenses: number;
  dailyAllowance?: number; // Diária
  dispatcherFee?: number;  // Despachante
  loadingFee?: number;     // Chapa (carga/descarga)
  advance?: number;       // Adiantamento (Frete Pago)
  balance?: number;       // Saldo (Frete Não Pago)
  balanceStatus?: "Pendente" | "Pago"; // Status do Saldo
  commissionPaid?: number;      // Comissão já paga ao motorista
  commissionPending?: number;   // Comissão ainda pendente de pagamento ao motorista
  commissionReceiptUrl?: string; // Comprovante de pagamento da comissão
}

export interface MileageDetails {
  start: number;
  end: number;
  total: number;
}

export interface Freight {
  id: string;
  freightNumber: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  status: "Pendente" | "Em andamento" | "Finalizado" | "Cancelado";
  driverId: string;
  vehicleId: string;
  origin: RouteStop;
  destination: RouteStop;
  cargo: CargoDetails;
  financial: FinancialDetails;
  mileage: MileageDetails;
}

export interface Refuel {
  id: string;
  date: string;
  driverId: string;
  vehicleId: string;
  gasStation: string;
  city: string;
  liters: number;
  pricePerLiter: number;
  totalValue: number;
  odometer?: number;
  receipt?: string;
}

export interface Expense {
  id: string;
  date: string;       // Data de lançamento (quando a despesa/compra aconteceu)
  dueDate?: string;    // Data de vencimento (quando deve/deveria ser paga)
  category: "Combustível" | "Alimentação" | "Hospedagem" | "Pedágio" | "Oficina" | "Pneus" | "Seguro" | "Outros";
  value: number;
  description: string;
  receipt?: string;
  status?: "Pendente" | "Pago";
  installments?: number;  // Número total de parcelas (padrão 1 = à vista)
  paidAmount?: number;    // Valor já pago (acumulado, em R$) desta despesa
  lastPaymentCurrency?: string;      // Moeda usada no último pagamento (BRL, USD, ARS, CLP)
  lastPaymentExchangeRate?: number;  // Cotação usada no último pagamento
}

export interface TireChange {
  id: string;
  date: string;
  type: "Instalação" | "Remoção" | "Reparo" | "Recapagem" | "Descarte";
  km: number;
  vehicleId?: string;
  position?: string;
  description: string;
}

export interface TireRotation {
  id: string;
  date: string;
  km: number;
  fromPosition: string;
  toPosition: string;
  description: string;
}

export interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  status: "Em uso" | "Estoque" | "Recapagem" | "Descartado";
  vehicleId?: string;
  position?: string;
  currentMileage: number;
  estimatedLife: number;
  changesHistory: TireChange[];
  rotationsHistory: TireRotation[];
}

export interface ImportResponse {
  success: boolean;
  summary: string;
  newDrivers?: Driver[];
  newVehicles?: Vehicle[];
  newFreights?: Freight[];
  newExpenses?: Expense[];
  newRefuels?: Refuel[];
}

export interface Debt {
  id: string;
  description: string;
  category: string;
  value: number;
  dueDate: string;
  status: "Quitar Primeiro" | "Pago" | "Falta Pagar";
  notes?: string;
  createdAt: string;
}

export interface InternationalCost {
  id: string;
  country: "Brasil" | "Argentina" | "Chile";
  value: number;         // sempre convertido para R$ (usado nos totais/graficos)
  currency?: string;     // moeda em que o valor foi originalmente lancado (BRL, USD, ARS, CLP)
  exchangeRate?: number; // cotacao usada na conversao para R$
  status: "Pago" | "Pagar";
  description?: string;
  date: string;
  createdAt: string;
}

export interface CompanyContactFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ContactNotepadEntry {
  id: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

export interface CompanyContact {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  notes?: string;
  files: CompanyContactFile[];
  notepadEntries?: ContactNotepadEntry[];
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  item: string;
  category: string;
  date: string;
  km: number;
  cost: number;
  notes?: string;
  nextDueKm?: number;
  createdAt: string;
}

export interface TruckCashTransaction {
  id: string;
  veiculo_id: string;
  motorista_id: string;
  tipo: "Entrada" | "Saída";
  categoria: "Combustível" | "Pedágio" | "Alimentação" | "Hospedagem" | "Manutenção" | "Borracharia" | "Lavagem" | "Adiantamento" | "Descarga" | "Carga" | "Outros";
  valor: number;
  descricao: string;
  data: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

export interface CaixaCaminhao {
  id: string;
  veiculo_id: string;
  saldo_inicial: number;
  saldo_atual: number;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface CaixaMovimentacao {
  id: string;
  caixa_id: string;
  categoria: string;
  valor: number;
  descricao: string;
  anexo?: string;
  data: string;
  moeda?: string;
  valorOriginal?: number;
  cotacao?: number;
  created_at: string;
  updated_at: string;
}

export interface BoundingPercent {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InteractiveHighlight {
  id: string;
  fieldName: string;
  valueText: string;
  boundingPercent: BoundingPercent;
}

export interface ExtractedValue {
  label: string;
  value: number;
  original: string;
  type: "despesa" | "receita" | "neutro";
}

export interface ExtractedCategory {
  name: string;
  value: number;
  type: "Despesa" | "Receita";
  description: string;
}

export interface ColorInterpretation {
  color: string;
  meaning: string;
  confidence: "Certa" | "Incertas" | "Nenhuma";
}

export interface ReconstructedTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ReconstructedChart {
  title: string;
  explanation: string;
}

export interface SmartSummary {
  totalRecords: number;
  totalExpenses: number;
  totalRevenues: number;
  estimatedProfit: number;
  categoriesCount: number;
  alerts: string[];
}

export interface ImageAnalysisData {
  texts: string[];
  numbers: string[];
  values: ExtractedValue[];
  dates: string[];
  times: string[];
  codes: string[];
  phones: string[];
  documents: string[];
  addresses: string[];
  plates: string[];
  quantities: string[];
  percentages: string[];
  categories: ExtractedCategory[];
  colors: ColorInterpretation[];
  tables: ReconstructedTable[];
  charts: ReconstructedChart[];
  summary: SmartSummary;
  interactiveHighlights: InteractiveHighlight[];
  observations: string[];
}

export interface ImageAnalysisRecord {
  id: string;
  imageName: string;
  imageData: string; // base64 string or url
  mimeType: string;
  date: string; // analyzed date
  infoCount: number; // number of items found
  status: "Concluído" | "Erro";
  result: ImageAnalysisData;
}

export interface TripLog {
  id: string;
  freightId: string;
  driverId: string;
  category: "Abastecimento" | "Troca de pneus" | "Manutenção" | "Carga" | "Descarga" | "Alimentação" | "Hospedagem" | "Pedágio" | "Parada" | "Observação" | "Foto" | "Outros";
  description: string;
  value?: number;
  date: string;
  time: string;
  location?: string;
  photos: string[]; // base64 strings
  notes?: string;
  approved?: boolean;
  createdAt: string;
}

export interface TripPhoto {
  id: string;
  freightId: string;
  driverId: string;
  logId?: string;
  photoUrl: string; // base64
  category: string; // e.g. "Painel", "Combustível", "Pneu", etc.
  description?: string;
  date: string;
  time: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  time: string;
  read: boolean;
  driverName?: string;
  freightId?: string;
}

