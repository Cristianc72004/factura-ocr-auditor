export type DocumentRecognition = {
  isValid: boolean;
  template: "digitflow_invoice" | "unknown";
  confidence: number;
  matchedSignals: string[];
  missingSignals: string[];
  message: string;
};
