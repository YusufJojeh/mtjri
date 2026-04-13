# UI Action Gap Backlog

## 1) Fix plan subscribe permission typo
- **Problem:** Subscribe CTA is incorrectly permission-gated with `ubscribe-plans`.
- **Affected users/roles:** company, superadmin, any role with `subscribe-plans`.
- **Affected files:** `resources/js/pages/plans/index.tsx`, `database/seeders/PermissionSeeder.php` (reference).
- **Severity:** Critical
- **Type:** Permission / Frontend
- **Recommended fix:** Replace typo with `subscribe-plans`; add test to assert Subscribe CTA visible when permission exists.
- **Acceptance criteria:**
  - user with `subscribe-plans` sees Subscribe CTA;
  - user without permission does not;
  - no regressions for Trial/Request CTAs.

## 2) Lock down public email-template mutation routes
- **Problem:** Email template CRUD update endpoints are public in `routes/web.php`.
- **Affected users/roles:** unauthenticated users (exposure), all admin roles (integrity risk).
- **Affected files:** `routes/web.php`, `app/Http/Controllers/EmailTemplateController.php`.
- **Severity:** Critical
- **Type:** Backend / Permission
- **Recommended fix:** Move under authenticated + permission middleware; add controller authorization checks.
- **Acceptance criteria:**
  - guests receive 401/403 for all `email-templates.*`;
  - authorized roles can list/update;
  - unauthorized authenticated roles are blocked.

## 3) Restore or remove webhook management coherently
- **Problem:** Webhook UI actions call routes that are commented out; section disabled in settings page.
- **Affected users/roles:** superadmin/company with `manage-webhook-settings`.
- **Affected files:** `routes/settings.php`, `resources/js/pages/settings/index.tsx`, `resources/js/pages/settings/components/webhook-settings.tsx`.
- **Severity:** Critical
- **Type:** Full-stack
- **Recommended fix:** Either re-enable routes + section and wire permission checks, or remove component and references to prevent false affordance.
- **Acceptance criteria:**
  - Add/Edit/Delete webhook works end-to-end or is fully removed from UI;
  - no broken route references remain.

## 4) Resolve missing Inertia page targets
- **Problem:** Routes render pages that do not exist (`ai-templates/index`, `webhooks/index`, `payment-gateways/index`).
- **Affected users/roles:** authenticated users navigating to these features.
- **Affected files:** `routes/web.php`, `resources/js/pages/*` missing directories/files.
- **Severity:** High
- **Type:** Full-stack
- **Recommended fix:** Implement missing page components or remove/redirect routes.
- **Acceptance criteria:**
  - visiting each route returns valid page (200) without Inertia resolution errors;
  - navigation does not expose dead links.

## 5) Align store settings CTA gating with backend access model
- **Problem:** Settings button hidden by `manage-store-settings` even when backend ownership checks may allow access.
- **Affected users/roles:** custom roles with store access.
- **Affected files:** `resources/js/pages/stores/index.tsx`, `app/Http/Controllers/StoreSettingsController.php`, `routes/web.php`.
- **Severity:** High
- **Type:** Permission / Frontend
- **Recommended fix:** Gate CTA with same effective policy as backend (or enforce strict permission in backend and keep UI strict).
- **Acceptance criteria:**
  - no role sees settings button that fails with 403;
  - no role with backend access loses CTA.

## 6) Expose/manage language action consistently by permission
- **Problem:** Manage Language link shown only for superadmin in profile menu, despite permission-based backend route.
- **Affected users/roles:** company/staff with `manage-language`.
- **Affected files:** `resources/js/components/profile-menu.tsx`, `routes/web.php`, role seeders.
- **Severity:** Medium
- **Type:** Permission / UX
- **Recommended fix:** Show link by permission (`manage-language`) not only role.
- **Acceptance criteria:**
  - any user with `manage-language` sees link;
  - users without permission do not.

## 7) Add operational CTAs for order state transitions
- **Problem:** Orders list lacks high-frequency status actions.
- **Affected users/roles:** order managers (`edit-orders`).
- **Affected files:** `resources/js/pages/orders/index.tsx`, `app/Http/Controllers/OrderController.php`.
- **Severity:** Medium
- **Type:** Frontend / UX
- **Recommended fix:** Add status transition actions (e.g., mark processing/shipped/cancelled) with permission checks.
- **Acceptance criteria:**
  - at least one approved status transition available from list or detail;
  - transitions validate and persist correctly.

## 8) Fix referral scroll handler typo
- **Problem:** Section active-state nav logic uses `'croll'` event.
- **Affected users/roles:** all referral page users.
- **Affected files:** `resources/js/pages/referral/index.tsx`.
- **Severity:** Medium
- **Type:** Frontend
- **Recommended fix:** change to `'scroll'`; ensure cleanup uses same event.
- **Acceptance criteria:**
  - active section updates on scroll;
  - no console errors on mount/unmount.

## 9) Reintroduce email templates navigation intentionally
- **Problem:** Feature exists but sidebar item is commented out.
- **Affected users/roles:** admin roles needing template maintenance.
- **Affected files:** `resources/js/components/app-sidebar.tsx`.
- **Severity:** Medium
- **Type:** UX / Frontend
- **Recommended fix:** Enable nav item with proper permission guard, or intentionally remove route if feature deprecated.
- **Acceptance criteria:**
  - authorized users can reach template module from normal nav;
  - unauthorized users cannot.

## 10) Add meaningful empty-state CTAs in orders
- **Problem:** Empty orders state has no next-step action.
- **Affected users/roles:** stores with no orders yet.
- **Affected files:** `resources/js/pages/orders/index.tsx`.
- **Severity:** Low
- **Type:** UX
- **Recommended fix:** Add contextual CTA (e.g., go to products/storefront/docs).
- **Acceptance criteria:**
  - empty state contains one primary action linked to valid route.
