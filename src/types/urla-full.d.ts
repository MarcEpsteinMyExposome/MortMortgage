export interface URLAFullModularDemo {
  id?: string;
  loan: URLABorrower;
  property: URLABorrower;
  borrowers: URLABorrower[];
  income?: URLABorrower;
  assets?: URLABorrower;
  liabilities?: URLABorrower;
  declarations?: URLABorrower;
  createdAt?: string;
  [k: string]: unknown;
}
export interface URLABorrower {
  borrowerType: string;
  name: {
    firstName: string;
    middleName?: string;
    lastName: string;
    [k: string]: unknown;
  };
  ssn?: string;
  dob?: string;
  employment?: {
    status?: string;
    employer?: string;
    income?: number;
    [k: string]: unknown;
  };
  assets?: {
    [k: string]: unknown;
  }[];
  liabilities?: {
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}
