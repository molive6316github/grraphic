# MXT DB

Reference for **MXT DB** (`db.mxt.productions`), the database/REST backend that
replaced Supabase for Grraphic. This was reverse-engineered against the live
service and verified; treat it as the source of truth until official docs exist.

MXT DB is, in effect, **PostgREST + Postgres (with RLS) + a GateKey-fed `auth`
schema**, served per-project. If you know Supabase's data layer, most of this
will feel familiar.

---

## 1. Base URL & project

```
https://db.mxt.productions/api/v1/projects/<project_ref>
```

- Grraphic's project ref: `jf0qdubnp0gi6yvc`.
- Service metadata: `GET https://db.mxt.productions/` → `{ name, version, docs }`.
- Health: `GET https://db.mxt.productions/health` → `{ status, version, database, storage }`.
- Per-project OpenAPI (auto-generated, often sparse): `GET <base>/openapi.json`.

All table/RPC/query calls below are relative to `<base>`.

---

## 2. Authentication

Every request sends the project **anon** or **service_role** key in the
`apikey` header. User identity is layered on top with a **GateKey access token**
as a `Bearer`:

```
apikey: <anon or service_role key>
Authorization: Bearer <GateKey user access token>   # optional; sets the user
```

- **anon key** — public, safe for the browser. Subject to RLS.
- **service_role key** — server-only secret. **Bypasses RLS.** Never ship it to
  the client.
- **GateKey bearer** — the signed-in user's token (from GateKey SSO). Its claims
  feed the `auth` schema, so RLS policies scope rows to that user. Without it,
  requests are anonymous.

### The `auth` schema (used by RLS)

MXT DB provides Supabase-shaped helpers, so policies read just like Supabase:

| Function | Returns |
|---|---|
| `auth.uid()` | the bearer token's `sub` claim, as **text** |
| `auth.jwt()` | the token claims (jsonb) |
| `auth.role()` | the role claim (`anon` / `authenticated` / `service_role`) |
| `auth.email()` | email claim, if present |
| `auth.project_id()` | the project ref |

> Note: `auth.uid()` is **text** here (Supabase's is `uuid`). Compare against
> `uuid` columns with a cast: `auth.uid()::uuid = user_id`.

### Roles

Per-project Postgres roles back the keys: `mx_<ref>_anon`,
`mx_<ref>_authenticated`, `mx_<ref>_service`, `mx_<ref>_authenticator`. There are
**no bare `anon` / `authenticated` roles**, so don't write `GRANT … TO anon` or
`CREATE POLICY … TO authenticated` — omit the `TO` clause and gate with
`auth.uid()` / `auth.role()` instead.

### RLS is on by default

Tables deny access unless a policy allows it (even before you run
`ENABLE ROW LEVEL SECURITY`). `service_role` bypasses RLS entirely — that's how
server code (the Stripe webhook, migrations) writes freely.

---

## 3. REST API (PostgREST-compatible)

Tables are exposed at `<base>/<table>`.

### Read

```
GET <base>/design_analyses?select=id,file_name&user_id=eq.<uuid>&order=created_at.desc&limit=20
```

- `select=col,col` — projection.
- Filters are `column=operator.value`: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`,
  `like`, `ilike`, `in.(a,b)`, `is.null`, etc. (standard PostgREST).
- `order=col.desc` / `order=col.asc`, `limit=`, `offset=`.
- A bare `?col=value` (no operator) is rejected: `expected operator.value`.

### Write

```
POST   <base>/<table>            # insert (body = row object or array)      → 201
PATCH  <base>/<table>?id=eq.<x>  # update rows matching the filter          → 200/204
DELETE <base>/<table>?id=eq.<x>  # delete rows matching the filter          → 204
```

Add `Prefer: return=representation` to get the affected rows back in the
response body (otherwise writes return empty).

Because the wire format is PostgREST, the app talks to it with
`@supabase/postgrest-js` (`.from().select().eq()…`, `.rpc()`) — see
`src/lib/supabase.ts`.

---

## 4. RPC (database functions)

```
POST <base>/rpc/<function_name>
Content-Type: application/json
{ "arg_name": "value" }
```

Returns the function result as JSON. Example:

```
POST <base>/rpc/get_shared_resource   { "p_token": "<uuid>" }
```

Grraphic's functions: `get_email_for_username`, `is_username_available`,
`is_user_admin`, `get_shared_resource`, `get_storage_usage` (see `schema.sql`).

---

## 5. Raw SQL — `POST <base>/query` (service_role only)

```
POST <base>/query
apikey: <service_role key>
{ "query": "select 1" }
```

Returns `{ command, rowCount, fields, rows }` (or an array of those for a
multi-statement script). Multi-statement scripts — including `$$`-bodied
functions and `DO` blocks — run in one call. This is how the schema is applied
(`schema.sql`). **Service role only.**

---

## 6. Schema / DDL notes

- Objects live in the **project schema** `proj_<ref>`, which is the default
  `search_path` and `current_schema`. The REST layer resolves unqualified table
  names there.
- The service role has **CREATE on the project schema but not on `public`** —
  `CREATE TABLE public.x` fails with `permission denied for schema public`.
  Create objects **unqualified** (or qualified with `proj_<ref>`).
- In `SECURITY DEFINER` functions, set `search_path = proj_<ref>, pg_temp`
  (not `public`).
- `auth.users` exists but GateKey-user auto-provisioning into it is **not**
  relied upon — don't add FKs to `auth.users`. The app upserts its own `users`
  row on login instead.

---

## 7. Errors & limits

Errors are JSON: `{ "code": "<code>", "message": "<text>", "status": <n> }`.

- `unauthorized` (401) — missing/invalid apikey or token.
- `forbidden` (403) — needs a higher-privilege key (e.g. service_role).
- `not_found` (404) — unknown route, or `Table "x" does not exist` (any unknown
  path segment is treated as a table name).
- `parse_error` (400) — bad filter syntax.
- `pg_<sqlstate>` (e.g. `pg_42501`) — a Postgres error, including
  `row violates row-level security policy` on RLS denials.

---

## 8. How Grraphic uses it

- **Client:** `src/lib/supabase.ts` is a thin shim over `@supabase/postgrest-js`
  pointed at `<base>`, keeping the `.from` / `.rpc` surface. A dynamic `fetch`
  injects the `apikey` header and the current GateKey bearer on every request.
- **Env:**
  - `VITE_MXTDB_URL` = `https://db.mxt.productions/api/v1/projects/jf0qdubnp0gi6yvc`
  - `VITE_MXTDB_ANON_KEY` = the project anon key (client-safe)
  - service_role key is used only by server/admin tooling, never in the bundle.
- **Auth:** GateKey SSO (`/api/auth/*`) yields the user token; the client stores
  it and sends it as the DB bearer so RLS scopes rows by `auth.uid()`.

### Known gaps / TODO

- **Storage:** MXT exposes a `storage` schema and reports `"storage":"local"`,
  but its storage **API is not mapped yet**. The client storage calls are
  currently stubbed (analysis thumbnails / AssetVault uploads don't persist).
- **Token lifetime:** GateKey user tokens are short-lived (~15 min) and no
  refresh endpoint is documented, so sessions currently need re-auth on expiry.
