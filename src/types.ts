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
