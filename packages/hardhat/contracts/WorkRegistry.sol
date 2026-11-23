// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract WorkRegistry is Ownable, Pausable {
    enum WorkType {
        Image,
        Audio,
        Document
    }

    uint256 public constant MAX_TITLE_BYTES = 256;
    uint256 public constant MAX_DESCRIPTION_BYTES = 2048;

    struct Work {
        address registrant;
        uint256 registeredAt;
        string title;
        string description;
        WorkType workType;
    }

    struct License {
        bytes32 fileHash;
        address licensor;
        address licensee;
        uint256 grantedAt;
        uint256 expiresAt;
        bool revoked;
    }

    mapping(bytes32 => Work) public works;
    mapping(uint256 => License) public licenses;
    mapping(bytes32 => mapping(address => uint256)) public latestLicenseId;
    uint256 public licenseCount;

    error WorkNotRegistered(bytes32 fileHash);
    error NotWorkRegistrant(address caller);
    error InvalidLicensee(address licensee);
    error InvalidExpiration(uint256 expiresAt);
    error ActiveLicenseExists(uint256 licenseId);
    error LicenseNotFound(uint256 licenseId);
    error LicenseAlreadyRevoked(uint256 licenseId);

    event WorkRegistered(bytes32 indexed fileHash, address indexed registrant, uint256 registeredAt);
    event LicenseGranted(
        uint256 indexed licenseId,
        bytes32 indexed fileHash,
        address indexed licensee,
        address licensor,
        uint256 grantedAt,
        uint256 expiresAt
    );
    event LicenseRevoked(
        uint256 indexed licenseId,
        bytes32 indexed fileHash,
        address indexed licensee,
        uint256 revokedAt
    );

    constructor(address admin) Ownable(admin) {}

    function registerWork(
        bytes32 fileHash,
        string calldata title,
        string calldata description,
        WorkType workType
    ) external whenNotPaused {
        require(fileHash != bytes32(0), "Empty hash");
        require(bytes(title).length > 0, "Empty title");
        require(bytes(title).length <= MAX_TITLE_BYTES, "Title too long");
        require(bytes(description).length <= MAX_DESCRIPTION_BYTES, "Description too long");
        require(works[fileHash].registrant == address(0), "Already registered");

        works[fileHash] = Work(msg.sender, block.timestamp, title, description, workType);

        emit WorkRegistered(fileHash, msg.sender, block.timestamp);
    }

    function grantLicense(
        bytes32 fileHash,
        address licensee,
        uint256 expiresAt
    ) external whenNotPaused returns (uint256 licenseId) {
        address registrant = works[fileHash].registrant;
        if (registrant == address(0)) revert WorkNotRegistered(fileHash);
        if (msg.sender != registrant) revert NotWorkRegistrant(msg.sender);
        if (licensee == address(0) || licensee == registrant) revert InvalidLicensee(licensee);
        if (expiresAt <= block.timestamp) revert InvalidExpiration(expiresAt);

        uint256 previousId = latestLicenseId[fileHash][licensee];
        if (isLicenseValid(previousId)) revert ActiveLicenseExists(previousId);

        licenseId = ++licenseCount;
        licenses[licenseId] = License(fileHash, registrant, licensee, block.timestamp, expiresAt, false);
        latestLicenseId[fileHash][licensee] = licenseId;
        emit LicenseGranted(licenseId, fileHash, licensee, registrant, block.timestamp, expiresAt);
    }

    // Revocation remains available during a pause, including for an expired license.
    function revokeLicense(uint256 licenseId) external {
        License storage license = licenses[licenseId];
        if (license.licensee == address(0)) revert LicenseNotFound(licenseId);
        if (msg.sender != works[license.fileHash].registrant) revert NotWorkRegistrant(msg.sender);
        if (license.revoked) revert LicenseAlreadyRevoked(licenseId);

        license.revoked = true;
        emit LicenseRevoked(licenseId, license.fileHash, license.licensee, block.timestamp);
    }

    function isLicenseValid(uint256 licenseId) public view returns (bool) {
        License storage license = licenses[licenseId];
        return license.licensee != address(0) && !license.revoked && block.timestamp < license.expiresAt;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
