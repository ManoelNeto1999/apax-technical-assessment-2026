# APX-Gold — offline EVM smoke validation

**Date:** 2026-11-06

**Environment:** disposable Ubuntu VM, no network interface connected during execution, no active Codex session. Ganache 7.9.2 in a separate test harness using local in-memory chain ID 1337; ethers.js 6. Solidity 0.8.24 bytecode and ABI compiled against OpenZeppelin Contracts 5.3.0. All users and custody/redemption identifiers were synthetic.

**Result: 14/14 local behavioral checks passed.** This is a bounded smoke test against a local EVM, not a Foundry/Hardhat invariant/fuzz suite, independent audit, testnet deployment or demonstration of real physical reserves.

| # | Behavior verified | Result |
|---|---|---|
| 1 | Operational role setup | PASS |
| 2 | Unprivileged account cannot mint | PASS |
| 3 | Mint to unverified wallet is rejected | PASS |
| 4 | Authorized mint with unique custody ID increases balance/supply | PASS |
| 5 | A used deposit ID cannot be minted twice | PASS |
| 6 | Transfers to non-KYC destination are rejected | PASS |
| 7 | Verified sender can transfer to verified recipient | PASS |
| 8 | Frozen wallet cannot transfer | PASS |
| 9 | transferFrom cannot bypass the destination KYC gate despite approval | PASS |
| 10 | Emergency pause blocks mint and transfers | PASS |
| 11 | Unprivileged account cannot call redemption burn | PASS |
| 12 | Authorized redemption burn with holder allowance reduces balance/supply | PASS |
| 13 | A redeemed reference cannot be burned twice | PASS |
| 14 | Minter without compliance role cannot update KYC status | PASS |

The harness waits for transaction receipts when checking reverts: checking only transaction submission can mistakenly report success for a transaction that later reverts. No real custody receipt, independent KYC provider, reserve audit or multisig governance was connected. Other tests in [TEST_PLAN.md](TEST_PLAN.md), including expiry/revocation, more role boundaries, fuzzing, finality/reorganizations and live custody reconciliation, remain unrun.

The standalone Ganache harness and complete output log were retained locally outside the public repository in the candidate's testing evidence archive. No additional JavaScript dependencies were added to the Next.js project's manifest.
