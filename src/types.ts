export interface PackageOption {
  name: string;
  price: number;
  includes: string[];
}

export interface PackageInfo {
  prazo?: string;
  periodo_ideal?: string;
  agendamento?: string;
  entrega?: string;
  producao?: string;
  contrato?: string;
  [key: string]: string | undefined;
}

export interface ProductionOption {
  id: string;
  name: string;
  price: number;
  description: string;
  enabled: boolean;
}

export interface AdditionalInfo {
  label: string;
  value: string;
}

export interface Package {
  id: string; // slug
  title: string;
  image: string;
  shortDesc: string;
  desc: string;
  options: PackageOption[];
  
  info?: PackageInfo;
  additionalInfo?: AdditionalInfo[];
  
  productions?: ProductionOption[];
  
  active: boolean;
  showInHome: boolean;
  showInPackages: boolean;
  order: number;
  
  // Legacy fields
  hasProduction?: boolean;
  productionPrice?: number;
  productionDesc?: string;
}

export interface SiteSettings {
  home: {
    block1: {
      title: string;
      description: string;
    };
    block2: {
      title: string;
      description: string;
    };
  };
  contractTemplate?: {
    content: string;
    version: number;
    updatedAt: string;
  };
}

export interface ContractSnapshot {
  content: string;
  version: number;
  acceptedAt: any; // Firestore Timestamp
  ipAddress?: string;
  userAgent?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  issuedBy: string;
  issuedAt: any; // Firestore Timestamp
  paymentMethod: string;
  amount: number;
  clientName: string;
  clientCpf: string;
  packageName: string;
  updatedAt?: any; // Firestore Timestamp
}


export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
  validUntil?: string; // ISO date
  usageLimit?: number;
  currentUses: number;
}
