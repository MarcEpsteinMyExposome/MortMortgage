export interface URLADeclarations {
  declarations?: {
    bankruptcies?: boolean;
    foreclosures?: boolean;
    lawsuits?: boolean;
    alimonyObligation?: boolean;
    otherExplanations?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
