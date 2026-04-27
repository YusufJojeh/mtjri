# Storyboard

**Format:** 1920x1080
**Duration:** 20 seconds
**Audio:** Local WAV voiceover (`assets/audio/narration.wav`) plus a 20-second electronic underscore (`assets/audio/music-bed.wav`).
**VO direction:** Calm, confident SaaS launch read with short pauses between claims.
**Style basis:** DESIGN.md, existing Remotion landing frames, and product screenshots in `assets/site/`.

## Asset Audit

| Asset | Type | Assign to Beat | Role |
| --- | --- | --- | --- |
| `assets/site/logos/logo-light.png` | Logo | 1, 5 | Brand mark opener and closer |
| `assets/site/mtjrii-hero-frame.png` | Hero frame | 1 | Opening visual identity |
| `assets/site/mtjrii-landing-frame.png` | Hero frame | 1, 5 | Motion/product presentation layer |
| `assets/site/landing-page/multi-store-dashboard.png` | Product screenshot | 2 | Commerce control center |
| `assets/site/landing-page/theme-selection.png` | Product screenshot | 3 | Theme launch workflow |
| `assets/site/landing-page/product-management.png` | Product screenshot | 4 | Catalog workflow |
| `assets/site/landing-page/order-management.png` | Product screenshot | 4 | Operations workflow |
| `assets/site/landing-page/payment-integration.png` | Product screenshot | 4 | Payment readiness |
| `assets/site/themes/home-accessories.png` | Storefront screenshot | 3 | Storefront direction card |
| `assets/site/themes/fashion.png` | Storefront screenshot | 3 | Storefront direction card |
| `assets/site/themes/electronics.png` | Storefront screenshot | 3 | Storefront direction card |

## Beat 1 - Hook (0:00-0:04)

**VO cue:** "Run every storefront from one commerce control center."

**Concept:** Start inside the cinematic landing identity, already in motion. The brand logo and Remotion hero frame feel like a live product command screen rather than a static page.

**Visual:** Deep navy canvas, blue glow at the right edge, gold status pill, large MTJRii headline on the left, hero frame floating on the right, small commerce proof cards along the bottom.

**Transition:** Gold-blue vertical wipe covers the frame and reveals Beat 2.

## Beat 2 - Control Center (0:04-0:08)

**VO cue:** "MTJRii brings stores, themes, products, orders, customers, and payments into one workspace."

**Concept:** The abstract hero resolves into a readable dashboard. The viewer sees the operator layer: orders, products, customers, revenue, recent orders, top products, and QR code.

**Visual:** Large dashboard screenshot in a framed browser surface. Metric chips count up in the foreground while a green accent line scans across the dashboard.

**Transition:** Fast upward blur wipe into the theme gallery.

## Beat 3 - Launch Directions (0:08-0:12)

**VO cue:** "Launch with polished storefront directions,"

**Concept:** The platform turns setup into a visual choice. Theme selection becomes a premium gallery with storefront previews fanning forward.

**Visual:** Theme selection screenshot fills the background. Home, fashion, and electronics storefront previews slide forward as layered cards. Gold "10 themes" badge anchors the beat.

**Transition:** Blue glass panel sweep into operations.

## Beat 4 - Operate and Sell (0:12-0:16)

**VO cue:** "then operate from a dashboard built for real selling."

**Concept:** The promo becomes a quick operational montage. Catalog, orders, and payments move as connected work surfaces, not separate tools.

**Visual:** Three product screenshots arrange into a dense commerce wall: products left, orders center, payments right. Icons and labels pulse over each surface.

**Transition:** Screens collapse into a final centered brand lockup.

## Beat 5 - CTA (0:16-0:20)

**VO cue:** "Start setup, choose a theme, and move from idea to live store faster."

**Concept:** Resolve with a confident product promise. The logo, CTA, and three proof points hold long enough to read.

**Visual:** Dark navy final card, MTJRii logo, large line "From idea to live store, faster", Start Setup CTA, and three compact proof chips.

**Transition:** Final fade to navy.

## Production Architecture

```
artifacts/hyperframes-mtjri-promo/
├── index.html
├── DESIGN.md
├── SCRIPT.md
├── STORYBOARD.md
├── assets/
│   ├── fonts/
│   └── site/
│       ├── landing-page/
│       ├── logos/
│       └── themes/
└── compositions/
```
