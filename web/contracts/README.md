# APX-Gold optional assessment sample

**WARNING: assessment-only Solidity sample. NOT production-ready, NOT audited, NOT deployed, and NO connection to a custodian, vault or physical gold. Compilation and tests have NOT been run.** Frontend, backend and package manifests are unchanged.

`APXGold.sol` targets Solidity 0.8.20+ and requires OpenZeppelin Contracts **5.x**, supplied separately to compile. No dependencies were installed. A future build must pin an exact reviewed 5.x release and select a compiler satisfying that release's imported sources as well as this file's pragma; the pragma is not a claim that every future 5.x release compiles with 0.8.20.

## ERC-20 vs ERC-3643

ERC-20 offers common balance, allowance and wallet interfaces but does not encode investor identity or securities compliance. ERC-3643 adds an identity/claims and compliance framework, with agent operations and recovery mechanisms. Its larger trust and operational surface requires specialist design and review.

This hybrid keeps ERC-20 compatibility and demonstrates allowlist, freeze, pause and role controls. It is **not ERC-3643 compliant**: no identity registry, trusted claim issuers, claim validation, recovery, agent framework or complete compliance engine exists here. Integrations must expect transfers to revert. A boolean allowlist cannot capture jurisdiction, investor limits, identity expiry or changing legal eligibility.

## Governance and policy

Only the nonzero constructor `admin` receives DEFAULT_ADMIN_ROLE; the deployer receives nothing implicitly. The admin separately grants COMPLIANCE_ROLE (verification/freeze), MINTER_ROLE (deposit mint), PAUSER_ROLE (pause/unpause), and REDEEMER_ROLE (authorized redemption burn). Operational roles cannot grant roles by default. Production governance needs separate controlled signers, multisig administration, key rotation, monitored grants/revocations, incident procedures and a reviewed admin succession policy. Default AccessControl permits renouncing the last admin, potentially locking administration permanently.

Compliance controls both verification and freeze flags, rejecting zero addresses. Transfers and transferFrom require eligible, unfrozen holders and recipients; mint requires an eligible, unfrozen recipient. transferFrom spenders need allowance but are not themselves KYC-gated unless they are also an endpoint. Approvals remain possible while paused or frozen and are not compliance attestations. Pausing blocks all balance updates, including mint and burn, while role/verification management remains available.

Burn policy deliberately requires an eligible, unfrozen holder and an eligible, unfrozen redemption operator. Frozen or de-verified holders cannot redeem until an authorized compliance resolution; there is no confiscation, forced transfer or arbitrary public burn. This restriction can also obstruct legitimate exits and needs legal/operational review.

## Lifecycle and units

1. Custodian verifies a deposit, ownership, title, insurance and available unencumbered reserves. Backend reconciles it and assigns a globally unique opaque reference, without PII. A privileged minter is **not evidence of reserves**.
2. Minter submits recipient, positive amount and nonzero deposit ID. Successful mint consumes that ID permanently and emits CustodyMint plus ERC-20 Transfer. Failed calls roll back both consumption and supply changes. An alternative ID can still represent the same physical deposit: external deduplication is essential.
3. Holder requests redemption through an authenticated process and approves a specific redemption operator, preferably for the exact amount. Backend verifies the holder instruction, KYC, custodian eligibility, reserve allocation and escrow/lock workflow before burn.
4. Trusted REDEEMER_ROLE operator submits holder, positive amount and nonzero unique redemption ID. The contract spends holder allowance, burns and records the ID atomically. Backend records canonical burn finality before physical release; release failure requires reconciliation and a controlled compensation process, never automatic reminting.

The token inherits ERC-20's default **18 decimals**. For illustration only, one whole APXG represents one proposed troy ounce; `10**18` base units represent one whole token. No legal entitlement or actual gold claim is created by this code. Product/legal design must settle fine weight, purity, rounding, fees and minimum redemption sizes. No initial supply, cap or reserve oracle exists. Mint increases supply; redemption burn decreases it. Deposit and redemption IDs occupy separate namespaces and may share the same bytes32 value. Events expose addresses, amounts and opaque IDs; avoid IDs derived from guessable personal records.

## Biggest risks and missing pieces

- Compromised minter/admin can create unbacked supply or grant hostile roles; compliance can censor holders. The chain cannot prove physical reserves, custodian solvency, title or delivery.
- A redeemer with an existing allowance can burn without a fresh holder instruction. The sample trusts its off-chain verified authorization; it does not cryptographically bind holder, amount, chain and redemption ID. Production needs a reviewed authorization scheme with nonce, expiry, domain separation and replay protection, plus clear approval UX. Infinite approvals persist under OpenZeppelin's allowance semantics.
- Duplicate real deposits under different IDs, incorrect units and reconciliation failures can break backing. Reference uniqueness is local to this contract, not global across deployments/chains. There is no supply cap, custody attestation enforcement or reserve accounting.
- Freeze/pause misuse, key loss, front-running eligibility changes, stale client snapshots, chain reorgs and failed physical delivery require explicit operational procedures. No atomicity exists between a chain burn and a vault release.
- No upgrade mechanism, escrow implementation, identity expiry, sanctions service, signed redemption authorization, recovery system or independent security review is provided. Solidity/library compatibility remains unverified. Gas, adversarial behavior and integration behavior require actual testing.

See [TEST_PLAN.md](TEST_PLAN.md) and [FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md). No executable test suite or deployment configuration is included.
