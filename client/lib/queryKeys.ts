/**
 * Central place for every React Query key used in the app. Keeping them here
 * (instead of inline strings scattered across pages) is what makes cache
 * invalidation after a mutation reliable — e.g. `invalidateQueries({ queryKey:
 * queryKeys.bug(id) })` after assigning a bug only works if every query for
 * that bug used the exact same key shape in the first place.
 */
export const queryKeys = {
  me: ["me"] as const,
  bugs: (params: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    ["bugs", params] as const,
  bugsAll: ["bugs"] as const,
  bug: (id: string) => ["bug", id] as const,
  bugEvents: (id: string) => ["bug", id, "events"] as const,
  bugAttachments: (id: string) => ["bug", id, "attachments"] as const,
  priorityQueue: ["priority-queue"] as const,
  users: ["users"] as const,
  invites: ["invites"] as const,
  notifications: ["notifications"] as const,
  analytics: ["analytics"] as const,
}
