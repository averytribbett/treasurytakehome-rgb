export const STATUTORY_WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

export type Verdict = "pass" | "review" | "fail";

export type FieldKey = "brand" | "classType" | "abv" | "netContents" | "warning";

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
