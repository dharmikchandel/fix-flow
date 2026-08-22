"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"

/** The login page renders full-bleed, with no sidebar/navbar chrome around it. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-0)]">
          <div className="mx-auto max-w-[1600px] w-full p-4 md:p-8">{children}</div>
        </main>
      </div>
    </>
  )
}
