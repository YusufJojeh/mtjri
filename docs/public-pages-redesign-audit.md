# Public pages redesign — pre-implementation audit

Audit performed against the codebase before unifying the public experience around `public/logo.svg`.

## Summary

| Area | Finding | Severity |
|------|---------|----------|
| Color defaults | Mixed `#3b82f6`, `#10b981`, green accents — **not logo-aligned** | High |
| Contact / legal | **Isolated** headers/footers, no shared nav, hardcoded blue | High |
| Documentation | Gray admin-like shell; `customPages={[]}` in layout; heavy generic blue hover | Medium |
| Footer | **Unused `footerLinks` object** (dead code); hash links pointed to `#` | Medium |
| Landing | Strong section set but hero mesh was **green-primary biased** | Medium |
| Auth | Functional but **no brand shell**; no home/logo affordance | Low–Medium |
| Motion | Landing had good Framer patterns; legal/contact had **none** | Low |
| RTL | Landing + custom pages set `dir`; docs layout **did not** sync `dir` | Medium |

---

## Page-by-page notes

### Landing (`resources/js/pages/landing-page/index.tsx`)

- **Strengths:** Composed sections, Framer Motion, mockup perspective, `landing-premium.css` scoping.
- **Weaknesses:** Fallback primary was emerald; hero mesh did not express **blue ambient + coral brand** mix; outer background flat white vs soft environment.

### Contact (`/contact`)

- **Before:** Static mini-header/footer, `#3b82f6`, no `Header`/`Footer` parity, no custom pages in nav.
- **After target:** Same chrome as home + docs.

### Privacy / Terms

- **Before:** Hardcoded `MTJRii`, blue “Legal” label, ignored Inertia `settings` / `customPages` from controller.
- **Risk:** Brand and legal drift from superadmin landing settings.

### Documentation (`/docs`, `/docs/{slug}`)

- **Before:** `DocumentationLayout` passed empty `customPages`; visual language = `bg-gray-50` + blue hovers.
- **Gap:** Did not feel part of the marketing system.

### Custom marketing pages (`/page/{slug}`)

- **Before:** White background only; defaults `#3b82f6` / purple / green in fallbacks.
- **Gap:** No ambient shell; inconsistent with landing.

### Auth (login, register, password flows)

- **Before:** Simple slate background blobs; no `data-public-shell` / mesh; logo not prominent.
- **Note:** Still uses app `ThemeColorProvider` patterns inside dashboard context where applicable; shell now aligns visually.

### Pricing

- **Public marketing pricing:** Covered by landing `PlansSection` (`#pricing`).  
- **Authenticated `plans`:** Intentionally **out of scope** (app surface, not marketing).

---

## Technical debt addressed in redesign

1. Removed dead footer link matrix (replaced with **routed** columns + real URLs).
2. Centralized **logo-default** colors in `resolvePublicBrandColors`.
3. Introduced **`PublicMarketingShell`** to avoid one-off legal/contact layouts.
4. Documentation controller now passes **`customPages`** for consistent nav.

---

## Remaining weaknesses (post-pass)

- Individual landing **sections** (Features, Plans, etc.) were not all rewritten in this pass — visual unity improved via **header/footer/hero/ambient/tokens**, not every block.
- **Social links** in footer still placeholder `#` — needs CMS wiring when product is ready.
- **ThemeColorProvider** hex math assumes 6-digit hex — invalid CMS values still need sanitization (partially handled via `sanitizeLandingHex`).
