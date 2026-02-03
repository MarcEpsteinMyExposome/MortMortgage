export interface URLALiabilities {
  liabilities?: {
    type: "mortgage" | "credit_card" | "auto_loan" | "student_loan" | "other";
    creditor?: string;
    monthlyPayment: number;
    balance?: number;
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
