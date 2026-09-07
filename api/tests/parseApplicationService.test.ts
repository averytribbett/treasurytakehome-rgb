import { describe, expect, it } from "vitest";
import { STATUTORY_WARNING } from "../src/types.js";
import { parseApplicationText } from "../src/services/parseApplicationService.js";

const colaPaste = `
TTB F 5100.31 Certificate of Label Approval

Brand Name: OLD TOM DISTILLERY
Class and Type: Kentucky Straight Bourbon Whiskey
Alcohol Content: 45% Alc./Vol. (90 Proof)
Net Contents: 750 mL

${STATUTORY_WARNING}
`;

describe("parseApplicationText", () => {
  it("pulls fields out of a pasted COLA-style dump", () => {
    const fields = parseApplicationText(colaPaste);
    expect(fields.brand).toBe("OLD TOM DISTILLERY");
    expect(fields.classType).toBe("Kentucky Straight Bourbon Whiskey");
    expect(fields.abv).toMatch(/45%/);
    expect(fields.netContents).toMatch(/750\s*mL/i);
    expect(fields.warning).toMatch(/GOVERNMENT WARNING/);
    expect(fields.warning).toMatch(/Surgeon General/);
  });

  it("reads the current sample key: value txt files", () => {
    const fields = parseApplicationText(`brand: Stone's Throw
classType: Kentucky Straight Bourbon Whiskey
abv: 45% Alc./Vol. (90 Proof)
netContents: 750 mL
warning: ${STATUTORY_WARNING}
`);
    expect(fields.brand).toBe("Stone's Throw");
    expect(fields.classType).toBe("Kentucky Straight Bourbon Whiskey");
    expect(fields.warning.startsWith("GOVERNMENT WARNING")).toBe(true);
  });

  it("still finds fields when the paste has no labels", () => {
    const fields = parseApplicationText(`
OLD TOM DISTILLERY
Kentucky Straight Bourbon Whiskey
45% Alc./Vol. (90 Proof)
750 mL
${STATUTORY_WARNING}
`);
    expect(fields.brand).toMatch(/OLD TOM DISTILLERY/i);
    expect(fields.abv).toMatch(/45%/);
    expect(fields.warning).toMatch(/GOVERNMENT WARNING/);
  });
});
