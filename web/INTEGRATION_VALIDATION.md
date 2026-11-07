# APAX Assessment — Full integration validation

**Validation date:** 2026-11-06
**Environment:** Ubuntu 24.04 isolated QEMU/KVM guest; network interface disconnected before application execution and build; Codex logged out. Synthetic local credentials and user/asset data only. No production services or databases accessed.

## Production Next.js build — PASS

- Node.js 22.22, Next.js 16.4.3 with Turbopack, and dependencies from the previously reviewed lockfile.
- The three unused next/font/google declarations in app/layout.tsx were removed; none of their generated classNames/variables were applied. This removed unnecessary build-time Google Fonts requests without redesigning the page.
- NEXT_TELEMETRY_DISABLED=1 and next build completed with exit status 0.
- Static route generation completed for /, /login, /dashboard and /_not-found.
- The production Next.js HTTP server returned status 200 for GET /login and GET /dashboard.
- An independent TypeScript no-emit check and ESLint of the layout file both exited 0.
- Important limitation: Next config skips its internal TypeScript validation, but the separate TypeScript CLI verification passed. HTTP page checks do not prove interactive browser hydration, click handling, sessionStorage behavior or end-to-end redirect in an actual browser.

## MongoDB, JWT, and holdings HTTP integration — 11/11 PASS

- MongoDB Community 8.0.34 bound only to 127.0.0.1:27019 inside the guest, using a temporary isolated database named apax_validation.
- Backend Express/TypeScript listening on guest-local port 4000 with test-only JWT secret and local database URI, neither committed nor reused.
- Created exactly two **synthetic** users via Mongoose with hashed passwords and independent user IDs. Registration via Cloudinary was intentionally not in scope.
- Seeded each user's holdings with deliberately different gold, silver and platinum Decimal128 gram amounts; the unique user + asset compound index was created.

| No. | Integration assertion | Result |
|---|---|---|
| 1 | POST /user/login for synthetic Alice returns JWT and user object without password | PASS |
| 2 | POST /user/login for synthetic Bob returns a different JWT | PASS |
| 3 | Incorrect password rejected as HTTP 401 | PASS |
| 4 | Unknown email rejected as HTTP 401 | PASS |
| 5 | GET /api/holdings with Alice JWT returns only Alice's gold/platinum | PASS |
| 6 | GET /api/holdings with Bob JWT returns only Bob's gold/silver | PASS |
| 7 | Alice cannot select Bob's holdings by adding user or userId query parameters | PASS |
| 8 | Missing JWT rejected as HTTP 401 | PASS |
| 9 | Malformed JWT rejected as HTTP 401 | PASS |
| 10 | GET /user/me with Alice Bearer JWT returns Alice | PASS |
| 11 | Login also sets an HttpOnly cookie for compatibility with legacy cookie auth | PASS |

Logs contain pass/fail descriptions only, no JWT, Mongo credentials or non-synthetic identity details. HTTP responses and checks occurred only inside the guest.

## Earlier independent checks

- TypeScript compilation and changed-code ESLint: PASS.
- Four automated Node unit tests of serialized holdings and unauthorized requests: 4/4 PASS.
- APX-Gold compilation with solc 0.8.24 and OpenZeppelin Contracts 5.3.0: PASS.
- APX-Gold local Ganache smoke scenarios, including role constraints, KYC, freezing, pause, mint/burn and replay prevention: 14/14 PASS; see contracts/OFFLINE_BEHAVIOR_RESULTS.md.

## What remains deliberately unverified

Interactive login through a real browser UI (click, browser storage and redirect), multi-browser acceptance, production CORS/cookie security, external Cloudinary registration, independent security audit, end-to-end wallet/chain/custody indexer, full blockchain fuzz/property testing, real-world KYC and vaulted-metal reserve auditing. The prototype is not deployed and should not be used with real funds or keys.

The candidate copy was reviewed to remove an identified remote-code loader, but that is not a general clean bill of security. No third-party APAX source was executed outside the disposable guest.
