import { describe, expect, it } from "vitest";
import { SAMPLE_OLD_TOM } from "../src/types.js";
import { compareLabel } from "../src/services/compareService.js";

describe("compareLabel", () => {
  it("uses the extract service then applies compare rules", async () => {
    const result = await compareLabel(
      Buffer.from("unused"),
      "image/png",
      { ...SAMPLE_OLD_TOM, brand: "Stone's Throw" },
      {
        extractFromImage: async () => ({
          fields: { ...SAMPLE_OLD_TOM, brand: "STONE'S THROW" },
          engine: "tesseract",
          rawText: "STONE'S THROW",
        }),
      },
    );

    expect(result.engine).toBe("tesseract");
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBe("review");
    expect(result.fields.find((field) => field.field === "brand")?.verdict).toBe("review");
  });

  it("uses the same compare path for a passing label", async () => {
    const result = await compareLabel(Buffer.from("unused"), "image/png", SAMPLE_OLD_TOM, {
      extractFromImage: async () => ({
        fields: SAMPLE_OLD_TOM,
        engine: "openai",
        rawText: "OLD TOM DISTILLERY",
      }),
    });

    expect(result.overall).toBe("pass");
    expect(result.fields.every((field) => field.verdict === "pass")).toBe(true);
  });
});
