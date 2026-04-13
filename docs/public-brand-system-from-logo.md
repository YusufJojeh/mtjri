# Public brand system (from `public/images/logos/logo-dark.png`)

## 1. Logo interpretation

The **MTJRii** mark combines:

- **“Digital bag” icon** — rounded trapezoid + handle; friendly retail + SaaS. Interior **three white squares** in a stair pattern → pixels / modular building blocks.
- **Wordmark “MTJRii”** — bold geometric sans; **MTJR** uppercase in **digital blue**, **ii** lowercase with circular tittles in **golden yellow** (retail energy, rhythm).
- **Primary blue `#1E90FF`** — trust, scale, product CTAs, active states.
- **Accent gold `#FFC107`** — highlights, badges, sparks — **use sparingly** so it stays premium.

**Category impression:** modern multi-store commerce platform — confident SaaS, not flat corporate gray.

---

## 2. Brand personality

| Axis | Direction |
|------|-------------|
| Voice | Confident, direct, product-truth over hype |
| Mood | Premium commerce infra: fast, reliable, modern |
| Emotion | Optimistic momentum (gold sparks), calm focus (blue + light surfaces) |
| Trust | Neutral typography, restrained motion, legible hierarchy |

---

## 3. Color system

### Primary (logo blue) — CTAs, key icons, focus, hero emphasis

| Token / role | Hex | Notes |
|--------------|-----|--------|
| `PUBLIC_BRAND_PRIMARY` | `#1E90FF` | Wordmark / bag blue; primary buttons, links |
| `PUBLIC_BRAND_SECONDARY` | `#1578D8` | Darker blue for hover / secondary emphasis |
| Primary on light tint | `color-mix(primary 8–14%, white)` | Badges, soft panels |

### Accent (logo gold)

| Token | Hex | Role |
|-------|-----|------|
| `PUBLIC_BRAND_ACCENT` | `#FFC107` | **“ii” gold** — stats, ping dots, sparing highlights |

### Ambient

| Token | Hex | Role |
|-------|-----|------|
| `PUBLIC_BRAND_AMBIENT` | `#38BDF8` | Softer sky for gradient glows (supports primary family) |
| Slate neutrals | `slate-50` … `slate-900` | Text, borders, chrome |

**Implementation:** `resources/js/lib/public-brand.ts` (`resolvePublicBrandColors`) merges CMS colors with these logo defaults.

---

## 4. Motion language

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (already in `landing-motion.ts`).
- **Hero / section reveal:** stagger children ~80ms, max ~550ms duration.
- **Hover lift:** 2–4px translateY on cards/CTAs; pair with shadow deepen — **never** bounce or elastic on marketing chrome.
- **Reduced motion:** `prefers-reduced-motion: reduce` → no perspective mockup tilt, no ping animation, minimal duration (see `landing-premium.css` + Framer `useReducedMotion`).
- **Shared helpers:** `resources/js/lib/public-motion.ts` (`publicSectionContainer`, `publicSectionFade`).

---

## 5. 3D / depth language

- **Perspective mockup** (landing only): single focal frame, `perspective(1200px)` + mild `rotateX` / `rotateY`; disabled on mobile and under reduced motion.
- **Layered cards:** back-plate + front glass (`bg-white/80` + `backdrop-blur` + `shadow-*`).
- **Glow planes:** radial gradients mixing **blue ambient** + **small primary accent** — cinematic but lightweight (CSS only).
- **Avoid:** WebGL / R3F unless an isolated, optional enhancement — not required for this system.

---

## 6. Public-page design rules

1. **Shell:** `[data-public-shell]` or `[data-landing-page]` + ambient mesh + optional noise (`public-brand.css`).
2. **Typography:** Keep existing sans stack; headings `tracking-tight`, body `leading-relaxed`, slate neutrals for secondary text.
3. **Radius:** `rounded-xl` / `rounded-2xl` for marketing cards; align with existing landing sections.
4. **Spacing:** Section rhythm `py-12`–`py-28` depending on density; hero extra top padding for fixed header.
5. **CTAs:** Primary = filled primary; secondary = outline with `primary` border tint; always `focus-visible` ring using primary.
6. **RTL:** `dir` on shell; use logical properties (`start`/`end`) in new layout code where applicable.
7. **Header:** Glass blur + border on scroll; shared `Header` / `Footer` across marketing + docs + legal + contact.

---

## 7. Do / Don’t

| Do | Don’t |
|----|--------|
| Anchor UI to **logo blue + gold** (see PNG) | Random palette unrelated to `logo-dark` / `logo-light` |
| Use **gold only as accent** | Oversaturate yellow across whole page |
| Use **blue for CTAs and structure** | Muddy grays that fight the bag icon |
| One **hero focal** (mockup + optional logo plate) | Infinite floating UI clutter |
| Respect **reduced motion** | Parallax on every block |
| Reuse **`resolvePublicBrandColors`** | Per-page random hex fallbacks |

---

## 8. File references

| Asset / code | Path |
|--------------|------|
| Logo (light BG) | `public/images/logos/logo-dark.png` |
| Logo (dark BG) | `public/images/logos/logo-light.png` |
| `getMarketingLogoDisplayUrl()` | Uses superadmin logos when set, else paths above |
| CSS tokens / mesh | `resources/css/public-brand.css`, `resources/css/landing-premium.css` |
| JS color resolver | `resources/js/lib/public-brand.ts` |
| Marketing shell | `resources/js/components/public/PublicMarketingShell.tsx` |
