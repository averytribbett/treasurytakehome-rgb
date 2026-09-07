import type { CheckResult, LabelFields } from "../types.js";
import { compareFields } from "../compare.js";
import { extractFromImage } from "./extractService.js";

export interface Extractor {
  extractFromImage: typeof extractFromImage;
}

export async function compareLabel(
  image: Buffer,
  mimeType: string,
  expected: LabelFields,
  deps: Extractor = { extractFromImage },
): Promise<CheckResult> {
  const started = Date.now();
  const { fields, engine } = await deps.extractFromImage(image, mimeType);
  const compared = compareFields(fields, expected);
  return {
    ...compared,
    engine,
    elapsedMs: Date.now() - started,
  };
}
