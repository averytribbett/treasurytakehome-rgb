import {
  FIELD_LABELS,
  STATUTORY_WARNING,
  type FieldKey,
  type FieldResult,
  type LabelFields,
  type Verdict,
} from "./types.js";

const UNREADABLE_REASON =
  "Could not read the label clearly. Ask for a better image.";

export function compareFields(found: LabelFields, expected: LabelFields): {
  fields: FieldResult[];
  overall: Verdict;
  unreadable: boolean;
} {
  if (isBlank(found)) {
    const fields = (Object.keys(FIELD_LABELS) as FieldKey[]).map((key) =>
      row(key, expected[key], found[key], "review", UNREADABLE_REASON),
    );
    return { fields, overall: "review", unreadable: true };
  }

  const fields: FieldResult[] = [
    compareName("brand", found.brand, expected.brand),
    compareName("classType", found.classType, expected.classType),
    compareNumeric("abv", found.abv, expected.abv, parseAbvPercent),
    compareNumeric("netContents", found.netContents, expected.netContents, parseMilliliters),
    compareWarning(found.warning, expected.warning, found.warningBold),
  ];

  return { fields, overall: worst(fields.map((f) => f.verdict)), unreadable: false };
}

function compareName(field: FieldKey, found: string, expected: string): FieldResult {
  const rawFound = found.trim();
  const rawExpected = expected.trim();

  if (!rawFound) {
    return row(field, rawExpected, found, "review", "Could not read this field on the label.");
  }
  if (rawFound === rawExpected) {
    return row(field, rawExpected, rawFound, "pass", "Matches the application.");
  }
  if (rawFound.toLowerCase() === rawExpected.toLowerCase()) {
    return row(
      field,
      rawExpected,
      rawFound,
      "review",
      "Same name, different capitalization. Agent should confirm.",
    );
  }
  if (normalizeName(rawFound) === normalizeName(rawExpected)) {
    return row(
      field,
      rawExpected,
      rawFound,
      "pass",
      "Matches after ignoring extra spaces or punctuation.",
    );
  }

  const score = similarity(normalizeName(rawFound), normalizeName(rawExpected));
  if (score >= 0.85) {
    return row(
      field,
      rawExpected,
      rawFound,
      "review",
      "Close to the application, but not the same. Agent should confirm.",
    );
  }
  return row(field, rawExpected, rawFound, "fail", "Does not match the application.");
}

function compareNumeric(
  field: FieldKey,
  found: string,
  expected: string,
  parse: (value: string) => number | null,
): FieldResult {
  const rawFound = found.trim();
  const rawExpected = expected.trim();
  const foundNum = parse(rawFound);
  const expectedNum = parse(rawExpected);

  if (foundNum === null) {
    return row(field, rawExpected, found, "review", "Could not read a number on the label.");
  }
  if (expectedNum === null) {
    return row(field, rawExpected, rawFound, "review", "Could not read a number on the application.");
  }
  if (Math.abs(foundNum - expectedNum) < 0.05) {
    return row(field, rawExpected, rawFound, "pass", "Same amount as the application.");
  }
  return row(field, rawExpected, rawFound, "fail", "Number does not match the application.");
}

function compareWarning(found: string, expected: string, warningBold: boolean | null): FieldResult {
  const rawFound = collapseWs(found);
  const rawExpected = collapseWs(expected || STATUTORY_WARNING);

  if (!rawFound) {
    return row("warning", rawExpected, found, "fail", "Government warning is missing from the label.");
  }

  const prefix = warningPrefix(rawFound);
  if (prefix !== "GOVERNMENT WARNING") {
    return row(
      "warning",
      rawExpected,
      found.trim(),
      "fail",
      'The first two words must be "GOVERNMENT WARNING" in all caps.',
    );
  }

  const statutory = collapseWs(STATUTORY_WARNING);
  if (rawFound !== statutory && rawFound !== rawExpected) {
    return row(
      "warning",
      rawExpected,
      found.trim(),
      "fail",
      "Warning text must be the statutory wording, word-for-word.",
    );
  }

  if (warningBold === false) {
    return row(
      "warning",
      rawExpected,
      found.trim(),
      "fail",
      "The government warning must be bold.",
    );
  }

  if (warningBold === true) {
    return row(
      "warning",
      rawExpected,
      found.trim(),
      "pass",
      "Exact statutory warning is present and bold.",
    );
  }

  return row(
    "warning",
    rawExpected,
    found.trim(),
    "pass",
    "Exact statutory warning is present. Bold could not be checked.",
  );
}

function warningPrefix(text: string): string {
  const match = text.match(/^([A-Za-z]+)\s+([A-Za-z]+)/);
  return match ? `${match[1]} ${match[2]}` : "";
}

function parseAbvPercent(value: string): number | null {
  const percent = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent) return Number(percent[1]);
  const proof = value.match(/(\d+(?:\.\d+)?)\s*proof/i);
  if (proof) return Number(proof[1]) / 2;
  const bare = value.match(/(\d+(?:\.\d+)?)/);
  return bare ? Number(bare[1]) : null;
}

function parseMilliliters(value: string): number | null {
  const liter = value.match(/(\d+(?:\.\d+)?)\s*(l|liter|liters)\b/i);
  if (liter) return Number(liter[1]) * 1000;
  const ml = value.match(/(\d+(?:\.\d+)?)\s*(ml|mL|ML|milliliter|milliliters)?/);
  return ml ? Number(ml[1]) : null;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collapseWs(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i]![0] = i;
  for (let j = 0; j < cols; j += 1) grid[0]![j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i]![j] = Math.min(
        grid[i - 1]![j]! + 1,
        grid[i]![j - 1]! + 1,
        grid[i - 1]![j - 1]! + cost,
      );
    }
  }
  return grid[a.length]![b.length]!;
}

function worst(verdicts: Verdict[]): Verdict {
  if (verdicts.includes("fail")) return "fail";
  if (verdicts.includes("review")) return "review";
  return "pass";
}

function row(
  field: FieldKey,
  expected: string,
  found: string,
  verdict: Verdict,
  reason: string,
): FieldResult {
  return {
    field,
    label: FIELD_LABELS[field],
    expected,
    found,
    verdict,
    reason,
  };
}
