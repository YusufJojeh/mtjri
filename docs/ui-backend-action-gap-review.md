# UI vs Backend Action Gap Review

## 1. Executive verdict

The product has broad backend action coverage, but multiple high-impact capability mismatches remain:
- sensitive actions exposed publicly,
- backend capabilities without reliable UI entrypoints,
- UI permission gating defects that hide valid actions,
- and route/page mismatches that can break navigation.

Overall status: **High risk for capability integrity** (security + operability), even though many CRUD modules are functionally rich.

## 2. Missing buttons/actions

- **Orders: no explicit operational CTA for status flow in index UI**
  - Backend supports order edit (`orders.edit`, `orders.update`) and business status fields in controller.
  - UI list in `resources/js/pages/orders/index.tsx` only exposes View/Edit/Delete, no clear approve/fulfill/cancel shortcut actions.
  - Severity: High (core operations friction).
- **Stores/Product/Customer active-state shown but no direct toggle action in index**
  - UI renders active/inactive badges in `stores/index.tsx`, `products/index.tsx`, `customers/index.tsx`.
  - No index-level activate/deactivate CTA despite frequent operational need.
  - Severity: Medium.

## 3. Hidden actions caused by wrong role/permission logic

- **Plan Subscribe CTA hidden by typo**
  - Frontend checks `hasPermission('ubscribe-plans')` in `resources/js/pages/plans/index.tsx`.
  - Backend permission is `subscribe-plans` (see `database/seeders/PermissionSeeder.php`, `routes/web.php` subscribe endpoint).
  - Result: users who should see Subscribe can be blocked.
  - Severity: Critical.
- **Store Settings button gated by mismatched permission key**
  - UI shows settings action only for `manage-store-settings` in `resources/js/pages/stores/index.tsx`.
  - Backend settings routes (`stores.settings`, `stores.settings.update`) are not permission-wrapped at route level; controller permits access based on ownership + `view-stores`/`edit-stores`.
  - Result: users with valid backend access path can have hidden settings CTA.
  - Severity: High.
- **Manage Language appears restricted in profile UI**
  - `resources/js/components/profile-menu.tsx` shows Manage Language link only for `superadmin`.
  - Backend route uses `permission:manage-language`, and company role is seeded with `manage-language`.
  - Result: permission-bearing non-superadmin actors may lose UI entrypoint.
  - Severity: Medium.

## 4. Backend-only capabilities with no UI entrypoint

- **Webhook CRUD backend path disabled**
  - Webhook component (`resources/js/pages/settings/components/webhook-settings.tsx`) implements create/edit/delete using `settings.webhooks.*`.
  - But all `settings.webhooks.*` routes are commented in `routes/settings.php`.
  - Settings page also comments out webhook section import/render in `resources/js/pages/settings/index.tsx`.
  - Severity: High.
- **Email templates route active but main sidebar entry disabled**
  - Sidebar has email templates nav item commented in `resources/js/components/app-sidebar.tsx`.
  - Route and pages exist; discovery depends on deep-linking.
  - Severity: Medium.

## 5. UI actions with missing/broken backend support

- **Webhook create/edit/delete UI calls unavailable routes**
  - Component calls `route('settings.webhooks.store|update|destroy')`.
  - Routes are commented out in `routes/settings.php`.
  - Expected outcome: runtime route-resolution or request failures.
  - Severity: Critical.
- **Missing Inertia page targets for registered routes**
  - `routes/web.php` renders `ai-templates/index`, `webhooks/index`, `payment-gateways/index`.
  - No matching files under `resources/js/pages/ai-templates`, `resources/js/pages/webhooks`, `resources/js/pages/payment-gateways`.
  - Severity: High.

## 6. Broken navigation/access paths

- **Referral in-page section nav scroll listener is broken**
  - `resources/js/pages/referral/index.tsx` binds `'croll'` event (typo) instead of `'scroll'`.
  - Section highlight/navigation state won’t update from scrolling.
  - Severity: Medium.
- **Email Templates discoverability gap**
  - No active sidebar link though feature is active.
  - Severity: Medium.

## 7. Empty-state CTA gaps

- **Orders empty state lacks primary progression CTA**
  - `resources/js/pages/orders/index.tsx` empty case only says “No orders found”.
  - No CTA to related flow (e.g., products, checkout settings, store link) despite business dependency.
  - Severity: Medium.
- **Email Templates empty state has no action despite editable template domain**
  - Index has no create/import/restore defaults action (view-only list entry).
  - If intentionally read-only, this should be explicit in UI copy.
  - Severity: Low/Medium (depends on product intent).

## 8. Highest-risk capability mismatches

1. **Public email-template mutation surface** (route exposure, no auth middleware).  
2. **Webhook management appears implemented but is dead/broken by route + UI disablement.**  
3. **Plan subscribe permission typo hides monetization CTA for entitled users.**  
4. **Route-to-page mismatches for `ai-templates`, `webhooks`, `payment-gateways` create breakable navigation paths.**

## 9. Deep check results for high-value modules

- **Users:** strong CTA parity (add/edit/delete/reset/toggle) and permission wrapping; no major capability gap found.
- **Roles/Permissions:** backend CRUD present; UI present; risk is mostly policy/seed drift, not missing buttons.
- **Stores:** major mismatch on settings CTA gating vs backend access model.
- **Products:** CRUD/export parity is good; no quick active-state toggle.
- **Orders:** backend edit capability exists, but list-level operational CTAs are weak.
- **Customers:** CRUD/export parity is good; no quick active-state toggle.
- **Plans/subscriptions:** severe CTA gate bug (`ubscribe-plans` typo) plus otherwise broad coverage.
- **Settings:** broad sections present, but webhook and some permission keys drift.
- **Media:** feature present and reachable; API permission mostly controller-enforced.
- **Blog:** post CRUD parity good; category permission model inconsistent.
- **Referral:** payout/approval actions exist; in-page navigation behavior bug.
- **Email templates:** capability exposed publicly and not discoverable from normal nav.
- **Webhooks:** capability mismatched (component exists, routes disabled, section hidden).
- **POS:** core CTAs exposed; no high-severity action mismatch found in main flow.
- **Landing/store content AI:** regeneration/save/retry controls present; capability exposure aligns with backend routes.

## 10. Evidence appendix

- `routes/web.php`: `email-templates.*`, `stores.settings*`, `plans.subscribe`, `webhooks.index`, `ai-templates.index`, `payment-gateways.index`.
- `routes/settings.php`: `settings.webhooks.*` commented; settings update route structure.
- `resources/js/pages/plans/index.tsx`: `hasPermission('ubscribe-plans')`.
- `database/seeders/PermissionSeeder.php`: canonical `subscribe-plans`, `manage-language`, `manage-webhook-settings`.
- `resources/js/pages/settings/components/webhook-settings.tsx`: active CRUD actions calling `settings.webhooks.*`.
- `resources/js/pages/settings/index.tsx`: webhook section commented out.
- `resources/js/components/app-sidebar.tsx`: email templates nav item commented; settings menu logic.
- `resources/js/pages/stores/index.tsx`: settings button permission `manage-store-settings`.
- `app/Http/Controllers/StoreSettingsController.php`: ownership + `view-stores`/`edit-stores` checks.
- `resources/js/pages/referral/index.tsx`: `'croll'` listener typo.
