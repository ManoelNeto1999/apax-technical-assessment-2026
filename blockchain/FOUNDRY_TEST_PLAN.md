# APX-Gold — Foundry or Hardhat test plan

**These are proposed tests, not executed tests.** Pin Solidity 0.8.x, OpenZeppelin Contracts 5.x and a supported testing framework before deployment; do not add dependencies to the existing Next.js application solely to document the exercise.

| Test | Setup and expected result |
|---|---|
| verified mint | Mint succeeds only for authorized MINTER, verified recipient, valid unique custody receipt ID |
| unauthorized mint | Unprivileged account reverts; supply unchanged |
| replayed mint | Reused deposit ID reverts even if recipient/amount differs |
| blocked recipient | Transfer to unverified/frozen address reverts |
| transferFrom gate | Transfer with valid allowance to unverified destination still reverts |
| verified transfer | Sender and receiver KYC valid, token unpaused; balances change correctly |
| sender frozen | Compliance freeze blocks sends and approvals cannot bypass it |
| pause/unpause | PAUSER can pause, unprivileged user cannot; transfers and mint/burn revert when paused |
| redemption authorization | REDEEMER cannot burn from investor without allowance/escrow |
| redeemed once | Duplicate redemption reference cannot burn twice |
| redemption finality | Custodian must not release physical asset until burn confirmed beyond reorg policy |
| role isolation | Minter cannot modify KYC; compliance cannot mint; pauser cannot confiscate |
| boundary values | Zero, exact balance, fractional grams, very large numbers follow explicit decimal policy |
| supply reconciliation | Supply tracks mint/burn and cannot exceed externally confirmed reserves where enforced |

Invariants: sum of balances equals totalSupply; every custody receipt and redemption ID is single-use; a blocked transfer never changes state; no stored PII; expired KYC or sanctions changes restrict transfer; no approval bypasses compliance.

Fixtures: multisig admin, minting and redemption operators, compliance operator, eligible and ineligible investors, frozen investor, independent fake custodian receipt service. Mock off-chain external providers; never use private production keys or live RPC secrets.

Follow with fuzz/invariant tests, Slither and external audit before any real deployment.
