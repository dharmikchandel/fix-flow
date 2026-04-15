import prisma from "../config/database.js";
import { computeSimilarity } from "../utils/similarity.js";
import type { DuplicateMatch } from "../models/types.js";

/** Minimum similarity threshold to consider a bug as a potential duplicate */
const SIMILARITY_THRESHOLD = 0.5;

/** Maximum number of similar bugs to return */
const MAX_DUPLICATES = 5;

/**
 * Duplicate Detection Service
 *
 * Compares a new bug's title and description against all existing open bugs
 * using the Sørensen–Dice coefficient. Returns matches above the threshold
 * sorted by similarity score (descending).
 *
 * This is a basic implementation suitable for moderate dataset sizes.
 * For production scale, consider:
 *   - PostgreSQL full-text search with ts_vector
 *   - Embedding-based similarity with pgvector
 *   - Inverted index for candidate pre-filtering
 */
export async function findDuplicates(
  title: string,
  description: string,
  excludeBugId?: string,
): Promise<DuplicateMatch[]> {
  // Fetch existing open bugs to compare against
  const existingBugs = await prisma.bugReport.findMany({
    where: {
      status: { not: "closed" },
      ...(excludeBugId ? { id: { not: excludeBugId } } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
    },
  });

  const matches: DuplicateMatch[] = [];

  for (const bug of existingBugs) {
    const similarity = computeSimilarity(title, description, bug.title, bug.description);

    if (similarity >= SIMILARITY_THRESHOLD) {
      matches.push({
        bugId: bug.id,
        title: bug.title,
        similarity: Math.round(similarity * 100) / 100, // round to 2 decimals
      });
    }
  }

  // Sort by similarity descending and limit results
  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, MAX_DUPLICATES);
}
