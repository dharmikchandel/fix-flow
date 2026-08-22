import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computePriorityScore } from "./priorityService.js";

describe("computePriorityScore", () => {
  test("a brand-new, unassigned, max-severity bug scores near the top of the scale", () => {
    const score = computePriorityScore(100, 0, false);
    // 100*0.6 + 0*0.3 + 100*0.1 = 70
    assert.equal(score, 70);
  });

  test("age is capped at 30 days (720 hours) — older bugs don't keep climbing forever", () => {
    const at30Days = computePriorityScore(50, 720, true);
    const at90Days = computePriorityScore(50, 2160, true);
    assert.equal(at30Days, at90Days);
  });

  test("an unassigned bug always outranks an otherwise-identical assigned bug", () => {
    const unassigned = computePriorityScore(50, 100, false);
    const assigned = computePriorityScore(50, 100, true);
    assert.ok(unassigned > assigned);
  });

  test("higher severity always outranks lower severity at equal age and assignment state", () => {
    const critical = computePriorityScore(90, 50, true);
    const low = computePriorityScore(10, 50, true);
    assert.ok(critical > low);
  });
});
