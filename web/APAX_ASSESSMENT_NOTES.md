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

## Task B: proposed integration, not implemented

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
No blockchain code or Task B integration was changed.

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
`src/index.ts` does not currently call the connection helper in
`src/config/database.ts`; database startup/configuration remains an external
integration prerequisite and was not changed in this minimal JWT task.
