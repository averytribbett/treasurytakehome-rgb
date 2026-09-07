import type { CheckResult } from "../types";
import { apiUrl } from "../api";

export async function compareLabel(
  image: File,
  applicationText: string,
): Promise<CheckResult> {
  const body = new FormData();
  body.append("image", image);
  body.append("applicationText", applicationText);

  const response = await fetch(apiUrl("/api/compare"), { method: "POST", body });
  const data = (await response.json()) as CheckResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Could not compare this label.");
  }
  return data;
}
