import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateSeverity } from "./severityService.js";

describe("calculateSeverity", () => {
  test("a plain, low-signal UI report in a low-weight module scores Low", () => {
    const result = calculateSeverity("Button is misaligned", "The submit button is a few pixels off on the settings page.", "ui");
    assert.equal(result.label, "Low");
  });

  test("critical keywords in a high-impact module push the score into Critical", () => {
    const result = calculateSeverity(
      "App crashes on login",
      "The application crashes with a fatal, unresponsive freeze whenever a user attempts to authenticate.",
      "auth",
      "production",
    );
    assert.equal(result.label, "Critical");
    assert.ok(result.score >= 75);
  });

  test("keyword score is capped at 50 — more keyword hits beyond the cap don't raise the score", () => {
    // 4 distinct critical keywords already exceeds the 50-point cap (4 * 15 = 60);
    // 10 distinct critical keywords exceeds it further (10 * 15 = 150). Pad both
    // descriptions to the exact same length so the depth-bonus term matches too —
    // the only thing left that could differ is the (capped) keyword contribution.
    const fourKeywords = "crash fatal unresponsive hang";
    const tenKeywords = "crash fatal unresponsive deadlock hang freeze exploit corruption dataloss securitybreach";
    const targetLength = tenKeywords.length + 550; // push both well into the same depth-bonus bucket

    const withFour = calculateSeverity("Report", fourKeywords.padEnd(targetLength, " filler"), "docs");
    const withTen = calculateSeverity("Report", tenKeywords.padEnd(targetLength, " filler"), "docs");

    assert.equal(withFour.score, withTen.score);
  });

  test("environment multiplier scales the same report up or down", () => {
    const prod = calculateSeverity("Slow response", "Requests are slow and inconsistent under load.", "api", "production");
    const test_ = calculateSeverity("Slow response", "Requests are slow and inconsistent under load.", "api", "test");
    assert.ok(prod.score > test_.score);
  });

  test("an unrecognized environment falls back to a neutral multiplier instead of crashing", () => {
    // Regression check: the PRD's own example uses "Android" as an environment,
    // which doesn't match any of the four known buckets.
    assert.doesNotThrow(() => calculateSeverity("Crash on launch", "The app crashes immediately on launch.", "core", "Android"));
  });

  test("score is always clamped between 0 and 100", () => {
    const result = calculateSeverity(
      "crash fatal unresponsive deadlock hang freeze exploit corruption",
      "crash fatal unresponsive deadlock hang freeze exploit corruption data loss security breach ".repeat(5),
      "payment",
      "production",
    );
    assert.ok(result.score >= 0 && result.score <= 100);
  });
});
