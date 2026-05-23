export type Claim = {
  id: string;
  claimNumber: string;
  policyNumber: string;
  insurerName: string;
  insuredName: string;
  vehicle: string;
  licensePlate: string;
  accidentDate: string;
  reportedDamage: string;
  authorizedServices: string[];
  authorizedWorkshopNames: string[];
  estimatedRepairAmount: number;
  status: "open" | "closed" | "under_review";
};
