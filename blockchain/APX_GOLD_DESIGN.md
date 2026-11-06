# APX-Gold — Compliance-aware token design

**Status: assessment prototype only. Not audited, not deployed, and not backed by confirmed custody.** No contract can prove that physical gold exists by itself.

## Token and technology decision

Represent one metal: APX-Gold. Proposed denomination is **1 token = 1 gram of allocated vaulted gold**, with 18 decimals for fractional balances. The custodian and token must reconcile grams using the same unit and rounding policy. Never mint until unencumbered physical assets and ownership have been confirmed.

**ERC-20 + custom gates:** use OpenZeppelin ERC-20 with KYC allowlist, wallet freeze, pause, distinct roles, and replay-safe custody deposit identifiers. This is a lightweight assessment prototype, NOT ERC-3643 compliant.

**ERC-3643 for production consideration:** an Identity Registry, verified on-chain identity claims, trusted issuers, Compliance module, standard transfer precheck, recovery, partial freezes, agent powers and legal review are required for a true regulated-token architecture. A mapping of eligible addresses is not equivalent to ERC-3643.

## Roles and controls

- DEFAULT_ADMIN_ROLE: multisig and delayed changes in production; never hot private developer keys
- COMPLIANCE_ROLE: set eligible/frozen wallets after off-chain KYC/AML and sanctions checks; never put personal documents on-chain
- MINTER_ROLE: issue only against authorized vault deposit confirmation with unique deposit reference
- REDEEMER_ROLE: burn only after a valid redemption workflow with holder consent or escrow
- PAUSER_ROLE: pause/unpause in emergencies; pause should cover mint, burn and ordinary transfers
- Every transfer and transferFrom checks BOTH sender and receiver (eligible, not frozen), as well as pause status. Mint checks eligible recipient. No business logic trusts the wallet connection as sign-in.

## Physical vault deposit to mint

1. Independently verify signed custody receipt, available reserves and legally eligible recipient.
2. Verify unit conversion and outstanding liabilities; reserve physical asset quantity for the token issuance.
3. Authorize issuance with unique unpredictable deposit ID; reject replay. Use an opaque event reference, not PII.
4. Mint through authorized role only; await blockchain finality and reconcile supply to custodian inventory.
5. Freeze issuance on stale or unverifiable attestations. On-chain MINTER_ROLE is not proof of custody.

## Redemption before burn

1. Authenticate the holder and verify KYC, sanctions, sufficient unlocked tokens, custody deliverability, fees and legal eligibility.
2. Create a unique idempotent redemption request and reserve/escrow requested tokens; prevent concurrent transfers.
3. Obtain holder approval/escrow. A redemption operator must not be able to burn arbitrary investor holdings.
4. Authorize exactly one burn per redemption ID, then wait for finality and reconcile supply.
5. Only after finality release or ship the metal through the custodian. Handle failures, cancellation, reorgs and disputes with durable state transitions.

## Risks and missing safeguards

Unbacked minting; compromised issuer/custodian/administrator keys; approval abuse; replayed deposit/redemption references; KYC revocation race; transferFrom compliance bypass; PII leaks; stale reserve audits; lack of 1:1 invariant enforcement; token quantity precision; malicious or missing oracle; emergency pause deadlocks; event-indexer blockchain reorgs; private-key recovery and upgradeability governance. Production needs vetted identity registry, custody attestations, timelock/multisig, contract audit, an external reserve audit and operational monitoring.

This assessment does not implement real custody oracle, KYC identity claims, production wallet recovery, or deploy on-chain.

**References:** ERC-3643 https://ercs.ethereum.org/ERCS/erc-3643 ; OpenZeppelin 5.x https://docs.openzeppelin.com/contracts/5.x/api/token/erc20 ; AccessControl https://docs.openzeppelin.com/contracts/5.x/access-control
