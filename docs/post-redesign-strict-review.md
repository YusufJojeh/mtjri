# Post-redesign strict review (self-audit)

This document audits the first landing pass **without** softening findings. Anything listed here was either fixed in the follow-up commit or explicitly accepted as debt.

---

## 1. Overdesigned motion, performance risk, “flashy not product-grade”

| Issue | Verdict |
|--------|---------|
| **Infinite `motion.div` Y oscillation** on hero “stat chips” | **Gimmick.** Duplicates the `<dl>` metrics, runs **perpetual main-thread animation**, reads as startup-template fluff. **Remove** or replace with a **one-time** entrance only. |
| **`animate-ping` on the announcement dot** | **Attention bait.** Still runs when reduced-motion only gates the ping *wrapper* logic imperfectly; Tailwind’s `animate-ping` ignores React `reduce` unless CSS overrides it. **Kill ping under `prefers-reduced-motion`** globally on the landing root. |
| **Heavy emoji cluster inside the mockup** (🏪, 🛒, 🎨, 📱) | **Not product-grade** for a B2B SaaS hero. Reads as marketing placeholder, hurts **cross-platform consistency** (emoji rendering). **Replace with Lucide** or abstract UI chrome. |
| **`Sparkles` icon repeated** (pill + mockup badge) | **Generic “AI SaaS” trope.** One accent is enough; double use dilutes identity. |
| **`backdrop-blur` + large shadows + noise + mesh + 3D perspective** | **Stacking layered effects** risks **GPU overdraw** on low-end mobile. Acceptable if **one focal effect** dominates; previously **too many** simultaneous treatments. **Tighten:** calmer perspective, optional noise reduction on small viewports. |
| **`color-mix` in inline `boxShadow`** | **Fragile** if `primaryColor` from DB is malformed (missing `#`). Can yield **invalid CSS** and broken shadows. **Sanitize or fallback.** |
| **Workflow monospace “01 / 02 / 03”** | **Cliché** (crypto / launch-page pattern). Not wrong, but **not distinctive**; reads as template. Prefer **clean typographic step labels** or a **single connector line** for structure. |

---

## 2. Accessibility regressions

| Issue | Severity |
|--------|----------|
| **Featured store logos: `alt=""`** while the image carries **semantic meaning** (store identity) | **Fail** unless truly decorative. Should be **`alt={store.name}`** or adjacent text explicitly associated. |
| **Hard-coded English** in `FeaturedStoresSection` (“Social proof”, body copy, “Visit store”) | **i18n regression** on a site defaulting to **Arabic**. Unacceptable for RTL-first positioning. |
| **`role='status'` on static announcement pill** | **Questionable.** Not a live region; screen readers may over-announce. Prefer **plain text** or `role="note"` only if semantics are clear. **Removed / replaced** with neutral markup. |
| **Focus rings:** mix of `.landing-cta-*` CSS and ad-hoc Tailwind | **Inconsistent.** Secondary CTA on hero relied mostly on class without matching **ring-offset** on variable backgrounds. **Unify** `focus-visible` treatment. |
| **Reduced motion:** Framer paths were mostly OK; **CSS `animate-ping`** was not. | **Gap fixed** via scoped CSS override. |

---

## 3. Responsiveness regressions / risks

| Issue | Note |
|--------|------|
| **Floating chips** (`absolute -left-4`, `-right-2`) | On **narrow tablets**, risk of **clipping** or collision with grid; hidden below `md` helps but **layout still busy**. Removing floats **simplifies** mid-breakpoints. |
| **3D mockup frame** | On **small screens** the frame class still applies; CSS media reduces motion but **not** angle—**shallow angles** or **disable perspective below `lg`** improves stability and tap targets. |
| **Feature grid** | Uniform 3-column cards are **safe** but **flat**; the first refinement adds **one lead feature surface** without breaking mobile (stacks first). |

---

## 4. Code smells (landing)

| Smell | Detail |
|--------|--------|
| **`settings: any`** | Carried forward; still a **type hole**. Acceptable short-term, not “done.” |
| **Duplicated color extraction** | Same `config_sections?.colors` block in **every** section. Should be **one hook** `useLandingBrandColors()`—**deferred** to limit blast radius. |
| **`iconMap` typo aliases** (`hare`, `hield`, `tar`) | **Technical debt** masking bad data. Keep only if CMS still emits typos; otherwise **delete** after migration. |
| **Footer CTA reusing hero title/subtitle** | **Lazy composition**; footer should have **purpose-built copy** (conversion vs. awareness). |
| **Split motion primitives** | `landingContainer` / `whileInView` / `animate` mixed across files—**OK** but needs a **short comment convention** per section to avoid spaghetti. |

---

## 5. Flaky / weak visual tests

| Problem | Why |
|---------|-----|
| **Full-page `contact` / `docs` screenshots** | **High sensitivity** to dynamic content, fonts, and **RTL** if `i18nextLng` init races. |
| **No baseline PNGs in repo** | CI **cannot** enforce regression until someone commits snapshots—documented, still a **process gap**. |
| **`delete` dialog test** depends on **permission + seeded product** | **Brittle**; correct to `skip`, but **coverage claim** must stay modest. |
| **`webServer: php artisan serve`** | **No Vite** in that process—if manifest expects dev assets, **environment-dependent**. Prefer **built assets** for CI or document `APP_ENV`. |

---

## 6. Downgrades: what was “flashy” not “elite”

- **Floating stat widgets** → **removed** (redundant + perpetual motion).
- **Emoji mockup interior** → **replaced** with **vector iconography** and **layered UI story** (rail + preview stack).
- **Sparkles overload** → **reduced** to a **single** restrained accent.
- **Monospace step indices** → **replaced** with **step labels** + **connector** (structure without gimmick).
- **Footer CTA** → **dedicated copy** via i18n, not hero paste.

---

## 7. Refinement targets applied after this review

1. **Hero:** Layered storytelling (kicker, rail, depth orb, stacked preview), **no infinite motion**, **no emoji product UI**, **stricter focus** styles, **perspective tamed** on small screens.
2. **CSS:** `prefers-reduced-motion` **disables ping**; optional **section hairlines**; **mockup** behavior refined by breakpoint.
3. **Features:** **Lead + support** layout on large screens; clearer hierarchy.
4. **Workflow:** **Connector** + **verbal step labels**; less “template dark section.”
5. **Featured stores + footer:** **i18n** + **alt text** fixes.

---

## 8. What is still not “finished product”

- **Type-safe** `LandingSettings` across sections.
- **Central color hook** + validation for DB-driven hex.
- **Footer nav links** still contain `#` placeholders (pre-existing business/content issue).
- **Visual baselines** still require a **committed** snapshot set in CI.

---

## 9. Codebase follow-up (implemented)

The following maps §7 to concrete changes in the repo:

| Target | Change |
|--------|--------|
| Hero | `sanitizeHex()` for shadows; announcement **without** `role="status"`; **single** `Sparkles`; kicker + i18n rail + stacked “pipeline / editor” mock (Lucide, no emoji); **removed** floating stat chips and infinite Y motion; depth via blurred radial behind mockup. |
| CSS | `.landing-announcement-ping` disabled under `prefers-reduced-motion`; mockup **flat** below `lg` (subtle hover lift only); **RTL** mirror for 3D frame on large screens; lighter noise on small viewports; footer focus `outline-offset` tweak. |
| Features | `landing.features.badge` i18n; **lead row** (`md:col-span-2` + horizontal layout); `sanitizeHex` on primary for `color-mix`. |
| Workflow | `landing.workflow.stepLabel` with `{{count}}`; vertical **connector** between columns on `md+`; `aria-labelledby` includes step label + title. |
| Featured stores + footer | Full i18n under `landing.featuredStores.*`; logo **`alt={store.name}`**; footer CTA uses `landing.footer.ctaTitle` / `ctaSubtitle`; secondary CTA uses `landing-cta-secondary`. |

---

*This review is intentionally harsh: the goal is **premium, stable, maintainable**, not “more effects.”*
