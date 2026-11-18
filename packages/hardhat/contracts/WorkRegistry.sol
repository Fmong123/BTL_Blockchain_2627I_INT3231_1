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

    mapping(bytes32 => Work) public works;

    event WorkRegistered(bytes32 indexed fileHash, address indexed registrant, uint256 registeredAt);

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

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
