# Full-stack week one

1. Configure server-only JWT_SECRET/MONGO_URI and trusted frontend origins; verify DB-first startup and the holdings compound index.
2. Preserve login/Bearer flow; add logout/401 state cleanup and review HTTPS, cookies, CSRF, rate limits and helmet before deployment.
3. Exercise synthetic-user authentication and ownership isolation; cover bad tokens, DB failures and exact decimal serialization.
4. Add frontend runtime guards for the three-metal decimal-string/nullable-timestamp contract, then fetch authenticated holdings.
5. Replace holdings fixtures with loading, empty, retry/error states and stale-response protection; keep prices/APX-i explicitly demo.
6. Keep activity and vault audits separate; expose live user-scoped activity only after defining its persistence and contract.
7. Review chain IDs, contract addresses/ABI and read-only integration on a test network; require independent contract/security review before writes.
8. Gate transaction signing behind explicit user review, simulation and failure handling; do not claim real custody or reserves from demo data.
