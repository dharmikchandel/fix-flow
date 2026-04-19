<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

- Framework: Next.js (App Router)
- UI: shadcn/ui
- Styling: Tailwind + CSS variables
- Backend: Node.js + Express (separate)

- Strict dark mode only (no light mode)
- Follow design system defined in DESIGN.md
- Neon accents must be used sparingly (10–15%)
- No default shadcn styling — always override
- UI must remain clean, minimal, and readable

- DO NOT execute terminal commands
- ONLY modify files
- DO NOT introduce new frameworks or tools
- DO NOT over-engineer components

- Start with app shell (layout, navbar, sidebar)
- Then build:
  - Bug list page
  - Bug card component
  - Bug detail view
- Then integrate backend APIs

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
