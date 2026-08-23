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

// ─── Confidence ───────────────────────────────────────────────────────────────

// Label boundaries the score gets bucketed against (see scoreToLabel below).
const LABEL_BOUNDARIES = [25, 50, 75];
// A score this far from the nearest boundary is read as "fully confident" —
// half the width of one label bucket.
const MAX_MEANINGFUL_DISTANCE = 12.5;

export interface SeverityBreakdown extends SeverityResult {
  /**
   * How far the score sits from the nearest Low/Medium/High/Critical
   * boundary, expressed as 50–100%. A score of 74 (one point from being
   * "Critical") is genuinely less certain than a score of 95 — this makes
   * that visible instead of presenting every label with false certainty.
   */
  confidence: number;
  keywordScore: number;
  moduleScore: number;
  depthBonus: number;
  envMultiplier: number;
}

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
  const { score, label } = explainSeverity(title, description, module, environment);
  return { score, label };
}

/**
 * Same computation as `calculateSeverity`, but also returns the pieces that
 * went into the score and a confidence read on the label — the "receipt"
 * behind an otherwise-opaque number. Used by the bug detail page's severity
 * breakdown; recomputed on demand from the bug's own stored fields rather
 * than stored separately, since it's fully deterministic from them.
 */
export function explainSeverity(
  title: string,
  description: string,
  module: string,
  environment?: string,
): SeverityBreakdown {
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

  // ── Label + confidence ───────────────────────────────────────────────────
  const label = scoreToLabel(score);
  const confidence = computeConfidence(score);

  return { score, label, confidence, keywordScore, moduleScore, depthBonus, envMultiplier };
}

function scoreToLabel(score: number): SeverityLabel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 25) return "Medium";
  return "Low";
}

function computeConfidence(score: number): number {
  const distance = Math.min(...LABEL_BOUNDARIES.map((b) => Math.abs(score - b)));
  const normalized = Math.min(distance / MAX_MEANINGFUL_DISTANCE, 1);
  return Math.round(50 + normalized * 50);
}
