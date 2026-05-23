export type TariffItem = {
  id: string;
  code: string;
  description: string;
  category: string;
  maxUnitPrice: number;
  maxLaborHours: number;
  authorized: boolean;
};
