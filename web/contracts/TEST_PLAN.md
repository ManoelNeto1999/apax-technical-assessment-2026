# Proposed Foundry / Hardhat tests — NOT RUN

The Foundry/Hardhat cases below remain pseudocode and have not been run as that suite. Separately, Solidity compilation and 14/14 local Ganache/EVM smoke checks **were** completed; see [offline results](OFFLINE_BEHAVIOR_RESULTS.md). No real deployments or external custody tests were run. For the full suite, pin Solidity/OpenZeppelin 5.x and turn the cases below into executable integration/fuzz tests.

Fixture: distinct deployer, admin, compliance, minter, pauser, redeemer, holder, recipient and attacker. Deploy with admin; grant each operational role explicitly. Verify holder, recipient and redeemer through compliance. Use fresh nonzero bytes32 IDs and amounts in base units.

| Case | Pseudocode and expected assertions |
| --- | --- |
| Constructor/roles | deploy(0) reverts; deploy(admin) grants only admin role to admin, no roles to unrelated deployer, no operational roles implicitly. |
| Role boundaries | attacker cannot grant/revoke roles, set verification/freeze, mint, pause/unpause or redeemBurn. Each operational role fails other roles' operations and cannot grant itself roles. Revocation removes authority. Admin may explicitly grant itself operations. |
| Zero addresses | grantRole/revokeRole for zero and compliance mutation of zero revert; mint to zero and burn from zero revert without consuming reference. |
| Mint allowed | minter.mint(holder, 2e18, depositA): balance and totalSupply rise 2e18; processedDeposits true; Transfer(0,holder,amount) and CustodyMint match. |
| Mint blocked | non-minter, zero ID, zero amount, unverified recipient, frozen recipient and paused state revert; balances/supply unchanged and unused ID remains unused. |
| Mint replay | repeat successful depositA with different recipient/amount reverts; supply unchanged. Failure with fresh ID followed by corrected request succeeds. |
| Whitelist | transfer succeeds for eligible endpoints; de-verify sender then recipient independently: transfers revert, including zero-value transfers. Reverification restores transfer eligibility. |
| Freeze | freeze sender then recipient independently: transfer reverts; unfreeze restores it. Unverified/frozen self-transfers fail too. |
| transferFrom | holder approves spender; eligible endpoints and sufficient allowance succeed and finite allowance decreases. Unverified/frozen holder or recipient reverts, preserving allowance and balances. Insufficient allowance/balance reverts. Non-KYC spender with eligible endpoints succeeds by documented policy. |
| Pause | pause blocks transfer, transferFrom, mint and redeemBurn; supply, allowances and processed IDs roll back on failed balance operations. Approve and compliance/role administration remain possible. Only pauser unpauses; successful operations resume. |
| Burn authority | holder approves attacker: attacker still cannot burn without role. Redeemer without holder allowance fails. Role plus allowance succeeds only with eligible/unfrozen holder AND operator. Even holder acting as redeemer needs explicit self-allowance. |
| Burn inputs/replay | zero redemption ID/amount fail; repeat successful ID for same or another holder fails. Unused ID remains unused after failed authorization/allowance/pause/balance checks. |
| Burn accounting | mint 3e18, approve 1e18, burn 1e18: balance/supply fall 1e18, allowance falls 1e18; Transfer(holder,0,amount) and RedemptionBurn match holder/operator/reference. Infinite approval remains infinite; burning above balance rolls back allowance and ID. |
| Namespace | successful deposit ID may also be used once as redemption ID; replay rejected independently within each namespace. |
| Units/supply | decimals()==18; initial totalSupply()==0; 1e18 base units is one whole token; partial-unit arithmetic exact; sum tracked balances equals supply across mint/transfer/burn sequences. No reserve/supply cap assertion exists. |
| Helper | canTransfer rejects zero endpoints, pause, ineligible/frozen endpoints and insufficient balance; allows eligible zero-value transfer. It does not predict allowance failure or future state. |
| Invariants/fuzz | only successful mints increase supply and only successful redemption burns reduce it; failed calls leave state unchanged; consumed IDs never clear; successful balance updates obey pause/endpoint policy. |

Separate integration/security exercises must check duplicate physical deposits under different IDs, custody reconciliation, compromised role responses, approval misuse, exact unit conversion, indexer reorg rollback and release only after burn finality. Contract tests cannot prove off-chain verified redemption authorization or physical backing.
