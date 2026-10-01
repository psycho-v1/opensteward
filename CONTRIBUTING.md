# Contributing

OpenSteward is meant to get stronger by addition. The status machine in `core/registry.js` and `contracts/OpenSteward.sol` is the shared contract. Extend it from the edges.

## Ways to contribute

- An archive adapter that maps a real repository shutdown notice to `markSourceShutdown`.
- A mirror adapter that pins a content identifier and reports the mirror CID.
- A credential checker that verifies a reuse policy without putting personal data on-chain.
- A test that fails if a new change deletes a content hash or lets a non-authority revoke.
- Documentation that a repository operator can follow.

Issues labeled `good first issue` are reserved for a single module and a test.

## Rules

- Do not store dataset bytes in this repository.
- Do not add token-weighted governance. Weight follows the named steward and the named community authority.
- Do not erase `contentHash` in any status transition.
- Keep Solidity and the JavaScript core on the same status names. If you add a status, change both and add a test.
- Open a pull request against `main`. Fill in the test plan.

## Local check

```bash
node --test test/acceptance.test.js
```

No install is required for the core tests.
