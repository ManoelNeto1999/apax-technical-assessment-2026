# APAX Technical Assessment — Candidate Submission

Frontend priority: email login now uses `POST /user/login`, handles loading and errors, stores the returned JWT in session storage, and routes to `/dashboard`. A small backend JWT signing and Bearer-token verification fix supports the login contract.

See [`web/APAX_ASSESSMENT_NOTES.md`](web/APAX_ASSESSMENT_NOTES.md) for the proposed live-dashboard integration, tradeoffs, and manual test checklist. Dashboard data and wallet connection are still mocked; backend/MongoDB integration has not been exercised.

Validation in an offline Ubuntu VM: TypeScript `tsc --noEmit --incremental false` **passed** and ESLint of the changed TypeScript files **passed**. Next.js production build could not finish because `next/font/google` attempted to download external fonts while the VM was offline. The backend was not started, and live login was not tested.

This is a reviewed candidate copy without local credentials, npm configuration, build artifacts, or the previously identified dynamic remote-code loader. It is not a complete security audit. Do not publish confidential source without authorization.
