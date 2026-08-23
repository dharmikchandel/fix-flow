"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * One QueryClient per browser tab, created once and reused across renders —
 * this is what actually replaces the old per-page useState+useEffect
 * fetch-on-mount pattern: pages declare *what* they need via `useQuery`, and
 * this client handles caching, retrying, deduping simultaneous requests for
 * the same data, and refetching when the window regains focus.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
