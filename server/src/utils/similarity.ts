/**
 * Compute bigram set for a string.
 * A bigram is every consecutive pair of characters in a lowercased, trimmed string.
 */
function bigrams(str: string): Set<string> {
  const normalized = str.toLowerCase().trim();
  const set = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    set.add(normalized.slice(i, i + 2));
  }
  return set;
}

/**
 * Sørensen–Dice coefficient for two strings.
 * Returns a value between 0 (no similarity) and 1 (identical).
 */
export function diceCoefficient(a: string, b: string): number {
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);

  if (bigramsA.size === 0 && bigramsB.size === 0) return 1;
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }

  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Combine title and description similarity with weighted average.
 * Title match is weighted more heavily since it's a stronger signal.
 */
export function computeSimilarity(
  titleA: string,
  descA: string,
  titleB: string,
  descB: string,
): number {
  const titleSim = diceCoefficient(titleA, titleB);
  const descSim = diceCoefficient(descA, descB);

  // Title carries 60% weight, description 40%
  return titleSim * 0.6 + descSim * 0.4;
}
