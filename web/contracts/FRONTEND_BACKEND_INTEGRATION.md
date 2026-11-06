# Proposed integration only

No frontend/API/auth code is changed. This is a design note, not an implemented custody or wallet integration.

## Next.js reads with ethers v6

Use a client wallet provider for wallet interaction. Validate the configured chain ID and contract address against a reviewed deployment registry; reject mismatches, invalid/zero addresses and missing contract code. Code presence alone does not establish contract identity: validate the reviewed deployment/bytecode and ABI through the deployment process. No deployed address exists for this sample. Obtain the account from the connected wallet, and validate the configured redemption operator independently.

Illustrative read fragment, assuming `provider`, `expectedChainId`, `reviewedAddress`, `holder` and `reviewedOperator` have been configured and validated:

```ts
import { Contract, formatUnits, getAddress, ZeroAddress } from "ethers";

const network = await provider.getNetwork();
if (network.chainId !== BigInt(expectedChainId)) throw new Error("Wrong chain");
const address = getAddress(reviewedAddress);
if (address === ZeroAddress || (await provider.getCode(address)) === "0x") {
  throw new Error("Invalid deployment");
}
const token = new Contract(address, [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function decimals() view returns (uint8)",
], provider);
const blockTag = await provider.getBlockNumber();
const [balance, allowance, decimals] = await Promise.all([
  token.balanceOf(getAddress(holder), { blockTag }),
  token.allowance(getAddress(holder), getAddress(reviewedOperator), { blockTag }),
  token.decimals({ blockTag }),
]);
const balanceText = formatUnits(balance, decimals);
const allowanceText = formatUnits(allowance, decimals);
```

Keep amounts as bigint/base-unit strings; use `parseUnits` for validated user input and never JavaScript floating-point multiplication. The sample uses 18 decimals, but read and validate deployment metadata. Refresh on wallet account/chain changes and canonical balance events. Invalidate stale requests after account/chain switches. A displayed balance or canTransfer result is a snapshot, not a promise of transaction success. Transactions can fail from changed verification, freezes, pause, balances or allowance. Request narrowly scoped approvals and show the operator, network and amount clearly; an approval is not a redemption request or evidence of custody eligibility.

## Three separate truths

- Canonical on-chain state and events establish token supply, balances, allowances and completed burns. Read calls provide current state; Transfer, CustodyMint, RedemptionBurn and governance events support indexing and audit. Use a chain-specific confirmation/finality policy, store block hashes and track pending versus confirmed versus finalized status. A transaction hash or receipt alone is insufficient finality.
- MongoDB is a rebuildable projection and workflow store, never the authority for token balances. Index idempotently by chain ID, contract, transaction hash and log index; retain block hash/height, checkpoint canonical blocks and roll back orphaned events before replay. Reconcile the projection with on-chain supply/balances and restart safely from checkpoints. Use event identities and references together, not deposit IDs alone, to avoid double-counting Transfer and custom events. OpenZeppelin 5.x allowance spending need not emit Approval: fetch allowance at canonical blocks instead of deriving it only from Approval logs.
- Vault/custodian records, independent reconciliation and legal agreements are external truth for actual reserves, beneficial ownership and delivery. MongoDB entries and on-chain mint events do not prove physical gold exists. Protect off-chain PII; only opaque references belong on-chain, recognizing that addresses/amounts remain public.

## Redemption before burn and release

Authenticate the holder's request; verify holder KYC and applicable eligibility, custodian/operator authorization, reserve availability, ownership, fees and delivery details. Allocate reserves and record a unique authorization tied to holder, amount and workflow; token approval alone cannot authorize physical redemption. The sample relies on a trusted redeemer checking these facts and does not verify a signed request on-chain.

Before burn, use a reviewed escrow/locking workflow or revalidate spendable balance and allowance immediately before submission. This sample implements no escrow or pending-redemption lock: the holder can spend or revoke allowance, so a pending request cannot be treated as irreversible. A backend reservation does not lock tokens on-chain. Any future escrow address needs eligibility and allowance policy designed explicitly.

The eligible authorized operator submits redeemBurn, which atomically consumes a unique ID, spends allowance and burns. Record confirmed canonical burn and required finality before authorizing physical release; coordinate a custodian acknowledgment and delivery audit trail. Reconcile failed transactions, reorgs and stalled delivery using explicit states (requested, verified/reserved, submitted, confirmed, finalized, released or exception). An irreversible physical release must not depend on an unfinalized transaction. A failed burn releases no gold. A finalized burn with failed delivery becomes a custody obligation requiring human resolution; do not silently remint or reuse a consumed redemption ID. Chain finality and physical settlement cannot be made atomic by this sample.
