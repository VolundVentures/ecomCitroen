export type FinancingInput = {
  vehiclePrice: number;
  downPayment: number;
  tradeInValue?: number;
  termMonths: number;
  annualRatePct: number;
};

export type FinancingQuote = {
  principal: number;
  termMonths: number;
  annualRatePct: number;
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
};

export function computeMonthlyPayment(
  principal: number,
  annualRatePct: number,
  termMonths: number
): number {
  if (termMonths <= 0) return 0;
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function quote(input: FinancingInput): FinancingQuote {
  const principal = Math.max(
    0,
    input.vehiclePrice - input.downPayment - (input.tradeInValue ?? 0)
  );
  const monthly = computeMonthlyPayment(
    principal,
    input.annualRatePct,
    input.termMonths
  );
  const totalPaid = monthly * input.termMonths;
  return {
    principal,
    termMonths: input.termMonths,
    annualRatePct: input.annualRatePct,
    monthlyPayment: Math.round(monthly),
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalPaid - principal),
  };
}

export type TcoInput = {
  vehiclePrice: number;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  annualKm: number;
  yearsOfOwnership: number;
};

export type TcoBreakdown = {
  depreciationMAD: number;
  fuelMAD: number;
  insuranceMAD: number;
  servicingMAD: number;
  totalMAD: number;
};

const FUEL_COST_PER_100KM_MAD: Record<TcoInput["fuelType"], number> = {
  petrol: 90,
  diesel: 75,
  hybrid: 55,
  electric: 30,
};

const DEPRECIATION_PCT_PER_YEAR = 0.14;
const SERVICING_PER_YEAR_MAD = 3500;
const INSURANCE_PER_YEAR_PCT_OF_PRICE = 0.015;

export function computeTco(input: TcoInput): TcoBreakdown {
  const years = Math.max(1, input.yearsOfOwnership);
  const residual =
    input.vehiclePrice * Math.pow(1 - DEPRECIATION_PCT_PER_YEAR, years);
  const depreciation = input.vehiclePrice - residual;
  const fuel =
    (FUEL_COST_PER_100KM_MAD[input.fuelType] / 100) *
    input.annualKm *
    years;
  const insurance = input.vehiclePrice * INSURANCE_PER_YEAR_PCT_OF_PRICE * years;
  const servicing = SERVICING_PER_YEAR_MAD * years;
  const total = depreciation + fuel + insurance + servicing;
  return {
    depreciationMAD: Math.round(depreciation),
    fuelMAD: Math.round(fuel),
    insuranceMAD: Math.round(insurance),
    servicingMAD: Math.round(servicing),
    totalMAD: Math.round(total),
  };
}

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DEFAULT_RATES_MA = {
  bankLoan: 5.9,
  citroenFinance: 4.5,
} as const;
