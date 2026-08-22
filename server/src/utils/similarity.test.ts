import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { diceCoefficient, computeSimilarity } from "./similarity.js";

describe("diceCoefficient", () => {
  test("identical strings score 1", () => {
    assert.equal(diceCoefficient("login crash", "login crash"), 1);
  });

  test("completely different strings score close to 0", () => {
    assert.ok(diceCoefficient("login crash on startup", "docs typo in readme") < 0.3);
  });

  test("is case-insensitive", () => {
    assert.equal(diceCoefficient("Login Crash", "login crash"), 1);
  });

  test("two empty strings are treated as identical", () => {
    assert.equal(diceCoefficient("", ""), 1);
  });

  test("one empty string against a non-empty one scores 0", () => {
    assert.equal(diceCoefficient("", "login crash"), 0);
  });
});

describe("computeSimilarity", () => {
  test("weights title similarity more heavily than description similarity", () => {
    // Same title, wildly different descriptions.
    const titleMatchOnly = computeSimilarity(
      "Login crashes on submit",
      "Happens on the mobile app only.",
      "Login crashes on submit",
      "Only reproducible on desktop Safari.",
    );
    // Same description, wildly different titles.
    const descMatchOnly = computeSimilarity(
      "App freezes",
      "Happens on the mobile app only.",
      "Payment fails silently",
      "Happens on the mobile app only.",
    );
    assert.ok(titleMatchOnly > descMatchOnly);
  });
});
