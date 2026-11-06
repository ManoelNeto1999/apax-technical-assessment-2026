# APAX Technical Assessment — Manoel Neto

**GitHub:** ManoelNeto1999

**Candidate focus:** Full-stack / React + TypeScript, with backend and blockchain assessment extensions.

**Availability:** Interested in full-time work; exact weekly hours and start date to be confirmed.

## Scope delivered

| Assessment | Delivery | Notes |
|---|---|---|
| Frontend A | Implemented | Email login calls POST /user/login; validates the JWT payload; sessionStorage, loading, accessible errors, /dashboard navigation |
| Frontend B | Written plan | Phased migration from mock Zustand holdings and activity to typed authenticated APIs, without rebuilding the dashboard UI |
| Backend A | Implemented | Signed HS256 JWT, user ID and email claims, Bearer verification with compatible legacy cookie path |
| Backend B | Implemented | Authenticated GET /api/holdings backed by Mongoose; per-user query, GOLD/SILVER/PLATINUM model, nonnegative Decimal128 grams, unique user+asset index, timestamps |
| Blockchain A | Prototype + test plan | OpenZeppelin ERC-20 with KYC allowlist, wallet freeze, roles, pause, custody-reference mint and allowance-backed redemption burn |
| Blockchain B | Written plan | ethers balanceOf/allowance, chain vs Mongo projection, confirmation/reorg handling and custody-controlled redemption |
| Full-stack note | Written plan | Prioritized eight-step first-week delivery roadmap |

**Start here:** [Technical notes](web/APAX_ASSESSMENT_NOTES.md), [First week](web/FULLSTACK_WEEK_ONE.md), [Solidity prototype](web/contracts/APXGold.sol), [Contract design](web/contracts/README.md), [Test plan](web/contracts/TEST_PLAN.md), [Integration](web/contracts/FRONTEND_BACKEND_INTEGRATION.md).

A high-level token design and additional threat scenarios are also in the [blockchain](blockchain) directory.

## Offline verification already performed

Using a disposable Ubuntu 24.04 VM without network access and without active Codex credentials while executing repository code:

- TypeScript (tsc --noEmit --incremental false): **PASS**.
- ESLint on changed TypeScript files: **PASS**.
- Node test suite for holdings serialization and unauthorized requests: **4/4 PASS**.
- Local HTTP checks for missing, wrong-scheme, and invalid JWT: **401 JSON**, as expected.
- Solidity 0.8.24 + OpenZeppelin Contracts 5.3.0: **APXGold.sol compiled successfully**.

Not run/verified: real MongoDB-connected login, authenticated holdings query against a seeded database, end-to-end Next.js login in browser, on-chain mint/burn/blocked-transfer tests, actual KYC or custody service, contract deployment. The Next.js production build was blocked by Google Fonts downloads in the network-disabled VM (Geist Mono, Inter, Playfair Display); TypeScript and changed-source lint passed. Do not represent this as a completed production build.

## Running tests in a reviewed environment

After independently inspecting the source and installing locked JS dependencies, from the web directory:

    node node_modules/typescript/bin/tsc --noEmit --incremental false
    node node_modules/eslint/bin/eslint.js app/login/page.tsx lib/services src/index.ts src/models src/routes/holdings.ts src/services/holdings.ts
    node --import tsx --test src/services/holdings.test.ts src/routes/holdings.auth.test.ts

Backend API requires server-side MONGO_URI and JWT_SECRET (not committed). Frontend API origin can be configured with NEXT_PUBLIC_API_BASE_URL; see technical notes for token-storage tradeoffs. The prototype Solidity contract requires a separate environment containing Solidity 0.8.20+ and OpenZeppelin Contracts 5.x. No new blockchain dependencies have been added to the Next.js application.

## Security boundary and limitations

The original supplied project contained a dynamic remote-code loading/execution mechanism, which was excluded from this reviewed assessment copy along with environment/configuration files. This removal is not a complete security audit. No third-party assessment code was executed on the candidate's primary Linux host. The code was analyzed and tested only in the disposable offline VM.

The bearer token in sessionStorage is intentionally a limited assessment solution and remains XSS-accessible; production would require a security review of HttpOnly cookies / CSRF, CSP, CORS, rate limits, audit logging, role governance and key rotation. The contract is **assessment code only**: not ERC-3643-compliant, not audited, not deployed, and not independently connected to physical metal or verified KYC.
