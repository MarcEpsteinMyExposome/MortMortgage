export interface URLAAssets {
  assets?: {
    type: "checking" | "savings" | "investment" | "property" | "vehicle" | "other";
    institution?: string;
    accountNumber?: string;
    balance?: number;
    value?: number;
    description?: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
