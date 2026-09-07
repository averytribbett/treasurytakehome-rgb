import { describe, expect, it } from "vitest";
import {
  SAMPLE_OLD_TOM,
  STATUTORY_WARNING,
  type LabelFields,
} from "../src/types.js";
import { compareFields } from "../src/compare.js";

const blank: LabelFields = {
  brand: "",
  classType: "",
  abv: "",
  netContents: "",
  warning: "",
  warningBold: null,
};

function field(result: ReturnType<typeof compareFields>, key: string) {
  const row = result.fields.find((f) => f.field === key);
  if (!row) throw new Error(`missing field ${key}`);
  return row;
}

describe("compareFields", () => {
  it("passes when every extracted field matches the application", () => {
    const result = compareFields(SAMPLE_OLD_TOM, SAMPLE_OLD_TOM);
    expect(result.unreadable).toBe(false);
    expect(result.overall).toBe("pass");
    expect(result.fields.every((f) => f.verdict === "pass")).toBe(true);
  });

  it("marks brand Needs review for case-only differences", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, brand: "STONE'S THROW" },
      { ...SAMPLE_OLD_TOM, brand: "Stone's Throw" },
    );
    expect(field(result, "brand").verdict).toBe("review");
    expect(field(result, "brand").reason).toMatch(/capitalization/i);
    expect(result.overall).toBe("review");
  });

  it("fails brand when the names are clearly different", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, brand: "WILD TURKEY" },
      { ...SAMPLE_OLD_TOM, brand: "OLD TOM DISTILLERY" },
    );
    expect(field(result, "brand").verdict).toBe("fail");
    expect(result.overall).toBe("fail");
  });

  it("passes class/type when punctuation and spacing differ", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, classType: "Kentucky Straight Bourbon Whiskey" },
      { ...SAMPLE_OLD_TOM, classType: "Kentucky Straight Bourbon Whiskey." },
    );
    expect(field(result, "classType").verdict).toBe("pass");
  });

  it("fails the warning when GOVERNMENT WARNING is not all caps", () => {
    const titleCase = STATUTORY_WARNING.replace(
      "GOVERNMENT WARNING",
      "Government Warning",
    );
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, warning: titleCase },
      SAMPLE_OLD_TOM,
    );
    expect(field(result, "warning").verdict).toBe("fail");
    expect(field(result, "warning").reason).toMatch(/all caps/i);
    expect(result.overall).toBe("fail");
  });

  it("fails the warning when the wording is not statutory", () => {
    const result = compareFields(
      {
        ...SAMPLE_OLD_TOM,
        warning:
          "GOVERNMENT WARNING: Please drink responsibly and do not drink if pregnant.",
      },
      SAMPLE_OLD_TOM,
    );
    expect(field(result, "warning").verdict).toBe("fail");
    expect(field(result, "warning").reason).toMatch(/word-for-word|exact/i);
  });

  it("fails the warning when GPT says it is not bold", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, warningBold: false },
      SAMPLE_OLD_TOM,
    );
    expect(field(result, "warning").verdict).toBe("fail");
    expect(field(result, "warning").reason).toMatch(/bold/i);
    expect(result.overall).toBe("fail");
  });

  it("passes the warning when GPT says it is bold", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, warningBold: true },
      SAMPLE_OLD_TOM,
    );
    expect(field(result, "warning").verdict).toBe("pass");
    expect(field(result, "warning").reason).toMatch(/bold/i);
  });

  it("passes the warning without a bold check when Tesseract ran", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, warningBold: null },
      SAMPLE_OLD_TOM,
    );
    expect(field(result, "warning").verdict).toBe("pass");
    expect(field(result, "warning").reason).toMatch(/could not be checked/i);
  });

  it("fails the warning when it is missing from the label", () => {
    const result = compareFields({ ...SAMPLE_OLD_TOM, warning: "" }, SAMPLE_OLD_TOM);
    expect(field(result, "warning").verdict).toBe("fail");
    expect(field(result, "warning").reason).toMatch(/missing/i);
  });

  it("passes ABV when the number matches despite format differences", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, abv: "45% Alc./Vol. (90 Proof)" },
      { ...SAMPLE_OLD_TOM, abv: "45%" },
    );
    expect(field(result, "abv").verdict).toBe("pass");
  });

  it("fails ABV when the percentage differs", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, abv: "40% Alc./Vol." },
      { ...SAMPLE_OLD_TOM, abv: "45%" },
    );
    expect(field(result, "abv").verdict).toBe("fail");
  });

  it("marks ABV Needs review when the label number cannot be read", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, abv: "" },
      SAMPLE_OLD_TOM,
    );
    expect(field(result, "abv").verdict).toBe("review");
  });

  it("passes net contents when 750 mL and 750ml are the same volume", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, netContents: "750ml" },
      { ...SAMPLE_OLD_TOM, netContents: "750 mL" },
    );
    expect(field(result, "netContents").verdict).toBe("pass");
  });

  it("fails net contents when the volume differs", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, netContents: "1.75 L" },
      { ...SAMPLE_OLD_TOM, netContents: "750 mL" },
    );
    expect(field(result, "netContents").verdict).toBe("fail");
  });

  it("marks the whole label Needs review when nothing could be read", () => {
    const result = compareFields(blank, SAMPLE_OLD_TOM);
    expect(result.unreadable).toBe(true);
    expect(result.overall).toBe("review");
    expect(result.fields.every((f) => f.verdict === "review")).toBe(true);
    expect(result.fields[0]?.reason).toMatch(/could not read/i);
  });

  it("uses Fail as the overall verdict when any field fails", () => {
    const result = compareFields(
      { ...SAMPLE_OLD_TOM, brand: "OTHER BRAND", warning: "Government Warning: nope" },
      SAMPLE_OLD_TOM,
    );
    expect(result.overall).toBe("fail");
  });
});
