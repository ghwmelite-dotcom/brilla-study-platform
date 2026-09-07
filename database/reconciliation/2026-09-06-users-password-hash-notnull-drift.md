# Schema drift: users.password_hash nullability

**Found:** 2026-09-06, while shipping the practice-battle bot user (migration 368).

- **Prod (`brilla-db`):** `users.password_hash TEXT NOT NULL` (no default).
- **Repo `database/schema.sql`:** `password_hash TEXT` (nullable).

**Impact:** inserts without `password_hash` pass locally/in tests but are rejected on prod.
The bot user insert (migration 368 + route guard + seed) shipped without the column and
silently no-oped via `INSERT OR IGNORE` on prod, failing battle creation with a 500.

**Why not just align schema.sql:** flipping it to NOT NULL breaks 55 existing worker test
fixtures that insert users without a password. Prod reality wins for OAuth users (they get
placeholder hashes), so prod is NOT NULL on purpose.

**Action taken:** migration 368, the `POST /api/battles` bot guard, and `seed.sql` all now
write `password_hash = 'BOT_ACCOUNT_NO_LOGIN'` for the bot.

**Recommended later reconciliation:** update test fixtures to always insert a placeholder
`password_hash`, then flip schema.sql to `NOT NULL` to match prod.
