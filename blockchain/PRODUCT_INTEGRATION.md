# APX-Gold — Next.js, API and blockchain integration

## Frontend reads

Use ethers.js (already present) or wagmi on client-side wallet connection, with chain-ID/contract-address validation. Read balanceOf, allowance, and decimals from verified ABI and deployed address. Use formatUnits for bigint values and avoid JS floating point for precision. Refresh after account/chain change and confirmed on-chain transaction; show connecting, wrong-chain, loading, empty, failed-RPC and revoked-authorization states. Never ask for seed phrases. Wallet connection does not replace backend user login.

## Source of truth and events

EVM chain is authoritative for token supply, finalized transfers, mint/burn and event history. MongoDB is a fast queryable index/projection and may be behind. Keep indexed block height and confirmation status visible to consumers. Physical custody is authoritative only at the independent custodian, confirmed through signed receipts and audits, not merely the chain or a MongoDB record.

The indexer processes contract events, backfills blocks, uses chain ID + contract + transaction hash + log index as unique event key, waits a configured number of confirmations, rolls back projections on reorg and reconciles against finalized chain state. A stale, incomplete or disputed sync must not be represented as verified reserve data. Bind private holdings to JWT-authenticated user and proven wallet ownership, never a caller-supplied user ID.

## Redemption before burn

Request -> authenticate & KYC -> custody/quantity/fees validation -> reserve or escrow tokens -> holder authorizes -> authorized burn, single-use redemption ID -> finality -> physical release -> independent reconciliation. Retry by idempotency key. Document failed/reorg/cancelled/court-ordered flows. Physical release never occurs on a mere pending transaction.

**Scope note:** no confirmed on-chain deployment, trusted custody provider, real KYC system, production reserve oracle or testnet transaction exists in this assessment. Dashboard mock values must stay identified as demos.
