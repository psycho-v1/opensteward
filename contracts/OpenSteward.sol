// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title OpenSteward
/// @notice Registry of scientific dataset identifiers and status. Bytes stay off-chain.
/// @dev Status names match core/registry.js. contentHash is never cleared.
contract OpenSteward {
    enum Status {
        Registered,
        Embargoed,
        ContactBeforeReuse,
        Open,
        Corrected,
        Retracted,
        Revoked
    }

    struct Dataset {
        bytes32 contentHash;
        string sourceUri;
        address steward;
        bytes32 policyHash;
        Status status;
        bool sourceShutdown;
        bool exists;
    }

    struct LogItem {
        Status status;
        address by;
        string note;
    }

    mapping(bytes32 => Dataset) public datasets;
    mapping(bytes32 => bytes32[]) private mirrors;
    mapping(bytes32 => mapping(address => bool)) public authorities;
    mapping(bytes32 => LogItem[]) private logs;

    event Registered(bytes32 indexed id, bytes32 contentHash, address steward);
    event StatusChanged(bytes32 indexed id, Status status, address by, string note);
    event MirrorAdded(bytes32 indexed id, bytes32 mirrorCid);
    event SourceShutdown(bytes32 indexed id);

    function register(
        bytes32 id,
        bytes32 contentHash,
        string calldata sourceUri,
        bytes32 policyHash
    ) external {
        Dataset storage d = datasets[id];
        require(!d.exists, "exists");
        require(contentHash != bytes32(0), "hash");
        d.contentHash = contentHash;
        d.sourceUri = sourceUri;
        d.steward = msg.sender;
        d.policyHash = policyHash;
        d.status = Status.Registered;
        d.exists = true;
        logs[id].push(LogItem(Status.Registered, msg.sender, "deposited"));
        emit Registered(id, contentHash, msg.sender);
    }

    function addAuthority(bytes32 id, address authority) external {
        Dataset storage d = datasets[id];
        require(d.exists && msg.sender == d.steward, "steward");
        authorities[id][authority] = true;
    }

    function addMirror(bytes32 id, bytes32 mirrorCid) external {
        Dataset storage d = datasets[id];
        require(d.exists, "missing");
        require(msg.sender == d.steward || authorities[id][msg.sender], "role");
        mirrors[id].push(mirrorCid);
        emit MirrorAdded(id, mirrorCid);
    }

    function markSourceShutdown(bytes32 id) external {
        Dataset storage d = datasets[id];
        require(d.exists, "missing");
        require(msg.sender == d.steward || authorities[id][msg.sender], "role");
        d.sourceShutdown = true;
        logs[id].push(LogItem(d.status, msg.sender, "source shutdown"));
        emit SourceShutdown(id);
    }

    function setStatus(bytes32 id, Status status, string calldata note) external {
        Dataset storage d = datasets[id];
        require(d.exists && msg.sender == d.steward, "steward");
        require(status != Status.Revoked && status != Status.Registered, "status");
        d.status = status;
        logs[id].push(LogItem(status, msg.sender, note));
        emit StatusChanged(id, status, msg.sender, note);
    }

    function revokeReuse(bytes32 id, string calldata note) external {
        Dataset storage d = datasets[id];
        require(d.exists && authorities[id][msg.sender], "authority");
        d.status = Status.Revoked;
        logs[id].push(LogItem(Status.Revoked, msg.sender, note));
        emit StatusChanged(id, Status.Revoked, msg.sender, note);
    }

    function resolve(bytes32 id) external view returns (
        bytes32 contentHash,
        Status status,
        bool sourceShutdown,
        bool resolvable,
        bool reuseAllowed,
        uint256 mirrorCount
    ) {
        Dataset storage d = datasets[id];
        require(d.exists, "missing");
        uint256 n = mirrors[id].length;
        contentHash = d.contentHash;
        status = d.status;
        sourceShutdown = d.sourceShutdown;
        resolvable = !d.sourceShutdown || n > 0;
        reuseAllowed = status != Status.Retracted && status != Status.Revoked && status != Status.Embargoed;
        mirrorCount = n;
    }
}
