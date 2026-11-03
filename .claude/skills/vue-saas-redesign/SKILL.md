---
name: vue-saas-redesign
description: Redesign a Vue 3 application's UI into a modern, polished SaaS-style interface — a collapsible vertical navigation sidebar on the left (replacing a top nav bar), user profile and language switcher in the sidebar footer, a design-token based spacing/type/color system, and consistent page headers, cards, tables and badges across every view. Use this skill whenever the user wants to modernize, restyle, refresh, "make professional", or re-layout a Vue 3 / Vite frontend, asks to move navigation into a sidebar or side menu, wants an admin-panel or dashboard look like Linear, Vercel or Stripe, or complains that the UI spacing is inconsistent — even if they don't say "SaaS" or "sidebar" explicitly.
---

# Vue 3 SaaS Sidebar Redesign

Turn an existing Vue 3 app into a calm, professional SaaS interface without breaking what it does. The visible result is a left sidebar that collapses to an icon rail, a content area with one consistent page rhythm, and a small token system that every view draws from.

This is a **visual and structural** refactor. Routes, data loading, API calls, i18n keys, emitted events and component props keep working exactly as before. If the redesign makes a feature disappear or a page stop loading, it has failed, however good it looks.

## Workflow

### 1. Discover before touching anything

Read enough to answer these questions, and write the answers down briefly for yourself:

- **Shell**: Which component renders the top nav and `<router-view>`? This is usually `App.vue`, sometimes a `layouts/` component.
- **Navigation source**: Are the nav links hard-coded `<router-link>`s, or generated from the router config? Collect every item: path, label (including its i18n key, e.g. `t('nav.orders')`) and active-state logic.
- **Things living in the top bar** besides links: logo or app name, profile menu, language switcher, notifications, search. Each must get a new home, never be dropped.
- **Global UI between header and content**, such as a filter bar or breadcrumbs. It stays in the content area, above the page.
- **Anything sized or offset by the old header's height**: `top: 70px` on sticky bars, `scroll-margin-top`, `calc(100vh - 70px)`. These break silently once the header is gone. Also note every `z-index` on sticky elements, because the sidebar and its overlay must sit above them.
- **Untranslated nav labels**: if the app has i18n and a label is hard-coded, add a key in every locale so the sidebar isn't half-translated.
- **Styling approach**: global CSS in `App.vue` or `main.css`, scoped styles, Tailwind, or a UI library (Vuetify, PrimeVue, Element Plus, Naive UI). Work *with* what's there. Don't add Tailwind or a component library to a plain-CSS app, or swap one library for another, unless the user asks.
- **Existing colors and fonts**: collect the hex values in use. The redesign should feel like the same product, refined, and not a rebrand.
- **Script style**: `<script setup>` or `setup()` with Options-style `export default`. New files follow the project's stated convention (CLAUDE.md), or the majority style if none is stated. Edited files keep their own style, even in a mixed codebase.
- **Project rules**: read `CLAUDE.md` files and `.claude/agents/`. If the project requires .vue edits to go through a specific subagent, follow that. Also follow its design rules (for example "no emojis in UI") and code conventions.

### 2. Lay down the token system first

Before you change the layout, add CSS custom properties on `:root` in the global stylesheet. Everything after this step uses them. That's what makes spacing "consistent": one scale applied everywhere, rather than many good-looking numbers chosen one at a time.

Use `references/design-tokens.md` for the full token sheet and how to map existing colors onto it. The essentials:

- Spacing on a 4px base: `--space-1` (4px) through `--space-12` (48px). Page padding, card padding and the gaps between sections each get exactly one token.
- A short type scale (12/13/14/16/20/24px) with two or three weights.
- Neutral surface, border and text tokens, one accent, and status colors (success/warning/danger/info), each with a soft background variant for badges.
- Radius (6/8/12px), two shadows (subtle and raised) and layout tokens: `--sidebar-width: 240px`, `--sidebar-width-collapsed: 64px`, `--content-max-width`.

Then **replace existing hard-coded values** in the shared global classes (`.card`, `.stat-card`, `.badge`, tables, page header) with tokens. Leave one-off values inside individual views alone unless they visibly break the rhythm.

### 3. Build the shell

Target structure:

```
┌──────────────┬──────────────────────────────────────────┐
│ Logo / name  │  (global bar, e.g. filters)              │
│              ├──────────────────────────────────────────┤
│ ▸ Overview   │  Page header: title + subtitle + actions │
│ ▸ Inventory  │                                          │
│ ▸ Orders     │  Page content (cards, tables, charts)    │
│   …          │                                          │
│              │                                          │
│──────────────│                                          │
│ Language     │                                          │
│ Profile      │                                          │
│ « Collapse   │                                          │
└──────────────┴──────────────────────────────────────────┘
```

Create a dedicated `AppSidebar.vue` (or the project's naming equivalent) instead of growing `App.vue`. `references/sidebar-pattern.md` has a complete reference implementation to adapt. Key behaviors:

- **One nav array** drives the links: `{ to, labelKey or label, icon }`. Adding a page later should mean adding one entry.
- **Active state** via `router-link`'s `active-class` / `exact-active-class`, or the existing logic. Make sure `/` doesn't light up on every route. Set `aria-current="page"` (router-link does this for exact matches).
- **Icons**: each item gets a small inline SVG (20px, `stroke="currentColor"`, 1.75 stroke width) so the collapsed rail is still usable. Pick shapes that match the item's meaning, and keep them in one place (an `icons` map or a tiny `NavIcon.vue`). Don't add an icon package unless the project already has one, in which case use it.
- **Collapse to icon rail**: a toggle button in the footer switches between `--sidebar-width` and `--sidebar-width-collapsed`. When collapsed, labels hide, and each item keeps an accessible name (`aria-label` and a `title` tooltip). Persist the choice in `localStorage`, wrapped in `try/catch`, because storage can throw in private mode and the app must still render. Keep the state in a small composable (`useSidebar`) so other components can react to it.
- **Footer**: move the existing profile menu and language switcher here, reusing the existing components and their events. Don't rewrite their logic. Popovers that used to open *downward* from a top bar now need to open *upward or to the right*, so check their positioning. In the collapsed state, show only the avatar/initials and a compact language control.
- **Layout mechanics**: the sidebar is `position: sticky; top: 0; height: 100vh` (or fixed) with its own scroll. The content column takes the rest (`grid-template-columns: var(--sidebar-current) 1fr` or flex). Animate width with a short transition (150–200ms) and respect `prefers-reduced-motion`.
- **Small screens (icons-only mode)**: below 1024px, the sidebar automatically becomes the icon rail and reacts live to resizing, whatever the saved desktop preference is. The toggle then opens the full sidebar as an overlay with a scrim, so the content keeps its width. The overlay closes on scrim click, Escape or navigation, and that temporary state is never saved. `references/sidebar-pattern.md` shows the composable and CSS.

### 4. Bring every view into the same rhythm

Go through each routed view and make it follow one page template. Wrap each view's content in a `.page-stack` flex column with a single `gap` token, and drop per-card margins. That's what makes section spacing identical everywhere (see `references/sidebar-pattern.md`).

- A **page header** (`.page-header`): title (20–24px, semibold), optional one-line muted description, actions aligned right. Use the same spacing below it on every page.
- **Stat/KPI cards** in an auto-fit grid (`repeat(auto-fit, minmax(220px, 1fr))`), with label above value, muted label and tabular numerals for the figures.
- **Cards**: one border, a subtle shadow at most, `--radius-lg`, padding `--space-6`, and a header row with title and optional actions.
- **Tables**: sticky or clearly styled header row in muted small caps, comfortable row height (~44px), hover tint, right-aligned numeric columns, and `font-variant-numeric: tabular-nums`.
- **Badges/status pills**: the soft background plus strong text of the matching status token.
- **Buttons and inputs**: one height (32–36px), one radius, and a visible `:focus-visible` ring using the accent color.

Prefer moving views onto the shared global classes over adding more scoped CSS. Don't change what data a view shows, its computed properties, or its API calls.

### 5. Verify like a user

A redesign that "looks right in the code" often breaks in the browser. Before reporting done:

1. **Build**: `npm run build` (or the project's build script) passes with no new warnings.
2. **Run it**: start the dev server. If the usual port is taken, pass another (`npx vite --port 3100`) rather than killing someone else's server.
3. **Click through every route** in the expanded and collapsed sidebar. Check the active highlight, that each page loads its data, the profile menu, the language switch (labels change, layout doesn't break with longer strings), and that the collapse state survives a reload.
4. **Check narrow widths** (~1000px and ~600px): the rail appears automatically, the overlay opens and closes, and there's no overflow or horizontal scroll. Resize back to desktop width and confirm the saved preference returns.
5. **Console**: no new errors or Vue warnings.

Use browser automation if available (for example Playwright MCP tools) to take a screenshot of each route. Otherwise, use headless Chrome:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,900 --screenshot=out.png http://localhost:3100/orders`.
Look at the screenshots. They're the closest you'll get to the user's eye.

### 6. Report

Tell the user, briefly:
- What changed structurally (new components, where the profile and language controls moved, the token file and location).
- Which views were brought onto the shared styles.
- What you verified and how. If something couldn't be verified, say so.
- Anything you deliberately left alone, and any pre-existing bugs you noticed but didn't fix (a redesign isn't the place to fix them silently).

## Design principles (the "why" behind polished)

- **Restraint reads as professional.** Neutral surfaces, one accent, color reserved for meaning (status, active state, primary action). Most "amateur" UIs have too many colors and borders, not too few.
- **Hierarchy through size, weight and muted color**, not boxes inside boxes. A card doesn't need a card inside it.
- **Alignment and repetition.** The same left edge, the same gaps and the same header pattern on every page are what make an app feel designed.
- **Density suited to data apps.** SaaS dashboards are scanned, so 14px body text and compact but breathable tables beat marketing-site spacing.
- **Accessible by default.** Contrast at least 4.5:1 for text, visible focus, real buttons for actions, labels that survive the collapsed state.

## Code hygiene

- Comment non-obvious logic (for example, why `/` uses exact matching, or why storage access is wrapped in try/catch). Skip comments that restate the code.
- No new dependencies without asking.
- Don't leave dead CSS for the old top nav. Remove the `.top-nav`-style rules you replaced.
