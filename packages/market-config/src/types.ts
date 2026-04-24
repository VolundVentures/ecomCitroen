export type Locale = "fr-MA" | "ar-MA" | "en-MA";

export type PaymentProvider = "cmi" | "stripe" | "tamara" | "tabby";

export type FinancingPartner = {
  id: string;
  name: string;
  logoPath?: string;
  website?: string;
};

export type Dealer = {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string;
  lat: number;
  lng: number;
};

export type FeatureFlags = {
  atlasVoice: boolean;
  generativeImagery: boolean;
  personalizedVideo: boolean;
  financingAdvisor: boolean;
  bespokePDF: boolean;
  cmiDeposit: boolean;
};

export type MarketConfig = {
  marketId: string;
  locales: Locale[];
  defaultLocale: Locale;
  currency: "MAD" | "SAR" | "AED" | "EGP" | "EUR" | "USD";
  currencySymbol: string;
  paymentProviders: PaymentProvider[];
  depositAmount: number;
  legal: {
    termsUrl: string;
    privacyUrl: string;
    cookieRegime: "gdpr-like" | "ccpa";
    dataResidency: "EU" | "local" | "other";
  };
  whatsappBusinessId?: string;
  dealerNetwork: Dealer[];
  financingPartners: FinancingPartner[];
  features: FeatureFlags;
};
