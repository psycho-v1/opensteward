# Architecture

OpenSteward separates three layers so contributors do not have to touch all of them.

## Registry

The registry stores:

- `contentHash`: the hash of the deposited object. Immutable.
- `sourceUri`: where the bytes were first published.
- `mirrors`: later content identifiers. A shutdown of `sourceUri` does not remove these.
- `policyHash`: hash of an off-chain reuse policy or verifiable credential. The policy document is not stored here.
- `status`: the current scientific status.
- `statusLog`: append-only. The previous status remains readable.

Resolving a dataset returns the original hash even when status is `retracted` or `revoked`. Callers must check `reuseAllowed` before reuse.

## Authority

Each dataset has a steward and a set of community authorities. The steward can attach mirrors and set embargo, contact-before-reuse, open, and corrected. A community authority can revoke reuse. Neither role is a token balance.

## Adapters

`adapters/ArchiveMirror.js` and `adapters/CredentialIssuer.js` are interfaces. A contribution implements `pin` or `issuePolicy` and calls the registry. The registry does not know whether the mirror is IPFS, a federated node, or an institutional copy.

## Permanence

The log is permanent about what was claimed. The status is mutable about what the community now believes. That split is the whole point of the status machine.
