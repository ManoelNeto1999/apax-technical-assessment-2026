# APAX assessment notes

## Implemented: email login and minimum JWT support

`app/login/page.tsx` posts email/password through `lib/services/login.api.ts` to
`/user/login`, clears the previous inline error on retry, displays failures in a
`role="alert"` region, disables submission while pending, and resets loading in
`finally`. Only an HTTP-success JSON response with `success: true` and a nonempty
top-level `token` is accepted. The token is saved under `apax.jwt` in sessionStorage
before navigation to `/dashboard`. Email login has no simulated success or delay;
the wallet demo and page styling remain unchanged.

`lib/services/base.api.ts` reads `NEXT_PUBLIC_API_BASE_URL` (origin, without `/user`),
with `http://localhost:4000` as the development fallback and same-origin paths in
production when unset. Configure the public base at frontend build time for deployment.
It reports network, HTTP, malformed JSON, and unsuccessful API responses.
Future browser API calls can pass `withAuthorization()` as the fourth argument,
for example `baseAPI('/user/me', 'GET', undefined, withAuthorization())`.
Use this helper only with the trusted API, and never log tokens or headers.

`src/models/userModel.ts` signs `{id,email}` with HS256, the server-only
`JWT_SECRET`, and a one-hour expiry; a missing secret fails explicitly.
`src/middlewares/user_actions/auth.ts` verifies the same secret/algorithm and
accepts Bearer headers, falling back to the existing cookie only when no header
is present. Missing, malformed, expired, invalid, or deleted-user tokens return
JSON 401 responses. `src/utils/sendToken.ts` returns an explicit public user field
allowlist because login selects the password hash; passwords and reset secrets
must not be serialized.

## Frontend Task B: proposed integration, not implemented

1. Define separate wire DTOs and runtime guards near `lib/services/` before
   updating React state. `src/types/api.ts` currently defines `Deposit` and
   `Withdrawal` with numeric IDs/amounts and string dates. Validate object/array
   shapes, finite nonnegative amounts, valid ISO dates, and explicit units/currency;
   parse dates into `Date` only after validation. TypeScript alone does not
   validate JSON. Agree on decimal precision for financial quantities.
2. `src/routes/balance.ts` and `src/routes/activity.ts` currently both return
   `{deposits, withdrawals}` from `src/services/balance.ts`, shared in-memory arrays.
   They provide neither per-user metal holdings nor prices. Before real use, add
   authentication, server-side user scoping derived from the verified identity,
   persistence, amount validation, and a holdings DTO with grams per metal and
   APX-i balance. Do not infer grams from untyped deposit amounts or trust a client
   `user` field for ownership. Keep transaction activity distinct from vault audits.
3. Stage migration in `lib/store.ts`: add nullable holdings and a separate typed
   activity collection with independent idle/loading/success/error states, fetch
   actions, and reset-on-logout. Retain Zustand for UI state. Load once from
   `app/dashboard/page.tsx` with cancellation/stale-response protection, using the
   authorization helper. Move fixtures behind an explicit demo mode; real-request
   failures must never silently restore mock balances. Replace holdings first,
   then activity; remove the matching simulated updates as each source goes live.
4. Update `components/portfolio-overview.tsx` and
   `components/asset-allocation-chart.tsx` to select validated holdings/status.
   Show skeletons during initial load, a zero-holdings message for successful empty
   data, and an accessible error with retry on failure. Guard zero chart totals to
   avoid NaN percentages. Replace the chart's `getState()` APX-i read with a reactive
   selector. Price-based valuation must remain marked demo until prices are real.
5. Add a transaction activity section to `components/views/dashboard-view.tsx`
   with its own loading, empty, error/retry, and success states. The existing
   `auditLogs` list in `components/views/por-view.tsx` represents vault audits,
   not user deposits/withdrawals; do not relabel transactions as verified audits.
   Later migrate that audit list only when a suitable audit endpoint exists.

Holdings, prices, price/audit timers in `app/dashboard/page.tsx`, vault reserves,
audit logs, daily change, dashboard identity/network ticker, wallet connection,
and other certification/redemption/Zakat demo behavior remain as supplied.
No blockchain code or frontend Task B integration was changed. The backend
holdings endpoint below now supplies grams; APX-i and prices remain separate future contracts.

## Security and deployment

sessionStorage is a simple per-tab assessment choice, not XSS-resistant storage:
JavaScript injected into the origin can steal the JWT. It survives reloads but
normally ends with the tab session; the existing Remember me checkbox does not
extend it. Use HTTPS, prevent XSS, and clear tokens and user state on logout/401
when integrating future requests. No refresh or revocation flow is implemented.
JWT payloads are signed, not encrypted. Never expose JWT_SECRET via NEXT_PUBLIC.
Dashboard navigation alone is not access control; protect all real data server-side.

`src/index.ts` currently uses permissive `cors()`. Bearer requests need a trusted
frontend origin and preflight support for Authorization and Content-Type in a
production CORS policy. This frontend does not opt into cross-origin cookies.
The legacy HttpOnly cookie is still emitted; production cookie use needs Secure,
appropriate SameSite, explicit credentialed CORS origins, `credentials: 'include'`,
and CSRF protection. HttpOnly cookies reduce direct token theft by JavaScript but
require that different request-security model. Do not add credentialed wildcard CORS.

## Manual checklist (not executed)

- With a separately provisioned API/database, valid credentials produce one JSON
  POST `/user/login`, save `apax.jwt`, and navigate to `/dashboard`.
- Slow the request: submit is disabled, loading is visible, and loading resets
  after failure; retry clears the previous error. Verify alert announcement.
- Try invalid credentials, HTTP 500, offline/CORS failure, HTML/empty/malformed
  JSON, `success:false`, missing success, and missing/blank token. Stay on login,
  show an inline error, and do not retain a stale JWT.
- Block sessionStorage: show an inline error and do not navigate.
- Call `/user/me` with the helper: valid JWT succeeds; missing, malformed, wrong
  signature, expired JWT, or unknown user returns 401. Check legacy cookie fallback
  and that an invalid header cannot fall back to a valid cookie.
- Check that login never returns password/reset fields, and missing JWT_SECRET
  fails explicitly. Inspect logs for absence of tokens/passwords.
- Confirm the wallet demo and page layout still behave as supplied.

Only static source review was performed. Per instruction, no dependency commands,
builds, tests, app, backend, or database were run. Live integration is unverified.
Backend startup now awaits the Mongo connection as described below.


## Backend Task B: implemented holdings endpoint

`GET /api/holdings` uses the existing JWT middleware before any holdings query.
Static route review: the only ownership filter is `{ user: req.user._id }`, where
middleware resolves the user from a verified HS256 JWT. No query/body user ID is
read. Missing/malformed/wrong-signature/expired tokens return JSON 401 before any
Mongo access; a valid token for a deleted user requires a user lookup then returns
401. Missing JWT_SECRET is a server configuration error (500), not a bad-token case.
The existing `/user/login`, token generation, Bearer/cookie behavior, and frontend
source are preserved. Holdings responses include `Cache-Control: no-store`.

`src/models/holdingsModel.ts` defines required user ObjectId, asset enum
GOLD/SILVER/PLATINUM, finite nonnegative Decimal128 amount in grams, automatic
updatedAt, and a unique compound user+asset index. Provision/verify that index
before serving production data; Mongoose `unique` is an index declaration, not a
validator. Existing duplicates must be reconciled before index creation. Future
writers must construct Decimal128 from decimal strings (up to 34 significant
digits), use validation on query updates, and maintain timestamps; direct database
writes bypass Mongoose validation. There is no write endpoint in this task.

The wire type is `HoldingsResponse` in `src/services/holdings.ts`: exactly gold,
silver, platinum, each `{ amountGrams: string, updatedAt: string | null }`.
Decimal128.toString() is serialized directly, preserving decimal precision and
potential exponent notation; never coerce these quantities through JS Number for
accounting. Timestamps are ISO UTC strings; missing rows use "0" and null (unknown
update time, not a fabricated timestamp). Example synthetic response:

```json
{
  "gold": { "amountGrams": "12.3400", "updatedAt": "2026-01-01T00:00:00.000Z" },
  "silver": { "amountGrams": "0", "updatedAt": null },
  "platinum": { "amountGrams": "0", "updatedAt": null }
}
```

This supersedes the proposed numeric holdings DTO above: frontend runtime guards
must validate nonnegative decimal strings (including exponent notation) and nullable
ISO timestamps. This endpoint supplies no APX-i balance, valuation, activity,
prices, blockchain reserves, or proof of custody. The legacy `/balance` and
`/activity` routes still expose shared demo fixtures; do not use them as live data.

Startup now requires server-only MONGO_URI and awaits mongoose.connect before
listening, with no deprecated options. Missing URI produces a clear error and no
listener; connection failure logs a generic error without URI/driver details.
JWT_SECRET must also be provided securely for login/authentication. No actual
credentials are supplied. dotenv loads a root environment file by default; the
config directory example is not automatically loaded. A frontend-only demo can
be launched independently with the existing Next binary (`node_modules/.bin/next dev`)
without starting src/index.ts; the combined dev script expects backend configuration.
No commands were executed to verify startup. Existing CORS remains unchanged;
restrict it to configured frontend origins before deployment. Consider helmet,
login rate limiting, request size limits, and cookie/CSRF hardening separately;
no dependencies were added. This is review code, not audited financial infrastructure.

### Holdings checklist (not executed)

- Valid JWT: check all three keys, decimal strings and ISO timestamps; no holdings
  returns three zero amounts with null timestamps; partial holdings retain defaults.
- Missing, malformed, expired and wrong-signature JWT: JSON 401 and zero Mongo
  calls (instrument both User and Holding methods). An invalid Authorization header
  must not fall back to a valid cookie. Deleted-user token: 401, no holdings query.
- With two synthetic users, authenticate as one and add the other's ID through
  query parameters/body: only authenticated-user rows return, with no user IDs.
- Verify duplicate user+asset insertion fails after index creation; negative,
  NaN/infinite amounts and invalid assets fail Mongoose validation.
- Check DB failure returns generic JSON 500 without URI, JWT, or driver details.
- Check missing URI and failed connection never open the backend listener;
  frontend demo remains independently inspectable. Recheck `/user/login` behavior.
- Pure tests added in `src/services/holdings.test.ts` cover all assets, empty and
  partial defaults, Decimal128 precision/exponents and timestamp/JSON conversion.
  Intended later command with installed dependencies: `node --import tsx --test src/services/holdings.test.ts`.
  These tests do not connect Mongo. No tests, typecheck, build, app, or database
  commands were run in this pass; route isolation is static review only.
