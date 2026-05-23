export type Claim = {
  id: string;
  claimNumber: string;
  insuredName: string;
  vehicle: string;
  licensePlate: string;
  reportedDamage: string;
  authorizedServices: string[];
  authorizedWorkshopNames: string[];
  status: "open" | "closed" | "under_review";
};
