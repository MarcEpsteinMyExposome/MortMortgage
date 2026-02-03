export interface URLAIncome {
  incomeSources?: {
    type: "employment" | "self_employed" | "rental" | "social_security" | "other";
    employerName?: string;
    amount: number;
    frequency?: "monthly" | "biweekly" | "weekly" | "annual";
    yearsOnJob?: number;
    details?: string;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
