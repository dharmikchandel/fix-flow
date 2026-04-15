import type { SeverityResult, SeverityLabel } from "../models/types.js";

// ─── Critical keyword sets with weights ──────────────────────────────────────

const CRITICAL_KEYWORDS = [
  "crash", "fatal", "unresponsive", "data loss", "security breach",
  "corruption", "deadlock", "hang", "freeze", "exploit",
] as const;

const HIGH_KEYWORDS = [
  "failure", "error", "broken", "unusable", "regression",
  "blocker", "severe", "critical", "exception", "timeout",
] as const;

const MEDIUM_KEYWORDS = [
  "slow", "incorrect", "wrong", "unexpected", "inconsistent",
  "missing", "delay", "glitch", "flicker",
] as const;

// ─── Impact scores by module ─────────────────────────────────────────────────

const MODULE_IMPACT: Record<string, number> = {
  auth: 25,
  payment: 30,
  security: 30,
  database: 25,
  api: 20,
  core: 20,
  ui: 10,
  docs: 5,
};

const DEFAULT_MODULE_IMPACT = 15;

// ─── Environment multipliers ─────────────────────────────────────────────────

const ENVIRONMENT_MULTIPLIER: Record<string, number> = {
  production: 1.3,
  staging: 1.0,
  development: 0.8,
  test: 0.6,
};

const DEFAULT_ENV_MULTIPLIER = 1.0;

/**
 * Severity Calculation Service
 *
 * Computes a severity score (0–100) and label based on:
 *   1. Keyword analysis (critical/high/medium keywords in title + description)
 *   2. Module impact weighting
 *   3. Environment multiplier
 *   4. Text length heuristic (longer descriptions often indicate more complex bugs)
 */
export function calculateSeverity(
  title: string,
  description: string,
  module: string,
  environment?: string,
): SeverityResult {
  const combinedText = `${title} ${description}`.toLowerCase();

  // ── Keyword scoring ──────────────────────────────────────────────────────
  let keywordScore = 0;

  for (const kw of CRITICAL_KEYWORDS) {
    if (combinedText.includes(kw)) {
      keywordScore += 15;
    }
  }
  for (const kw of HIGH_KEYWORDS) {
    if (combinedText.includes(kw)) {
      keywordScore += 10;
    }
  }
  for (const kw of MEDIUM_KEYWORDS) {
    if (combinedText.includes(kw)) {
      keywordScore += 5;
    }
  }

  // Cap keyword score at 50
  keywordScore = Math.min(keywordScore, 50);

  // ── Module impact ────────────────────────────────────────────────────────
  const moduleScore = MODULE_IMPACT[module.toLowerCase()] ?? DEFAULT_MODULE_IMPACT;

  // ── Description depth bonus (longer reports = more detail = potentially more severe) ──
  const descLength = description.length;
  let depthBonus = 0;
  if (descLength > 500) depthBonus = 10;
  else if (descLength > 200) depthBonus = 5;
  else if (descLength > 50) depthBonus = 2;

  // ── Raw score ────────────────────────────────────────────────────────────
  let rawScore = keywordScore + moduleScore + depthBonus;

  // ── Environment multiplier ───────────────────────────────────────────────
  const envKey = environment?.toLowerCase() ?? "";
  const envMultiplier = ENVIRONMENT_MULTIPLIER[envKey] ?? DEFAULT_ENV_MULTIPLIER;

  rawScore = Math.round(rawScore * envMultiplier);

  // ── Clamp to 0–100 ──────────────────────────────────────────────────────
  const score = Math.max(0, Math.min(100, rawScore));

  // ── Label mapping ────────────────────────────────────────────────────────
  const label = scoreToLabel(score);

  return { score, label };
}

function scoreToLabel(score: number): SeverityLabel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}
