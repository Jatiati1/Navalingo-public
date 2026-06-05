import {
  getWordLimits,
  calculateInflatedCap,
  calculateDeflatedCap,
} from "@/utils/editor/wordLimit";

describe("wordLimit", () => {
  describe("getWordLimits", () => {
    it("returns Pro limits", () => {
      const limits = getWordLimits(true);
      expect(limits).toEqual({
        baseCap: 600,
        inflatePct: 0.14,
        deflatePct: 0.03,
      });
    });

    it("returns Free limits", () => {
      const limits = getWordLimits(false);
      expect(limits).toEqual({
        baseCap: 200,
        inflatePct: 0.12,
        deflatePct: 0.06,
      });
    });
  });

  describe("calculateInflatedCap", () => {
    it("calculates correctly for Free user with small text (uses buffer min)", () => {
      // 100 * 0.12 = 12 (less than BUFFER_MIN 20) -> uses 20 buffer
      // 100 + 20 = 120
      expect(calculateInflatedCap(100, false)).toBe(120);
    });

    it("calculates correctly for Free user with large text", () => {
      // 200 * 0.12 = 24
      // 200 + 24 = 224
      expect(calculateInflatedCap(200, false)).toBe(224);
    });

    it("calculates correctly for Pro user", () => {
      // 500 * 0.14 = 70
      // 500 + 70 = 570
      expect(calculateInflatedCap(500, true)).toBe(570);
    });
  });

  describe("calculateDeflatedCap", () => {
    it("calculates correctly for Free user with small text (uses buffer min)", () => {
      // 100 * 0.06 = 6 (less than 20) -> uses 20
      // 100 + 20 = 120
      expect(calculateDeflatedCap(100, false)).toBe(120);
    });

    it("calculates correctly for Free user with large text", () => {
      // 400 * 0.06 = 24
      // 400 + 24 = 424
      expect(calculateDeflatedCap(400, false)).toBe(424);
    });

    it("calculates correctly for Pro user", () => {
      // 1000 * 0.03 = 30
      // 1000 + 30 = 1030
      expect(calculateDeflatedCap(1000, true)).toBe(1030);
    });
  });
});
