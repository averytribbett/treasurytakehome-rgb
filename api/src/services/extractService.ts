import { EMPTY_FIELDS, type LabelFields } from "../types.js";
import OpenAI from "openai";
import { createWorker, PSM, type Worker } from "tesseract.js";

const CLASS_HINT =
  /\b(bourbon|whiskey|whisky|vodka|gin|rum|tequila|brandy|liqueur|wine|ale|lager|beer|malt|spirit|cognac|mezcal)\b/i;

let tesseractWorker: Worker | null = null;

export function parseOcrText(raw: string): LabelFields {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { ...EMPTY_FIELDS };

  const warningIndex = lines.findIndex((line) =>
    /government\s+warning/i.test(line),
  );

  const warning =
    warningIndex >= 0
      ? lines.slice(warningIndex).join(" ").replace(/\s+/g, " ").trim()
      : "";

  const contentLines =
    warningIndex >= 0 ? lines.slice(0, warningIndex) : lines;

  const abvLine =
    contentLines.find((line) => /(\d+(?:\.\d+)?)\s*%/.test(line)) ??
    contentLines.find((line) => /proof/i.test(line)) ??
    "";

  const volumeLine =
    contentLines.find((line) =>
      /(\d+(?:\.\d+)?)\s*(ml|mL|l|liter|liters)\b/i.test(line),
    ) ?? "";

  const classLine =
    contentLines.find((line) => CLASS_HINT.test(line) && line !== abvLine) ?? "";

  const brandLine =
    contentLines.find(
      (line) => line !== abvLine && line !== volumeLine && line !== classLine,
    ) ?? "";

  return {
    brand: brandLine,
    classType: classLine,
    abv: abvLine,
    netContents: volumeLine,
    warning,
    warningBold: null,
  };
}

export async function extractFromImage(
  image: Buffer,
  mimeType: string,
): Promise<{ fields: LabelFields; engine: "openai" | "tesseract"; rawText: string }> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await extractWithOpenAi(image, mimeType);
      if (!isBlank(result.fields)) return { ...result, engine: "openai" };
    } catch {
      // Firewall, timeout, or bad key — fall back to local OCR.
    }
  }

  const rawText = await extractWithTesseract(image);
  return { fields: parseOcrText(rawText), engine: "tesseract", rawText };
}

async function extractWithOpenAi(
  image: Buffer,
  mimeType: string,
): Promise<{ fields: LabelFields; rawText: string }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const dataUrl = `data:${mimeType};base64,${image.toString("base64")}`;

  const response = await client.chat.completions.create({
    model: "gpt-5.6-luna",
    reasoning_effort: "none",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You read alcohol beverage labels. Extract fields exactly as printed. Do not fix capitalization. Judge whether the government warning looks bold from stroke weight, not from capitalization. Return JSON only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract these fields from the label image. Copy text exactly, including capitalization.
Return JSON: {"brand":"","classType":"","abv":"","netContents":"","warning":"","warningBold":true,"rawText":""}
warning is the full government warning if present.
warningBold is true only if GOVERNMENT WARNING looks bold or heavier than nearby body text. false if it is regular weight.
rawText is all visible text.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as Partial<LabelFields> & { rawText?: string };
  return {
    fields: {
      brand: String(parsed.brand ?? ""),
      classType: String(parsed.classType ?? ""),
      abv: String(parsed.abv ?? ""),
      netContents: String(parsed.netContents ?? ""),
      warning: String(parsed.warning ?? ""),
      warningBold: parseWarningBold(parsed.warningBold),
    },
    rawText: String(parsed.rawText ?? ""),
  };
}

function parseWarningBold(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function warmupOcr(): Promise<void> {
  await getWorker();
}

async function getWorker(): Promise<Worker> {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker("eng");
    await tesseractWorker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
  }
  return tesseractWorker;
}

async function extractWithTesseract(image: Buffer): Promise<string> {
  const worker = await getWorker();
  const result = await worker.recognize(image);
  return result.data.text ?? "";
}

function isBlank(fields: LabelFields): boolean {
  return (
    !fields.brand.trim() &&
    !fields.classType.trim() &&
    !fields.abv.trim() &&
    !fields.netContents.trim() &&
    !fields.warning.trim()
  );
}
