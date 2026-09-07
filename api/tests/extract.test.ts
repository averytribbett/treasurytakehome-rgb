import { describe, expect, it } from "vitest";
import { STATUTORY_WARNING } from "../src/types.js";
import { parseOcrText } from "../src/services/extractService.js";

const oldTomText = `
OLD TOM DISTILLERY
Kentucky Straight Bourbon Whiskey
45% Alc./Vol. (90 Proof)
750 mL
${STATUTORY_WARNING}
`;

describe("parseOcrText", () => {
  it("pulls brand, class, ABV, volume, and warning from a clean label", () => {
    const fields = parseOcrText(oldTomText);
    expect(fields.brand).toMatch(/OLD TOM DISTILLERY/i);
    expect(fields.classType).toMatch(/Kentucky Straight Bourbon Whiskey/i);
    expect(fields.abv).toMatch(/45%/);
    expect(fields.netContents).toMatch(/750\s*mL/i);
    expect(fields.warning).toMatch(/GOVERNMENT WARNING/);
    expect(fields.warning).toMatch(/Surgeon General/);
    expect(fields.warningBold).toBeNull();
  });

  it("keeps GOVERNMENT WARNING capitalization from the label", () => {
    const fields = parseOcrText(
      "STONE'S THROW\nBourbon\n40% Alc./Vol.\n750 mL\nGovernment Warning: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
    );
    expect(fields.warning.startsWith("Government Warning")).toBe(true);
  });

  it("returns empty fields when the image text is blank", () => {
    expect(parseOcrText("   \n  ")).toEqual({
      brand: "",
      classType: "",
      abv: "",
      netContents: "",
      warning: "",
      warningBold: null,
    });
  });
});
