import { EMPTY_FIELDS, type FieldKey, type LabelFields } from "../types.js";
import { parseOcrText } from "./extractService.js";

const KEY_ALIASES: Record<string, FieldKey> = {
  brand: "brand",
  "brand name": "brand",
  classtype: "classType",
  "class type": "classType",
  "class and type": "classType",
  abv: "abv",
  alcohol: "abv",
  "alcohol content": "abv",
  netcontents: "netContents",
  "net contents": "netContents",
  warning: "warning",
};

export function parseApplicationText(raw: string): LabelFields {
  const labeled = parseLabeled(raw);
  const fallback = parseOcrText(raw);
  return {
    brand: labeled.brand || fallback.brand,
    classType: labeled.classType || fallback.classType,
    abv: labeled.abv || fallback.abv,
    netContents: labeled.netContents || fallback.netContents,
    warning: labeled.warning || fallback.warning,
    warningBold: null,
  };
}

function parseLabeled(raw: string): LabelFields {
  const fields = { ...EMPTY_FIELDS };
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const cut = line.indexOf(":");
    if (cut <= 0) continue;

    const key = normalizeKey(line.slice(0, cut));
    const field = KEY_ALIASES[key];
    if (!field) continue;

    let value = line.slice(cut + 1).trim();
    if (field === "warning") {
      const rest = lines
        .slice(i + 1)
        .map((item) => item.trim())
        .filter(Boolean);
      value = [value, ...rest].join(" ").trim();
    }
    if (value) fields[field] = value;
  }

  return fields;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
