# Design tokens

Add these to the app's global stylesheet (often `App.vue`'s unscoped `<style>`, or `src/assets/main.css`). Values are a sensible SaaS default. **Before you use them, swap in the app's existing brand colors**: if the app already uses a dark slate for headings and a blue for links, those become `--color-text` and `--color-accent`.

```css
:root {
  /* Spacing: 4px base. Use these instead of raw px in layout code. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 20px;
  --text-xl: 24px;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --leading-tight: 1.25;
  --leading-normal: 1.5;

  /* Neutrals (slate) */
  --color-bg: #f8fafc;          /* app background behind content */
  --color-surface: #ffffff;     /* cards, sidebar */
  --color-surface-muted: #f1f5f9; /* table header, hover */
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;

  /* Accent: the single brand color for active nav, primary buttons, focus */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-soft: #eff6ff;

  /* Status: strong is for text/icons, soft is for pill backgrounds */
  --color-success: #15803d;  --color-success-soft: #dcfce7;
  --color-warning: #b45309;  --color-warning-soft: #fef3c7;
  --color-danger:  #b91c1c;  --color-danger-soft:  #fee2e2;
  --color-info:    #1d4ed8;  --color-info-soft:    #dbeafe;

  /* Shape & depth */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
  --focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.35);

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --content-max-width: 1440px;
  --page-padding: var(--space-8);
  --control-height: 36px;
  --transition-fast: 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  :root { --transition-fast: 0ms; }
}
```

## Mapping rules

| Where | Token |
|---|---|
| Page padding (content area) | `--page-padding` (drop to `--space-4` under 768px) |
| Gap between page sections / cards | `--space-6` |
| Card padding | `--space-6` (`--space-5` for dense KPI cards) |
| Gap inside a card between header and body | `--space-4` |
| Table cell padding | `--space-3` vertical, `--space-4` horizontal |
| Sidebar item padding | `--space-2` vertical, `--space-3` horizontal |
| Body text | `--text-base`, `--color-text` |
| Secondary text, labels | `--text-sm`, `--color-text-muted` |
| Table header | `--text-xs`, uppercase, `letter-spacing: .04em`, `--color-text-muted` |
| Page title | `--text-xl`, `--weight-semibold` |
| Card title | `--text-md`, `--weight-semibold` |
| KPI value | `--text-xl`–`28px`, `--weight-semibold`, tabular numerals |

## Sidebar palette

The sidebar can use the light surface (`--color-surface` with a right border) or a dark variant. Light is the safer default because it matches most existing apps. If the app's header was already dark (e.g. `#0f172a`), a dark sidebar keeps continuity:

```css
.sidebar--dark {
  --sidebar-bg: #0f172a;
  --sidebar-text: #cbd5e1;
  --sidebar-text-active: #ffffff;
  --sidebar-item-hover: rgba(255, 255, 255, 0.06);
  --sidebar-item-active: rgba(255, 255, 255, 0.10);
}
```

Choose one and use it consistently. Don't mix a dark sidebar with a dark top bar as well.
