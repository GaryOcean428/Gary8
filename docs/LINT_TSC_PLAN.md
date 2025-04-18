 # Lint & TypeScript Cleanup Plan

 ## Overview
 This document outlines phases and detailed tasks for achieving a clean lint and type‑safe codebase.

 ## Phases & Steps
 
 ### 1. Configuration Updates
 - Configure ESLint environments:
   - browser & Node for UI and server code.
   - Deno for Supabase edge functions under `supabase/functions`.
 - Relax or disable noisy rules:
   - `no-undef` (allow known globals: `process`, `window`, `document`).
   - `@typescript-eslint/no-explicit-any` → **warn**.
   - `@typescript-eslint/no-unused-vars`: allow `_`‑prefixed identifiers.
   - `react-refresh/only-export-components` → **off**.
   - `no-case-declarations` → **off**.

 ### 2. Automated Fixes
 - Run `eslint --fix` for auto‑fixable issues.
 - Remove or deprecate trivial lint ignores where safe.

 ### 3. Manual Cleanup
- Step 3.1: Fix JSX map callbacks to remove stray semicolons and braces
  - 3.1.a Characters map: ✅ Done
  - 3.1.b Underwater bubbles map: ✅ Done
  - 3.1.c Abstract shapes map: ✅ Done
- Step 3.2: Remove parse errors in Chat.tsx and ChatHistory.tsx → ✅ Done
- Step 3.3: Remove or prefix unused variables with `_`:
  - 3.3.a Identify all `no-unused-vars` warnings via `eslint . --ext .ts,.tsx --rule '@typescript-eslint/no-unused-vars': 2`.
  - 3.3.b Prefix unused variables and function parameters with `_` (e.g. `_value`) or remove if truly unnecessary.
  - 3.3.c Eliminate unused imports and disable directives (`eslint-disable`) where no longer needed.

- Step 3.4: Demote or refactor explicit `any` in core modules:
  - 3.4.a Run `tsc --noEmit` to locate all implicit and explicit `any` usages.
  - 3.4.b Replace `any` with accurate interfaces, union types, or `unknown` with runtime type guards.
  - 3.4.c Add `// TODO` comments for complex types to revisit in a separate tagging sprint.

- Step 3.5: Hoist variable declarations out of `switch` cases:
  - 3.5.a Wrap `case` blocks in braces or declare variables before the `switch` statement to satisfy ESLint’s `no-case-declarations`.
  - 3.5.b Apply fixes in key files (`Chat.tsx`, `Router.ts`, `api-client.ts`, etc.).

- Step 3.6: Address React Hooks `exhaustive-deps` warnings:
  - 3.6.a Audit all `useEffect`, `useCallback`, and `useMemo` hooks for missing dependencies.
  - 3.6.b Add any missing items to dependency arrays or refactor logic into stable callbacks.
  - 3.6.c Document known exceptions with targeted `// eslint-disable-next-line react-hooks/exhaustive-deps` and explanations.

 ### 4. Component & Feature Refactors
 - Step 4.1: Canvas Panel alignment with Bolt patterns:
   - 4.1.a Review `/core/router.ts` and `/docs/bolt.diy` for Bolt UI guidelines.
   - 4.1.b Refactor `CanvasPanel` component to use Bolt primitives (panels, buttons, icons).
   - 4.1.c Define or tighten TypeScript interfaces for canvas props and state.
   - 4.1.d Add or update unit tests and stories for `CanvasPanel`.

 - Step 4.2: Core component type and lint refactors:
   - 4.2.a Audit shared UI components for missing return types and explicit `any`.
   - 4.2.b Add precise prop interface definitions; replace `any` with specific unions or generics.
   - 4.2.c Ensure all components export named types and default exports consistently.

 - Step 4.3: Documentation sync:
   - 4.3.a Update examples in README.md and ROADMAP.md to match refactored APIs.
   - 4.3.b Regenerate or revise docs in `/docs` (`API_DOCUMENTATION.md`, `CANVAS.md`, etc.) for code samples.
   - 4.3.c Commit updated docs and verify links.

 ### 5. Validation & CI Integration
 - Step 5.1: Local validation:
   - 5.1.a Run `yarn lint` and `yarn type-check` (or `npm run lint && npm run type-check`) until zero errors.
   - 5.1.b Execute full test suite (`yarn test`) and verify coverage does not regress.

 - Step 5.2: CI pipeline updates:
   - 5.2.a Add lint and type‑check jobs to `.github/workflows/ci.yml` (or equivalent):
     - Run `npm ci`, `npm run lint -- --max-warnings=0`, `npm run type-check`.
     - Fail build on any lint or type errors.
   - 5.2.b Integrate `lint-staged` in `package.json` with pre-commit hook:
     - Configure to run `eslint --fix` and `prettier --write` on staged files.

 - Step 5.3: Documentation of process:
   - 5.3.a Add `CONTRIBUTING.md` section describing lint and type-check commands.
   - 5.3.b Update project README with developer setup: lint, types, tests.
   - 5.3.c Ensure `docs/LINT_TSC_PLAN.md` references current workflow.