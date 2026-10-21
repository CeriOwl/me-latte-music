import { describe, expect, it } from "vitest";
import { etaMinutes } from "../eta";

const at = new Date("2026-10-20T20:00:00Z");

describe("etaMinutes", () => {
  it("is 0 for the next record when nothing is playing", () => {
    expect(etaMinutes(0, null, at)).toBe(0);
  });

  it("adds a full slot per record ahead", () => {
    expect(etaMinutes(3, null, at, 20)).toBe(60);
  });

  it("only counts the time left on the playing record", () => {
    const started = new Date(at.getTime() - 5 * 60000); // 5 min in
    expect(etaMinutes(0, started, at, 20)).toBe(15);
    expect(etaMinutes(2, started, at, 20)).toBe(55);
  });

  it("never goes negative when a record runs long", () => {
    const started = new Date(at.getTime() - 45 * 60000);
    expect(etaMinutes(0, started, at, 20)).toBe(0);
  });
});
