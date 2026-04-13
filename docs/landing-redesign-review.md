# Landing page redesign — implementation review

## 1. What changed visually

- **Hero:** Switched from a single centered column to a **two-column cinematic layout** (copy + stats left, **perspective mockup** right on large screens). Added **layered mesh gradients** and subtle **noise**, glass-style announcement pill, refined typography scale, and **LogIn** icon for the secondary CTA (replacing the misleading Play icon).
- **Features:** Cards use **deeper elevation**, hover lift, gradient accent line, and corrected **Lucide icons** (shield for security).
- **Workflow:** New **dark “how it works” band** with three steps, monospace indices, and hover depth — inserted after **Features** for existing installs via merge logic.
- **Featured stores:** Replaced inline grid in `index.tsx` with a dedicated section — **social proof** label, improved cards, and CTA treatment.
- **Footer:** Added a **final CTA band** (headline + register/login) above the legal bar; fixed social icon hover querying **`svg`** (was broken `vg`).

## 2. What changed structurally

- New files: `resources/css/landing-premium.css`, `lib/landing-motion.ts`, `WorkflowSection.tsx`, `FeaturedStoresSection.tsx`.
- `landing-page/index.tsx`: imports premium CSS; fixes **`createElement('style')`** bug; **`mergeLandingSectionOrder`** injects `workflow` after `features` for legacy DB configs; maps `workflow` and uses `FeaturedStoresSection`.
- **Defaults:** `LandingPageSetting` PHP defaults, `default-sections.ts` — `workflow` in `section_order` and `section_visibility`.
- **i18n:** `landing.workflow.*` in `en.json` and `ar.json`.

## 3. Motion system summary

- **Framer Motion** with **`useReducedMotion()`**: staggered hero copy uses `landingContainer` / `landingFadeUp`; sections use `whileInView` + `viewport.once` for reveal rhythm.
- **CSS:** `landing-premium.css` provides mesh, noise, mockup **3D perspective**; **`prefers-reduced-motion`** disables mockup transform and relies on short/zero transitions from motion hook.
- **Ambient motion:** Slow vertical float on hero side cards only when **not** reduced-motion.

## 4. 3D / depth treatment summary

- **No WebGL / Three.js** — depth via **CSS perspective** on `.landing-mockup-frame`, layered **radial gradients**, glass borders, and shadow stacks tied to **brand primary**.

## 5. Accessibility & reduced-motion

- Hero retains **`aria-labelledby`** / landmark usage; CTAs use **`focus-visible`** ring classes (`landing-cta-*` in CSS).
- **`prefers-reduced-motion: reduce`** disables perspective hover/transform on the mockup frame (see `landing-premium.css`).
- Framer variants shorten to **near-zero duration** when reduced motion is requested.

## 6. Performance considerations

- **Framer Motion** is already in the landing chunk only through section imports (tree-shaken per route).
- **Noise** is a tiny inline SVG data-URI; **gradients** are CSS-only.
- **whileInView** with `once: true` avoids continuous scroll listeners.

## 7. Remaining weaknesses

- **Testimonials** still mix backend emptiness with **static defaults** in `TestimonialsSection` (pre-existing product behavior).
- **PlansSection** still contains **client-side default plans** when no enabled DB plans — not changed in this pass.
- **Landing** remains **light-first**; dark utilities on hero are for edge cases if global dark is applied to document.
- **Playwright baselines** are not committed in this change set — run `npm run test:visual:update` locally/CI to generate PNGs.

## 8. Follow-up recommendations

- Wire **workflow** visibility into superadmin **landing settings** UI if merchants should toggle it.
- Replace placeholder **footer / template** `#` links with real routes or CMS-driven links.
- Add **Playwright storage** to CI as an encrypted artifact for authenticated snapshots.
- Consider migrating landing section animations fully off **inline style mutation** (remaining sections).

---

## Files touched (summary)

| File | Why |
|------|-----|
| `docs/frontend-visual-audit.md` | Phase 1 audit |
| `docs/visual-regression-plan.md` | Phase 2 plan |
| `docs/landing-redesign-review.md` | This review |
| `playwright.config.ts` | Visual test runner + optional auth project |
| `e2e/visual/critical.spec.ts` | Public route screenshots |
| `e2e/visual/authenticated.spec.ts` | Optional auth screenshots |
| `e2e/README.md` | How to run |
| `package.json` | `framer-motion`, `@playwright/test`, scripts |
| `resources/css/landing-premium.css` | Mesh, noise, 3D frame, a11y focus |
| `resources/js/pages/landing-page/index.tsx` | CSS import, workflow merge, sections, `style` tag fix |
| `resources/js/pages/landing-page/lib/landing-motion.ts` | Shared motion variants |
| `resources/js/pages/landing-page/components/HeroSection.tsx` | Redesign |
| `resources/js/pages/landing-page/components/FeaturesSection.tsx` | Icons + motion |
| `resources/js/pages/landing-page/components/WorkflowSection.tsx` | New section |
| `resources/js/pages/landing-page/components/FeaturedStoresSection.tsx` | Extract + polish |
| `resources/js/pages/landing-page/components/Header.tsx` | Scroll bug + test id |
| `resources/js/pages/landing-page/components/Footer.tsx` | CTA band + svg fix |
| `resources/js/pages/landing-page/components/WhyChooseUs.tsx` | Padding + icon map |
| `resources/js/pages/landing-page/templates/default-sections.ts` | Workflow defaults |
| `app/Models/LandingPageSetting.php` | Default order + visibility |
| `resources/lang/en.json`, `ar.json` | Workflow copy |
| `resources/js/components/documentation/DocumentationLayout.tsx` | test id |
| `resources/js/layouts/auth-layout.tsx` | test id |
| `resources/js/components/app-shell.tsx` | test id |
| `resources/js/pages/products/index.tsx` | Dialog test id |
