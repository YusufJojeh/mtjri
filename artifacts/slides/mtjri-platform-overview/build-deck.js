const pptxgen = require("pptxgenjs");
const {
  autoFontSize,
  calcTextBox,
  imageSizingContain,
  safeOuterShadow,
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require("./index");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "OpenAI";
pptx.subject = "MTJRii platform overview";
pptx.title = "MTJRii Platform Overview";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};

const OUT = path.join(__dirname, "mtjri-platform-overview.pptx");
const ASSET = (...parts) => path.join(__dirname, "..", "..", "..", ...parts);

const colors = {
  ink: "102033",
  muted: "5D6B82",
  line: "D9E1EA",
  panel: "F4F7FB",
  navy: "123B69",
  blue: "2F6DB3",
  gold: "D6A648",
  sky: "DDEBFF",
  mint: "DFF5EC",
  white: "FFFFFF",
};

const titleStyle = {
  fontFace: "Aptos Display",
  bold: true,
  color: colors.ink,
  margin: 0,
  valign: "mid",
};

const bodyStyle = {
  fontFace: "Aptos",
  color: colors.ink,
  margin: 0,
  breakLine: false,
  valign: "top",
};

function addHeader(slide, eyebrow, title, subtitle) {
  slide.addText(eyebrow, {
    x: 0.6,
    y: 0.35,
    w: 2.2,
    h: 0.22,
    fontFace: "Aptos",
    fontSize: 11,
    bold: true,
    color: colors.blue,
    margin: 0,
  });

  slide.addText(
    title,
    autoFontSize(title, "Aptos Display", {
      x: 0.6,
      y: 0.58,
      w: 6.6,
      h: 0.75,
      minFontSize: 20,
      maxFontSize: 28,
      fontSize: 26,
      bold: true,
      margin: 0,
      valign: "mid",
    })
  );

  slide.addText(
    subtitle,
    autoFontSize(subtitle, "Aptos", {
      x: 0.6,
      y: 1.34,
      w: 7.0,
      h: 0.36,
      minFontSize: 9,
      maxFontSize: 12,
      fontSize: 10.5,
      color: colors.muted,
      margin: 0,
      valign: "mid",
    })
  );
}

function addMetricCard(slide, x, y, w, value, label, fill) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 1.18,
    rectRadius: 0.12,
    fill: { color: fill },
    line: { color: fill },
    shadow: safeOuterShadow("000000", 0.12, 45, 1.5, 0.5),
  });
  slide.addText(value, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.36,
    h: 0.36,
    ...titleStyle,
    fontSize: 22,
  });
  slide.addText(label, {
    x: x + 0.18,
    y: y + 0.64,
    w: w - 0.36,
    h: 0.22,
    ...bodyStyle,
    fontSize: 10.5,
    color: colors.muted,
  });
}

function addBulletList(slide, items, box) {
  const runs = [];
  items.forEach((item, index) => {
    runs.push({
      text: item,
      options: {
        bullet: { indent: 14 },
        breakLine: index !== items.length - 1,
      },
    });
  });
  slide.addText(
    runs,
    autoFontSize(runs, "Aptos", {
      ...box,
      minFontSize: 10,
      maxFontSize: 15,
      fontSize: 13,
      margin: 0,
      breakLine: false,
      paraSpaceAfter: 8,
      valign: "top",
    })
  );
}

function addFramedImage(slide, imagePath, x, y, w, h, fill = colors.white) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: fill },
    line: { color: colors.line, pt: 1 },
    shadow: safeOuterShadow("000000", 0.12, 45, 1.5, 0.5),
  });
  slide.addImage({
    path: imagePath,
    ...imageSizingContain(imagePath, x + 0.12, y + 0.12, w - 0.24, h - 0.24),
  });
}

function finalizeSlide(slide) {
  warnIfSlideHasOverlaps(slide, pptx);
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: "F7FAFD" };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.16,
    fill: { color: colors.gold },
    line: { color: colors.gold },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 0.55,
    w: 6.0,
    h: 6.4,
    rectRadius: 0.12,
    fill: { color: colors.white },
    line: { color: colors.line, pt: 1 },
  });
  slide.addText("MTJRii", {
    x: 0.8,
    y: 0.78,
    w: 1.8,
    h: 0.35,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: colors.navy,
    margin: 0,
  });
  slide.addText(
    "Multi-store commerce infrastructure for launching, operating, and scaling branded online storefronts.",
    autoFontSize(
      "Multi-store commerce infrastructure for launching, operating, and scaling branded online storefronts.",
      "Aptos Display",
      {
        x: 0.8,
        y: 1.25,
        w: 5.15,
        h: 1.2,
        minFontSize: 20,
        maxFontSize: 27,
        fontSize: 25,
        bold: true,
        color: colors.ink,
        margin: 0,
      }
    )
  );
  slide.addText(
    "Deck generated from repository documentation and project assets using PptxGenJS. Focus: product breadth, operating model, and technical foundation.",
    autoFontSize(
      "Deck generated from repository documentation and project assets using PptxGenJS. Focus: product breadth, operating model, and technical foundation.",
      "Aptos",
      {
        x: 0.8,
        y: 2.58,
        w: 4.95,
        h: 0.65,
        minFontSize: 10,
        maxFontSize: 12.5,
        fontSize: 11,
        color: colors.muted,
        margin: 0,
      }
    )
  );
  addMetricCard(slide, 0.8, 3.6, 1.4, "27", "payment gateways", colors.sky);
  addMetricCard(slide, 2.35, 3.6, 1.4, "10+", "store themes", colors.mint);
  addMetricCard(slide, 3.9, 3.6, 1.4, "22+", "languages", "FFF3D8");

  addBulletList(
    slide,
    [
      "Centralized dashboard for multiple storefronts",
      "AI-assisted content generation and localization",
      "Built-in billing, analytics, blog, and POS support",
    ],
    { x: 0.8, y: 5.0, w: 5.0, h: 1.45 }
  );

  const hero = ASSET("public", "remotion", "mtjrii-landing-frame.png");
  addFramedImage(slide, hero, 6.85, 0.65, 5.9, 6.15, "EEF4FB");
  finalizeSlide(slide);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addHeader(
    slide,
    "Platform Snapshot",
    "A single admin surface manages many branded stores",
    "The core proposition is SaaS-level centralization without flattening each store’s identity or catalog."
  );

  addMetricCard(slide, 0.6, 1.95, 1.65, "Unlimited", "stores per owner", colors.sky);
  addMetricCard(slide, 2.42, 1.95, 1.65, "Unified", "dashboard control", colors.mint);
  addMetricCard(slide, 4.24, 1.95, 1.65, "Flexible", "plan-gated features", "FFF3D8");
  addMetricCard(slide, 6.06, 1.95, 1.65, "Secure", "custom domains + SSL", "F7ECFF");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 3.4,
    w: 4.55,
    h: 2.8,
    rectRadius: 0.1,
    fill: { color: colors.panel },
    line: { color: colors.line },
  });
  slide.addText("Operational model", {
    x: 0.85,
    y: 3.68,
    w: 2.0,
    h: 0.25,
    ...titleStyle,
    fontSize: 17,
  });
  addBulletList(
    slide,
    [
      "Store isolation keeps products, orders, and settings independent.",
      "Store switching avoids re-login friction for operators managing several brands.",
      "Plans control caps for products, users, storage, themes, domains, and AI features.",
      "Featured stores and landing-page settings support marketplace-style promotion.",
    ],
    { x: 0.85, y: 4.05, w: 3.95, h: 1.8 }
  );

  const dashboard = ASSET("public", "remotion", "assets", "landing-page", "multi-store-dashboard.png");
  addFramedImage(slide, dashboard, 5.45, 3.32, 3.15, 2.92, "F8FBFF");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.9,
    y: 3.32,
    w: 3.85,
    h: 2.92,
    rectRadius: 0.1,
    fill: { color: "102033" },
    line: { color: "102033" },
  });
  slide.addText("Why it matters", {
    x: 9.18,
    y: 3.64,
    w: 1.8,
    h: 0.22,
    fontFace: "Aptos Display",
    fontSize: 16,
    bold: true,
    color: colors.white,
    margin: 0,
  });
  addBulletList(
    slide,
    [
      "Fits agencies or merchants operating more than one store.",
      "Central governance reduces setup and maintenance cost.",
      "Brand-level flexibility stays visible at the storefront layer.",
    ],
    { x: 9.18, y: 4.02, w: 3.05, h: 1.55, minFontSize: 10, maxFontSize: 13 }
  );
  finalizeSlide(slide);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addHeader(
    slide,
    "Commerce Operations",
    "Product, inventory, and order flows are first-class",
    "The platform covers the standard merchant operating loop from merchandising through fulfillment."
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.9,
    w: 4.0,
    h: 4.6,
    rectRadius: 0.1,
    fill: { color: colors.panel },
    line: { color: colors.line },
  });
  slide.addText("Included capabilities", {
    x: 0.9,
    y: 2.2,
    w: 2.3,
    h: 0.25,
    ...titleStyle,
    fontSize: 18,
  });
  addBulletList(
    slide,
    [
      "Product variants, SEO fields, media galleries, tags, and duplication tools.",
      "Real-time inventory tracking with low-stock thresholds and automatic deduction.",
      "Order lifecycle states from pending to delivered, including refunds.",
      "Customer accounts, multiple addresses, order history, and review workflows.",
      "Guest checkout, invoices, exports, and operational notes.",
    ],
    { x: 0.9, y: 2.56, w: 3.3, h: 3.45 }
  );

  const productImg = ASSET("public", "remotion", "assets", "landing-page", "product-management.png");
  const orderImg = ASSET("public", "remotion", "assets", "landing-page", "order-management.png");
  addFramedImage(slide, productImg, 4.95, 2.0, 3.65, 2.08, "F8FBFF");
  addFramedImage(slide, orderImg, 4.95, 4.34, 3.65, 2.08, "F8FBFF");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.95,
    y: 2.0,
    w: 3.8,
    h: 4.42,
    rectRadius: 0.1,
    fill: { color: colors.white },
    line: { color: colors.line },
  });
  slide.addText("Order lifecycle", {
    x: 9.23,
    y: 2.26,
    w: 2.0,
    h: 0.2,
    ...titleStyle,
    fontSize: 17,
  });
  slide.addChart(pptx.ChartType.bar, [
    {
      name: "Flow coverage",
      labels: ["Catalog", "Inventory", "Orders", "Customers", "Reviews"],
      values: [95, 88, 92, 84, 70],
    },
  ], {
    x: 9.2,
    y: 2.72,
    w: 3.1,
    h: 2.7,
    catAxisLabelFontFace: "Aptos",
    catAxisLabelFontSize: 10,
    valAxisLabelFontFace: "Aptos",
    valAxisLabelFontSize: 9,
    valAxisMinVal: 0,
    valAxisMaxVal: 100,
    showLegend: false,
    showTitle: false,
    showValue: false,
    chartColors: [colors.blue],
    chartArea: { fill: { color: "FFFFFF", transparency: 100 }, line: { color: "FFFFFF", transparency: 100 } },
    plotArea: { fill: { color: "FFFFFF", transparency: 100 }, line: { color: "FFFFFF", transparency: 100 } },
    showCatName: true,
    showValAxisTitle: false,
    showCatAxisTitle: false,
    showGridLines: false,
  });
  slide.addText("Relative emphasis derived from the repo’s documented feature depth, not runtime telemetry.", {
    x: 9.22,
    y: 5.7,
    w: 3.05,
    h: 0.4,
    ...bodyStyle,
    fontSize: 9.5,
    color: colors.muted,
  });
  finalizeSlide(slide);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: "FBFCFE" };
  addHeader(
    slide,
    "Revenue Stack",
    "Payments, subscriptions, and localization broaden market reach",
    "Documentation highlights both global processors and region-specific gateways, plus multilingual storefront delivery."
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.95,
    w: 4.15,
    h: 4.55,
    rectRadius: 0.1,
    fill: { color: colors.white },
    line: { color: colors.line },
  });
  slide.addText("Geographic payment coverage", {
    x: 0.9,
    y: 2.22,
    w: 2.5,
    h: 0.2,
    ...titleStyle,
    fontSize: 17,
  });
  slide.addChart(pptx.ChartType.doughnut, [
    {
      name: "Gateways",
      labels: ["Asia-Pacific", "Middle East", "Africa", "Europe", "Americas", "Global/Other"],
      values: [10, 5, 3, 2, 2, 5],
    },
  ], {
    x: 0.9,
    y: 2.7,
    w: 3.15,
    h: 2.7,
    showLegend: true,
    legendPos: "b",
    legendFontFace: "Aptos",
    legendFontSize: 9,
    chartColors: [colors.blue, colors.gold, "2E8B57", "8C6DD7", "D95F5F", "6D7A8D"],
    holeSize: 55,
    dataLabelPosition: "bestFit",
    showValue: true,
    showCategoryName: false,
    showPercent: false,
  });
  slide.addText("27 documented gateways support regional checkout strategies and plan-tier monetization.", {
    x: 0.9,
    y: 5.78,
    w: 3.2,
    h: 0.38,
    ...bodyStyle,
    fontSize: 10,
    color: colors.muted,
  });

  const payment = ASSET("public", "remotion", "assets", "landing-page", "payment-integration.png");
  addFramedImage(slide, payment, 5.08, 2.0, 3.18, 2.3, "F8FBFF");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.08,
    y: 4.55,
    w: 3.18,
    h: 1.9,
    rectRadius: 0.1,
    fill: { color: "EFF6FF" },
    line: { color: "D9E7FA" },
  });
  slide.addText("Subscription controls", {
    x: 5.32,
    y: 4.82,
    w: 2.0,
    h: 0.2,
    ...titleStyle,
    fontSize: 16,
  });
  addBulletList(
    slide,
    [
      "Monthly and yearly billing",
      "Trials, coupons, upgrades, downgrades",
      "Feature flags tied to plan limits",
    ],
    { x: 5.32, y: 5.18, w: 2.45, h: 0.95 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.65,
    y: 2.0,
    w: 4.1,
    h: 4.45,
    rectRadius: 0.1,
    fill: { color: colors.navy },
    line: { color: colors.navy },
  });
  slide.addText("Localization snapshot", {
    x: 8.98,
    y: 2.28,
    w: 2.2,
    h: 0.22,
    fontFace: "Aptos Display",
    fontSize: 17,
    bold: true,
    color: colors.white,
    margin: 0,
  });
  addMetricCard(slide, 8.98, 2.78, 1.15, "22+", "languages", "214D80");
  addMetricCard(slide, 10.25, 2.78, 1.15, "10+", "themes", "214D80");
  addMetricCard(slide, 11.52, 2.78, 1.15, "AI", "content assist", "214D80");
  addBulletList(
    slide,
    [
      "Frontend localization uses i18next and multilingual resource files.",
      "Theme selection, branding, and domain options keep each storefront distinct.",
      "AI-generated content expands merchandising and landing-page throughput.",
    ],
    { x: 8.98, y: 4.02, w: 3.1, h: 1.55 }
  );
  finalizeSlide(slide);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: colors.white };
  addHeader(
    slide,
    "Storefront Layer",
    "Ten-plus themes cover distinct verticals without rebuilding the platform",
    "The theme system is the visible part of the multi-store strategy: different front doors, shared operating core."
  );

  const themeImg = ASSET("public", "remotion", "assets", "landing-page", "theme-selection.png");
  addFramedImage(slide, themeImg, 0.6, 1.95, 4.55, 4.6, "F8FBFF");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.45,
    y: 1.95,
    w: 3.0,
    h: 4.6,
    rectRadius: 0.1,
    fill: { color: colors.panel },
    line: { color: colors.line },
  });
  slide.addText("Theme catalog", {
    x: 5.72,
    y: 2.24,
    w: 1.6,
    h: 0.22,
    ...titleStyle,
    fontSize: 17,
  });
  addBulletList(
    slide,
    [
      "Home & Accessories",
      "Fashion & Apparel",
      "Electronics & Technology",
      "Beauty & Cosmetics",
      "Jewelry & Accessories",
      "Watches & Timepieces",
      "Furniture & Interior",
      "Cars & Automotive",
      "Baby & Kids",
      "Perfume & Fragrances",
    ],
    { x: 5.72, y: 2.58, w: 2.35, h: 3.55, minFontSize: 9.5, maxFontSize: 12.5, fontSize: 11.2 }
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.75,
    y: 1.95,
    w: 4.0,
    h: 4.6,
    rectRadius: 0.1,
    fill: { color: colors.white },
    line: { color: colors.line },
  });
  slide.addText("Theme design principles", {
    x: 9.02,
    y: 2.24,
    w: 2.4,
    h: 0.22,
    ...titleStyle,
    fontSize: 17,
  });

  const principles = [
    "Responsive layouts for mobile-first browsing",
    "Custom colors and branding per store",
    "Theme-specific merchandising sections",
    "SEO-aware page structure",
    "Fast-loading image and content presentation",
  ];
  addBulletList(slide, principles, { x: 9.02, y: 2.6, w: 3.1, h: 1.95 });

  const box = calcTextBox(11, {
    text: "Theme abstraction reduces the cost of entering a new category while keeping the back-office model stable.",
    w: 3.1,
    fontFace: "Aptos",
    margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.02,
    y: 4.95,
    w: 3.2,
    h: Math.max(0.88, box.h + 0.25),
    rectRadius: 0.08,
    fill: { color: "FFF7E7" },
    line: { color: "F1D28C" },
  });
  slide.addText("Theme abstraction reduces the cost of entering a new category while keeping the back-office model stable.", {
    x: 9.2,
    y: 5.12,
    w: 2.84,
    h: box.h,
    ...bodyStyle,
    fontSize: 11,
    color: colors.ink,
  });
  finalizeSlide(slide);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: "F7FAFD" };
  addHeader(
    slide,
    "Technical Foundation",
    "Modern full-stack tooling supports the product surface",
    "The repository couples Laravel 12 on the backend with React 19, Inertia.js, TypeScript, and a broad test/configuration surface."
  );

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 1.95,
    w: 5.65,
    h: 4.7,
    rectRadius: 0.1,
    fill: { color: colors.white },
    line: { color: colors.line },
  });
  slide.addText("Stack summary", {
    x: 0.92,
    y: 2.22,
    w: 1.8,
    h: 0.22,
    ...titleStyle,
    fontSize: 17,
  });
  addBulletList(
    slide,
    [
      "Laravel 12 application structure with migrations, policies, queues, and services.",
      "React 19 + Inertia.js + TypeScript frontend, themed storefront pages, and admin workflows.",
      "Vite build pipeline, Jest and Playwright coverage, plus extensive repo documentation.",
      "Remotion assets indicate a reusable visual/content production layer for product marketing.",
    ],
    { x: 0.92, y: 2.58, w: 4.9, h: 1.95 }
  );

  slide.addText("Architecture lanes", {
    x: 0.92,
    y: 4.95,
    w: 1.8,
    h: 0.22,
    ...titleStyle,
    fontSize: 16,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.95,
    y: 5.3,
    w: 1.45,
    h: 0.78,
    rectRadius: 0.06,
    fill: { color: "E8F0FB" },
    line: { color: "C7D9F2" },
  });
  slide.addText("Laravel core", { x: 1.18, y: 5.57, w: 1.0, h: 0.16, fontFace: "Aptos", fontSize: 11, bold: true, color: colors.navy, margin: 0 });
  slide.addShape(pptx.ShapeType.chevron, { x: 2.45, y: 5.52, w: 0.45, h: 0.28, fill: { color: colors.gold }, line: { color: colors.gold } });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 2.95,
    y: 5.3,
    w: 1.45,
    h: 0.78,
    rectRadius: 0.06,
    fill: { color: "E7F7F0" },
    line: { color: "CBE6D9" },
  });
  slide.addText("React admin", { x: 3.18, y: 5.57, w: 1.0, h: 0.16, fontFace: "Aptos", fontSize: 11, bold: true, color: "1D6A4D", margin: 0 });
  slide.addShape(pptx.ShapeType.chevron, { x: 4.45, y: 5.52, w: 0.45, h: 0.28, fill: { color: colors.gold }, line: { color: colors.gold } });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.95,
    y: 5.3,
    w: 1.0,
    h: 0.78,
    rectRadius: 0.06,
    fill: { color: "FFF3D8" },
    line: { color: "F1D28C" },
  });
  slide.addText("Stores", { x: 5.18, y: 5.57, w: 0.58, h: 0.16, fontFace: "Aptos", fontSize: 11, bold: true, color: "8A5B00", margin: 0 });

  const hero = ASSET("public", "remotion", "mtjrii-hero-frame.png");
  addFramedImage(slide, hero, 6.55, 1.95, 6.2, 3.2, "EEF4FB");

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.55,
    y: 5.42,
    w: 6.2,
    h: 1.23,
    rectRadius: 0.08,
    fill: { color: colors.navy },
    line: { color: colors.navy },
  });
  slide.addText("Takeaway: MTJRii is positioned as a broad commerce operating system rather than a narrow storefront template package.", {
    x: 6.86,
    y: 5.78,
    w: 5.55,
    h: 0.42,
    fontFace: "Aptos Display",
    fontSize: 15,
    bold: true,
    color: colors.white,
    margin: 0,
    align: "center",
  });
  finalizeSlide(slide);
}

pptx.writeFile({ fileName: OUT });
