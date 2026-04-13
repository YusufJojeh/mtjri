# Database schema report

This document lists **uncertainties**, **schema risks**, and **gaps between migrations and Eloquent models**. It accompanies `docs/database-diagram.dbml`, which reflects **only** columns and foreign keys that appear in `database/migrations`. No foreign keys were inferred from application code.

## Methodology

- **Source of truth:** PHP migrations under `database/migrations/` (applied in filename order).
- **Models:** Used to flag **logical** relationships that are **not** enforced in the database (see “Model vs migration drift”).
- **Not used:** Live database dumps, `schema:dump`, or guessed constraints.

---

## Uncertainties

### Engine and column types

- Migrations use Laravel abstractions (`string`, `text`, `json`, `enum`, `float`, `decimal`, etc.). Actual MySQL types (e.g. `JSON` vs `TEXT`, `DOUBLE` vs `FLOAT`, enum implementation) depend on the Laravel version and database driver. The DBML file uses **approximate** MySQL-oriented types for diagramming.
- **Enum columns** are stored as database-level enums in MySQL where the migration uses `enum(...)`. The DBML marks many of these as `varchar` with a **note** listing allowed values, because dbdiagram’s enum support is limited and this stays readable.

### `config/permission.php` vs frozen migration

- The Spatie permission tables are created by `2025_05_25_000000_create_permission_tables.php`, which reads `config('permission.teams')`. This repo sets **`teams` => false** in `config/permission.php`. If that config differed at first migration run, the physical schema could differ (e.g. extra `team_id` columns and different primary keys). The DBML matches **teams disabled** as committed today.

### Performance migration is MySQL-specific

- `2026_01_04_104217_add_missing_indexes_for_performance.php` uses `SHOW INDEXES FROM ...` and is **MySQL-oriented**. On PostgreSQL or SQLite, behavior may differ or fail.

### Data-only migration

- `2026_01_04_214526_remove_free_plan_default_flag.php` only runs `UPDATE` on `plans`; it does not remove the `is_default` column. Diagram state for “default plan” is **data**, not structure.

---

## Schema risks

### Multi-tenant uniqueness

- **`blog_categories.slug`** is **globally** `unique()` in the migration, while rows are scoped by `store_id`. Two stores cannot reuse the same slug, which may be unintended for a per-store resource.
- **`blogs.slug`** is also **globally** unique with a `store_id` column—same concern.
- **`categories`** and **`blog_tags`** use **composite** uniqueness `(slug, store_id)`, which is usually what you want for storefront data.

### Guest / session rows and uniqueness

- **`wishlist_items`** defines two unique keys involving `customer_id` or `session_id`. In SQL, **NULLs in unique constraints** are often treated as distinct, so multiple guest rows with `session_id` NULL could theoretically coexist for the same store/product (depending on engine and Laravel usage). Application logic must enforce guest identity via `session_id` when present.
- **`cart_items`** has **no** unique constraint on `(store_id, customer_id, product_id[, variants])`, so duplicate cart lines are possible unless the app deduplicates.

### Optional linkage without FK

- **`users.current_store`** is an `unsignedBigInteger` with **no foreign key** in migrations. The app may treat it as `stores.id`, but the database does not enforce referential integrity (orphan IDs, wrong store ownership).
- **`sessions.user_id`** is indexed but **not** declared as a foreign key in the migration.
- **`email_templates.user_id`** defaults to `1` and has **no** FK to `users`.
- **`user_email_templates.user_id`** has **no** FK to `users`.

### POS configuration

- **`pos_settings`** has **no** unique constraint on `store_id`. The schema allows **multiple** settings rows per store; correctness depends on application queries (e.g. always using “latest” or “first”).
- **`pos_settings.currency`** is a **string** (e.g. `usd`). The `POSSettings` model defines a `belongsTo(Currency::class, 'currency', 'code')` relationship, but there is **no** database foreign key—invalid codes will not be rejected by the DB.

### POS transactions

- **`pos_transactions.transaction_number`** is **not** unique in migrations. Duplicate numbers are possible.

### Orders vs coupons

- **`orders.coupon_code`** is a **string** snapshot; there is **no** FK to `store_coupons` or `coupons`. Historical orders are decoupled from coupon rows (often intentional, but worth knowing for reporting).

### Settings uniqueness with NULL `store_id`

- **`settings`** uses `unique(['user_id', 'store_id', 'key'])` with **`store_id` nullable**. **`payment_settings`** uses `unique(['user_id', 'key', 'store_id'])` with **`store_id` nullable**. Database handling of multiple NULLs in unique indexes is engine-specific; edge cases can allow more rows than intuitively expected.

### Redundant / overlapping indexes

- Several columns already have indexes from `foreignId` / `foreign()` or explicit `index()` in create migrations; `2026_01_04_104217_add_missing_indexes_for_performance.php` may add **redundant** non-unique indexes (e.g. on `email` where a unique index already exists). The migration tries to avoid duplicates for `users.email` by checking index **name**, but other overlaps may still exist depending on what MySQL named existing keys.

### Blog tag migration rollback

- `2025_07_18_105318_create_blog_tags_table.php` **`down()`** only calls `Schema::dropIfExists('blog_tags')`. The pivot **`blog_blog_tag`** has foreign keys to `blog_tags` and `blogs`, so dropping `blog_tags` first is likely to **fail** unless the pivot is dropped first. Treat rollback of this migration as **unsafe / incomplete**.

---

## Model vs migration drift

These are **logical** relationships or attributes present in Eloquent models but **not** backed by the migration-derived schema (or contradicted by it):

| Area | Model / code expectation | Migrations |
|------|---------------------------|------------|
| **`BlogCategory`** | `parent_id`, tree `parent()` / `children()` | `blog_categories` table has **no** `parent_id` column |
| **`User`** | `delete_status` in `$fillable` | No matching column found in migrations |
| **`User`** | `current_store` as “current store” | Column exists; **no FK** to `stores` |
| **`EmailTemplate` / `UserEmailTemplate`** | ownership via `user_id` | **No** FK constraints |

---

## Polymorphic and Spatie pivot tables (no single FK target)

- **`media`:** `model_type` + `model_id` (and Spatie-style JSON columns). No single `Ref:` target in DBML.
- **`model_has_permissions` / `model_has_roles`:** `model_type` + `model_id` for arbitrary assignable models. Documented as polymorphic in the diagram notes only.

---

## Laravel framework tables included

- **`cache`**, **`cache_locks`**, **`jobs`**, **`job_batches`**, **`failed_jobs`**, **`sessions`**, **`password_reset_tokens`** — from default / queue migrations. Operational tables; usually omitted from product ERDs but included here for completeness.

---

## Suggested follow-ups (optional)

1. Add a migration to align **`blog_categories`** with `BlogCategory` (add `parent_id` + self-FK) **or** remove parent/child from the model.
2. Decide whether **`users.current_store`**, **`email_templates.user_id`**, and **`user_email_templates.user_id`** should have **foreign keys** (and nullable behavior on delete).
3. Add **`unique(store_id)`** (or equivalent) on **`pos_settings`** if exactly one row per store is required.
4. Revisit **global** `slug` uniqueness on **`blogs`** and **`blog_categories`** if slugs should be unique **per store** only.
5. Fix **`blog_tags` migration `down()`** to drop **`blog_blog_tag`** before **`blog_tags`**.

---

## DBML vs indexes in the database

- The DBML file lists **primary keys**, **unique constraints**, and **indexes declared** on the original `Schema::create` / `Schema::table` definitions (where captured).  
- **`2026_01_04_104217_add_missing_indexes_for_performance.php`** may add **extra** non-unique indexes at runtime (MySQL, conditional on `SHOW INDEXES`). Those are **not** fully duplicated in the DBML, so a live database can have more indexes than the diagram shows.

---

## File reference

- Diagram: `docs/database-diagram.dbml` (import at [dbdiagram.io](https://dbdiagram.io)).
- Migrations: `database/migrations/*.php`.
