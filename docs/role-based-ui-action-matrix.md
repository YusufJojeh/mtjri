# Role-based UI Action Matrix

Status values: `OK`, `MISSING IN UI`, `HIDDEN INCORRECTLY`, `BACKEND ONLY`, `UI ONLY`, `BROKEN`, `UNKNOWN`

| Role / actor | Module | Expected action | Backend evidence | UI evidence | Status | Notes |
|---|---|---|---|---|---|---|
| superadmin | Plans | Subscribe (if permission granted) | `subscribe-plans` in `PermissionSeeder`; `plans.subscribe` route | `plans/index.tsx` checks `ubscribe-plans` typo | HIDDEN INCORRECTLY | CTA gating bug independent of role |
| company | Plans | Subscribe | `subscribe-plans` seeded to company in `RoleSeeder`; `plans.subscribe` route | `plans/index.tsx` typo hides button | HIDDEN INCORRECTLY | Revenue-impacting |
| company | Stores | Open store settings for owned store | `StoreSettingsController` ownership + route exists | `stores/index.tsx` requires `manage-store-settings` only | HIDDEN INCORRECTLY | If custom role has `view/edit-stores` but not this key |
| superadmin | Settings/Webhooks | Manage webhooks | webhook permission seeded; webhook controller exists | settings webhook section disabled and routes commented | BACKEND ONLY | capability not actually operable |
| company | Settings/Webhooks | Manage webhooks (if permitted) | `manage-webhook-settings` seeded to company role | UI section disabled; routes commented | BACKEND ONLY | broken flow |
| superadmin | Email templates | List/view/update templates | routes exist in `routes/web.php` | no sidebar entry; pages exist | MISSING IN UI | direct URL required |
| company | Email templates | List/view/update templates | routes exist and not permission-protected | no sidebar entry | MISSING IN UI | discoverability gap |
| guest | Email templates | Should not mutate templates | should require auth for sensitive action | routes are public, PUT routes active | UI ONLY | security exposure (action possible via direct request) |
| superadmin | Language | Manage language | `manage-language` middleware route | `profile-menu.tsx` shows link | OK | entry visible |
| company | Language | Manage language (permission-seeded) | company has `manage-language` in `RoleSeeder`; route uses permission middleware | profile menu link superadmin-only | HIDDEN INCORRECTLY | capability not discoverable |
| company | Users | create/edit/delete/reset/toggle | routes + permissions exist | `users/index.tsx` exposes all actions by permission | OK | good parity |
| company | Products | export/create/view/edit/delete | routes + permissions exist | `products/index.tsx` exposes all listed actions | OK | no status toggle shortcut |
| company | Orders | export/view/edit/delete | routes + permissions exist | `orders/index.tsx` exposes these actions | OK | no explicit quick status actions |
| company | Customers | export/create/view/edit/delete | routes + permissions exist | `customers/index.tsx` exposes these actions | OK | no active toggle shortcut |
| company | Blog | export/create/view/edit/delete | routes + permissions exist | `blog/index.tsx` exposes actions | OK | category CRUD path still unclear in UI |
| company | POS | checkout/process/view tx/settings | `pos.*` routes with granular permissions | `pos/index.tsx` shows checkout/settings/transactions with permissions | OK | cart/product interactions not explicitly permission wrapped |
| company staff (manager/accountant/content_writer) | Staff navigation | See only modules by granted permissions | permission-driven sidebar conditions in `app-sidebar.tsx` | menu uses `hasPermission` checks | OK | behavior depends on seeded/custom roles |
| any authenticated user | Webhooks page route | Open `/webhooks` | `webhooks.index` route exists | no `resources/js/pages/webhooks/index.tsx` | BROKEN | route likely fails at runtime |
| any authenticated user | AI templates page route | Open `/ai-templates` | route exists | no `resources/js/pages/ai-templates/index.tsx` | BROKEN | runtime failure risk |
| any authenticated user | Payment gateways page route | Open `/payment-gateways` | route exists | no `resources/js/pages/payment-gateways/index.tsx` | BROKEN | runtime failure risk |
| superadmin/company | Referral section nav | Scroll-based section state updates | frontend-only behavior expectation | `'croll'` event typo in `referral/index.tsx` | BROKEN | in-page nav UX broken |
| unknown custom role | Stores CRUD config secondary actions | advanced actions with `uper-admin` permission | no such permission seeded | `resources/js/config/crud/stores.ts` uses `uper-admin` | UNKNOWN | may be dead config; verify runtime usage |
