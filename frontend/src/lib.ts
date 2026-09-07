import type { CheckResult } from "./types";

export function verdictWord(verdict: CheckResult["overall"]): string {
  if (verdict === "pass") return "Pass";
  if (verdict === "review") return "Needs review";
  return "Fail";
}

export function statusReason(result: CheckResult): string {
  if (result.overall === "pass") return "";
  return (
    result.fields.find((field) => field.verdict === result.overall)?.reason ??
    result.fields.find((field) => field.verdict !== "pass")?.reason ??
    ""
  );
}
