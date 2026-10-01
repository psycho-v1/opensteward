# OpenSteward

A hybrid registry for scientific datasets. It records a content identifier, a steward, a reuse policy, and an append-only status log. It does not store the bytes.

The original hash is never deleted. Retraction, correction, embargo, and community revocation change status. They do not rewrite what was published.

This repository is the contribution surface. The core state machine is small on purpose. Mirrors, credential issuers, and archive adapters are separate modules so later contributors can harden one piece without forking the registry.

## What is in scope

- Dataset identity: content hash, source URI, steward.
- Mirrors: extra content identifiers that keep a dataset resolvable after the source repository shuts down.
- Status: `registered`, `embargoed`, `contact_before_reuse`, `open`, `corrected`, `retracted`, `revoked`.
- Community revocation: a named authority can stop reuse without taking custody of the data.

## What is out of scope

- Storing genomes, health records, or other sensitive bytes.
- Token voting as a source of scientific truth.
- Mainnet deployment. That needs a maintainer with keys and a partner archive.

## Layout

```
core/         status machine and registry rules (the contract of the project)
contracts/    Solidity encoding of the same rules
adapters/     extension points for mirrors and credentials
demo/         browser view of the three acceptance cases
test/         acceptance tests
docs/         architecture and how to add a module
```

## Run the acceptance tests

```bash
node --test test/acceptance.test.js
```

The three tests are the contribution bar:

1. A dataset still resolves after its source repository is marked shut down, if a mirror exists.
2. Retraction changes status and does not erase the original hash.
3. A community authority can revoke reuse. A random address cannot.

## Demo

Open `demo/index.html` in a browser. It runs the same rules in the page. Nothing is uploaded.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). New work should land as an adapter or a test, not as a change to the status meanings, unless an issue explains why the state machine itself is wrong.

License: Apache-2.0. That license covers the code only. Each dataset keeps its own license on the registry entry.
