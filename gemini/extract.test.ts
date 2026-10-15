import { describe, expect, it } from "vitest";
import { snapEvidence, validateExtraction, type ModelOutput } from "./extract.js";

const notice = "Vessel will omit Singapore. PO 40123 now expected 2026-06-21 due to berth congestion.";
const base: ModelOutput = {
  items: [{ poReference: "40123", newArrivalDate: "2026-06-21", evidence: "PO 40123 now expected 2026-06-21" }],
  reason: "port_congestion",
  confidence: 0.9,
};
const first = (o: ModelOutput) => o.items[0]!;

describe("validateExtraction", () => {
  it("accepts output the notice supports", () => {
    expect(validateExtraction(notice, base, ["40123"]).issues).toEqual([]);
  });

  it("flags evidence that is not in the notice", () => {
    const r = validateExtraction(notice, { ...base, items: [{ ...first(base), evidence: "arrives next Friday" }] });
    expect(r.issues.join()).toContain("evidence for PO 40123");
  });

  it("flags a PO that is not in the notice", () => {
    const r = validateExtraction(notice, { ...base, items: [{ ...first(base), poReference: "99999" }] });
    expect(r.issues.join()).toContain("99999");
  });

  it("strips a PO prefix before matching", () => {
    const r = validateExtraction(notice, { ...base, items: [{ ...first(base), poReference: "PO 40123" }] }, ["40123"]);
    expect(r.issues).toEqual([]);
    expect(r.items[0]?.poReference).toBe("40123");
  });

  it("flags an unknown PO", () => {
    expect(validateExtraction(notice, base, ["50001"]).issues.join()).toContain("not a known open PO");
  });

  it("nulls an invalid date", () => {
    const r = validateExtraction(notice, { ...base, items: [{ ...first(base), newArrivalDate: "21 June" }] });
    expect(r.items[0]?.newArrivalDate).toBeNull();
    expect(r.issues.length).toBe(1);
  });

  it("checks each PO in a multi-PO notice", () => {
    const n = "PO 40123 arrives 2026-06-21. PO 40124 arrives 2026-06-25.";
    const r = validateExtraction(n, {
      reason: "other",
      confidence: 0.8,
      items: [
        { poReference: "40123", newArrivalDate: "2026-06-21", evidence: "PO 40123 arrives 2026-06-21" },
        { poReference: "40124", newArrivalDate: "2026-06-25", evidence: "PO 40124 arrives 2026-06-25" },
      ],
    });
    expect(r.issues).toEqual([]);
  });
});

describe("snapEvidence", () => {
  const jp = "PO 50001 の出荷は、サプライヤーの生産遅延のため、2026年7月3日に変更となります。";

  it("returns an exact quote unchanged", () => {
    expect(snapEvidence(jp, "2026年7月3日に変更となります")).toBe("2026年7月3日に変更となります");
  });

  it("replaces a quote with one wrong character by the real passage", () => {
    expect(snapEvidence(jp, "2026元7月3日に変更となります")).toBe("2026年7月3日に変更となります");
  });

  it("rejects a quote that is not in the notice", () => {
    expect(snapEvidence(jp, "The vessel will arrive next Friday")).toBeNull();
  });

  it("passes the real passage through validateExtraction", () => {
    const r = validateExtraction(jp, { reason: "supplier_production", confidence: 0.9, items: [{ poReference: "50001", newArrivalDate: "2026-07-03", evidence: "2026元7月3日に変更となります" }] });
    expect(r.issues).toEqual([]);
    expect(r.items[0]?.evidence).toBe("2026年7月3日に変更となります");
  });
});
