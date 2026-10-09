# Frontend
- Trước khi viết UI: đọc impeccable + design-engineering
- Primitive chỉ dùng shadcn/ui
- Animation: Motion, chỉ transform/opacity, 150–300ms
- Cấm Inter, purple gradient, card lồng card
- Trước PR frontend: chạy web-design-guidelines

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Verification
- `npm test` · `npm run lint` · `npx tsc --noEmit` · `npm run build`
- Local prod check: `npm run build && PORT=3100 npm start` (custom server `server/index.ts`; `/ws` is the game socket, other upgrades go to Next for HMR)
- Game screens live in `app/choi/[game]` → `components/play/*` on top of `lib/play/useGame.ts` (AI runs in `lib/play/ai.worker.ts`)
- Puzzle data is validated by theme rules in `lib/content/content.test.ts` — fix the data, not the rule
