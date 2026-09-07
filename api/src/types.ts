export const STATUTORY_WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

export type Verdict = "pass" | "review" | "fail";

export type FieldKey =
  | "brand"
  | "classType"
  | "abv"
  | "netContents"
  | "warning";

export interface LabelFields {
  brand: string;
  classType: string;
  abv: string;
  netContents: string;
  warning: string;
  /** true/false from OpenAI Vision. null when Tesseract ran and bold is unknown. */
  warningBold: boolean | null;
}

export interface FieldResult {
  field: FieldKey;
  label: string;
  expected: string;
  found: string;
  verdict: Verdict;
  reason: string;
}

export interface CheckResult {
  overall: Verdict;
  fields: FieldResult[];
  engine: "openai" | "tesseract";
  elapsedMs: number;
  unreadable: boolean;
}

export const FIELD_LABELS: Record<FieldKey, string> = {
  brand: "Brand name",
  classType: "Class/type",
  abv: "Alcohol content",
  netContents: "Net contents",
  warning: "Government warning",
};

export const SAMPLE_OLD_TOM: LabelFields = {
  brand: "OLD TOM DISTILLERY",
  classType: "Kentucky Straight Bourbon Whiskey",
  abv: "45% Alc./Vol. (90 Proof)",
  netContents: "750 mL",
  warning: STATUTORY_WARNING,
  warningBold: true,
};

export const EMPTY_FIELDS: LabelFields = {
  brand: "",
  classType: "",
  abv: "",
  netContents: "",
  warning: "",
  warningBold: null,
};
