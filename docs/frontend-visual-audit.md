# Frontend visual & system audit

**Scope:** `resources/js`, `resources/css`, shared UI under `resources/js/components/ui`, landing under `resources/js/pages/landing-page`.  
**Stack:** React 19, Inertia, Tailwind CSS v4 (`@import 'tailwindcss'`), Radix/shadcn-style primitives, Instrument Sans via `@theme`, i18next (default `ar`).

---

## 1. Executive visual verdict

The app is a **capable admin + storefront split**: the **dashboard and app shell** lean on a coherent shadcn-style token system (`app.css` `@theme`, CSS variables, dark mode). The **marketing landing** is **structurally modular** (ordered sections, brand colors from settings) but **visually uneven**: heavy reliance on generic grays, similar section rhythms, duplicated scroll-reveal patterns, inline `<style>` injections in `HeroSection`, and occasional **implementation bugs** (broken scroll listener on the landing header, malformed Tailwind class on `WhyChooseUs`, typoed icon keys in `FeaturesSection`) that undermine polish. **Motion** is mostly CSS keyframes and `useScrollAnimation`; it is **not centrally governed** (no shared reduced-motion contract on the landing until this redesign).

**Verdict:** Strong foundation in the **application shell**; the **landing** reads as “functional SaaS template” rather than **premium, cinematic marketing**—fixable without rewriting the whole app.

---

## 2. Strongest UI areas

| Area | Evidence |
|------|----------|
| **Design tokens & dark mode** | `resources/css/app.css` `@theme` maps semantic colors, radius, sidebar tokens. |
| **Radix-based components** | `components/ui/*` (dialog, sidebar, button variants) — consistent interaction primitives. |
| **Dashboard information density** | `pages/dashboard.tsx` + `PageTemplate` — structured cards, actions, QR/store URL patterns. |
| **Landing modularity** | `pages/landing-page/index.tsx` section map + `LandingPageSetting` defaults — good separation of content order vs. layout. |
| **RTL awareness on landing** | `index.tsx` sets `dir` on `<html>` / `body` from i18n — important for `ar` default. |

---

## 3. Weakest UI areas

| Area | Issue |
|------|--------|
| **Landing hero** | Center-only layout, generic blur orbs, duplicate keyframes via `dangerouslySetInnerHTML`, CTA hover mutates inline styles. |
| **Section sameness** | Many sections: `py-20 md:py-32`, gray background alternation, similar “badge + h2 + subtitle” without strong pacing. |
| **Trust / social proof** | Controller passes empty `testimonials` / `faqs`; UI falls back to **hardcoded** testimonials in `TestimonialsSection` — inconsistent data story. |
| **Featured stores block** | Inline JSX in `index.tsx` — basic cards, not compositional “premium” treatment. |
| **Footer** | Dark bar is minimal; product/company links in component are partly **static placeholders** (`#`), weak hierarchy vs. hero. |
| **Plans section** | Large default plan fallback in component when DB empty — visually heavy, copy still “digital networking” flavored in places. |
| **Bug: landing header scroll state** | `Header.tsx` listens for `'croll'` instead of `'scroll'` — scroll-based styling never runs. |
| **Bug: feature icons** | `FeaturesSection` icon map uses broken keys (`hare`, `hield`, `tar`) so wrong/missing Lucide icons. |
| **Bug: WhyChooseUs spacing** | Class `py-1- md:py-16` is invalid / inconsistent vertical rhythm. |

---

## 4. Global design system issues

- **Two visual languages:** Token-driven **app** UI vs. **landing** using lots of raw `gray-*`, `border-gray-200`, and inline `brandColor` — predictable but not “systematic.”
- **Typography:** Landing headlines rely on default sans scale; limited **display / tracking / fluid type** treatment for marketing impact.
- **Spacing rhythm:** Repeated `py-20 md:py-32` without a named scale or section “acts” (intro → proof → detail → convert).
- **Cards:** Similar `rounded-xl border shadow` everywhere — few **tiered** surfaces (hero vs. content vs. footer).
- **Buttons:** Mix of shadcn `Button` in app vs. raw `Link` + inline styles on landing — **focus ring** quality varies.
- **Forms (landing):** Newsletter uses native inputs with manual ring color — OK but not aligned with `Input` component patterns.

---

## 5. Responsive issues

- Hero mockup **floats** hidden on small screens — good, but **center column** can feel long on mobile (stacked CTA + large mockup).
- **Header** mobile menu exists; scroll bug prevents sticky elevation from working.
- Dashboard and tables use responsive patterns (`PageTemplate`, `MobileTableCard` elsewhere); landing **grids** are mostly standard 1/2/3 cols — acceptable but not optimized for **mid-breakpoint** “tablet story.”

---

## 6. Motion & interaction issues

- **Duplicated animation definitions** in `HeroSection` inline `<style>` — hard to maintain, not shared.
- **Infinite float** on decorative cards — can distract; needs **reduced-motion** cutoff.
- **useScrollAnimation** + Tailwind state classes — OK, but no single **landing motion contract** (stagger, duration, easing).
- **Hover** on cards often uses **inline style mutation** in JS — works but fights Tailwind and complicates theme consistency.

---

## 7. Landing page weaknesses (conversion & narrative)

- **Hero:** Strong CTA pair, but **story** is generic; mockup is illustrative, not **product-specific** enough for “elite” positioning.
- **Missing explicit workflow** in section order — user must infer steps (addressed in redesign by inserting a **workflow** section via merged order).
- **Pricing CTA** exists in `PlansSection` but **visual weight** similar to other sections — needs clearer **final act** before footer.
- **Footer** underuses brand gradient and **final CTA** band.

---

## 8. Highest-impact UI fixes (pre-/post-redesign)

1. Fix **Header** scroll event typo (`scroll`).
2. Fix **FeaturesSection** Lucide icon map keys (`share-2` → `Share2`, `shield`, `star`).
3. Fix **WhyChooseUs** padding class typo.
4. Fix **custom CSS injection** `createElement('tyle')` → `'style'` in `landing-page/index.tsx`.
5. **Centralize landing motion** + `prefers-reduced-motion` (Framer Motion + CSS fallbacks).
6. **Redesign hero** with clearer hierarchy, depth (perspective / layered frame), and choreographed entrance.
7. Extract **Featured stores** to a dedicated section component with upgraded visuals.
8. Add **workflow** section (merged into order for existing installs).
9. Strengthen **footer** with CTA band and clearer link hierarchy.
10. Align **Plans** cards with premium depth and focus states.

---

## 9. Screenshot target list (visual regression)

| # | Surface | Route / selector | Notes |
|---|---------|------------------|--------|
| 1 | Landing (home) | `/`, `[data-landing-page]` | Primary marketing |
| 2 | Landing mobile | `/`, viewport 390×844 | Thumb zone, stacked hero |
| 3 | Landing tablet | `/`, viewport 834×1112 | Layout shift |
| 4 | Login | `/login`, `[data-testid="auth-shell"]` | Auth funnel |
| 5 | Register | `/register` | Auth funnel |
| 6 | Contact | `/contact` | Public lead form |
| 7 | Documentation index | `/docs` | Public help |
| 8 | Dashboard | `/dashboard` | Requires auth + plan; optional env gate |
| 9 | Products index | `/products` | List CRUD shell |
| 10 | Product edit | `/products/{id}/edit` | Form density |
| 11 | Settings | `/settings` or `/profile` | Account/settings |
| 12 | Modal / dialog | Products delete confirm (auth) | Radix dialog |
| 13 | Docs or landing section | `#features` anchor crop | Optional focused clip |

---

## 10. Refactor priorities

| Priority | Item |
|----------|------|
| P0 | Landing bugs (header scroll, icon map, `tyle`, WhyChooseUs class) |
| P0 | Reduced-motion + performance-safe motion |
| P1 | Hero + section pacing + workflow + featured stores componentization |
| P1 | Footer CTA + pricing visual hierarchy |
| P2 | Consolidate landing animations (remove per-section inline keyframes where possible) |
| P2 | Align landing form controls with `Input` / focus tokens |
| P3 | Long-term: drive testimonials/FAQ from CMS/API instead of static fallbacks |

---

*Generated from static codebase review; runtime branding (logos, custom CSS from DB) may alter screenshots.*
