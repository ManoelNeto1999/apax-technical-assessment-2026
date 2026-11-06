// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice ASSESSMENT SAMPLE ONLY: not audited, not production-ready, no custody connection.
/// @dev OpenZeppelin 5.x ERC20 with selected compliance gates; NOT ERC-3643 compliant.
contract APXGold is ERC20, ERC20Pausable, AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");

    mapping(address => bool) public verified;
    mapping(address => bool) public frozen;
    mapping(bytes32 => bool) public processedDeposits;
    mapping(bytes32 => bool) public processedRedemptions;

    error ZeroAddress();
    error InvalidReference();
    error InvalidAmount();
    error ReferenceAlreadyProcessed();
    error IneligibleAddress(address account);

    event VerificationUpdated(address indexed account, bool eligible);
    event FreezeUpdated(address indexed account, bool isFrozen);
    event CustodyMint(bytes32 indexed depositId, address indexed recipient, uint256 amount);
    event RedemptionBurn(
        bytes32 indexed redemptionId, address indexed holder, address indexed operator, uint256 amount
    );

    constructor(address admin) ERC20("APX-Gold", "APXG") {
        if (admin == address(0)) revert ZeroAddress();
        // No implicit operational roles or privileges for the deployer.
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function grantRole(bytes32 role, address account) public override {
        if (account == address(0)) revert ZeroAddress();
        super.grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public override {
        if (account == address(0)) revert ZeroAddress();
        super.revokeRole(role, account);
    }

    function setVerified(address account, bool eligible) external onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        verified[account] = eligible;
        emit VerificationUpdated(account, eligible);
    }

    function setFrozen(address account, bool isFrozen) external onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        frozen[account] = isFrozen;
        emit FreezeUpdated(account, isFrozen);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    /// @dev Authorized minter is NOT proof of verified physical reserves. Independently verify
    /// custody, deposit uniqueness across systems, and backing OFF-CHAIN BEFORE submitting.
    function mint(address recipient, uint256 amount, bytes32 depositId) external onlyRole(MINTER_ROLE) {
        if (depositId == bytes32(0)) revert InvalidReference();
        if (amount == 0) revert InvalidAmount();
        if (processedDeposits[depositId]) revert ReferenceAlreadyProcessed();
        processedDeposits[depositId] = true;
        _mint(recipient, amount); // _update checks eligibility, freeze and pause.
        emit CustodyMint(depositId, recipient, amount);
    }

    /// @dev REDEEMER_ROLE is a trusted attestation boundary, NOT on-chain verification of
    /// custodian authorization. Operator MUST verify a holder's redemption instruction,
    /// KYC, reserve/escrow and unique authorization off-chain before calling this function.
    /// Approval alone does NOT prove verified custodian eligibility or redemption intent.
    function redeemBurn(address holder, uint256 amount, bytes32 redemptionId)
        external onlyRole(REDEEMER_ROLE)
    {
        if (redemptionId == bytes32(0)) revert InvalidReference();
        if (amount == 0) revert InvalidAmount();
        if (processedRedemptions[redemptionId]) revert ReferenceAlreadyProcessed();
        _requireEligible(msg.sender);
        processedRedemptions[redemptionId] = true;
        // Even a holder with REDEEMER_ROLE must explicitly approve this operator.
        _spendAllowance(holder, msg.sender, amount);
        _burn(holder, amount);
        emit RedemptionBurn(redemptionId, holder, msg.sender, amount);
    }

    /// @notice Snapshot for an ordinary transfer, not a guarantee of transaction success.
    /// @dev Excludes operator allowance, pending state changes and transaction execution.
    function canTransfer(address from, address to, uint256 amount) external view returns (bool) {
        return !paused() && from != address(0) && to != address(0)
            && verified[from] && verified[to] && !frozen[from] && !frozen[to]
            && balanceOf(from) >= amount;
    }

    function _requireEligible(address account) internal view {
        if (account == address(0)) revert ZeroAddress();
        if (!verified[account] || frozen[account]) revert IneligibleAddress(account);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        // Mint: recipient only. Burn policy: holder must remain verified and unfrozen.
        // Ordinary transfers (including transferFrom): both endpoints must be eligible.
        if (from != address(0)) _requireEligible(from);
        if (to != address(0)) _requireEligible(to);
        super._update(from, to, value); // ERC20Pausable gates mint, burn AND transfers.
    }
}
