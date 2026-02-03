export interface URLALoan {
  product: string;
  loanAmount: number;
  loanPurpose?: string;
  loanTermYears?: number;
  [k: string]: unknown;
}
