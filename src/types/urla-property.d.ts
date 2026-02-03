export interface URLAProperty {
  propertyType: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    [k: string]: unknown;
  };
  estimatedValue?: number;
  [k: string]: unknown;
}
