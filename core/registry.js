'use strict';

const STATUSES = Object.freeze([
  'registered',
  'embargoed',
  'contact_before_reuse',
  'open',
  'corrected',
  'retracted',
  'revoked',
]);

const STEWARD_STATUSES = new Set([
  'embargoed',
  'contact_before_reuse',
  'open',
  'corrected',
  'retracted',
]);

class RegistryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RegistryError';
  }
}

class Registry {
  constructor() {
    this.datasets = new Map();
  }

  register({ id, contentHash, sourceUri, steward, license, policyHash }) {
    if (!id || !contentHash || !steward) {
      throw new RegistryError('id, contentHash, and steward are required');
    }
    if (this.datasets.has(id)) {
      throw new RegistryError('dataset already registered');
    }
    const entry = {
      id,
      contentHash,
      sourceUri: sourceUri || '',
      steward,
      license: license || 'unspecified',
      policyHash: policyHash || '',
      status: 'registered',
      sourceShutdown: false,
      mirrors: [],
      authorities: new Set(),
      statusLog: [{ status: 'registered', by: steward, note: 'deposited', at: Date.now() }],
    };
    this.datasets.set(id, entry);
    return this.view(id);
  }

  addAuthority(id, authority, by) {
    const entry = this.#must(id);
    this.#mustBe(by, entry.steward, 'only the steward can add an authority');
    entry.authorities.add(authority);
    return this.view(id);
  }

  addMirror(id, mirrorCid, by) {
    const entry = this.#must(id);
    this.#mustStewardOrAuthority(entry, by, 'only a steward or authority can add a mirror');
    if (!mirrorCid) throw new RegistryError('mirrorCid is required');
    entry.mirrors.push({ cid: mirrorCid, by, at: Date.now() });
    return this.view(id);
  }

  markSourceShutdown(id, by) {
    const entry = this.#must(id);
    this.#mustStewardOrAuthority(entry, by, 'only a steward or authority can mark shutdown');
    entry.sourceShutdown = true;
    entry.statusLog.push({ status: entry.status, by, note: 'source shutdown', at: Date.now() });
    return this.view(id);
  }

  setStatus(id, status, by, note) {
    const entry = this.#must(id);
    if (!STATUSES.includes(status)) throw new RegistryError('unknown status');
    if (status === 'revoked') {
      throw new RegistryError('use revokeReuse for community revocation');
    }
    if (!STEWARD_STATUSES.has(status)) {
      throw new RegistryError('status cannot be set directly');
    }
    this.#mustBe(by, entry.steward, 'only the steward can set this status');
    entry.status = status;
    entry.statusLog.push({ status, by, note: note || '', at: Date.now() });
    return this.view(id);
  }

  revokeReuse(id, by, note) {
    const entry = this.#must(id);
    if (!entry.authorities.has(by)) {
      throw new RegistryError('only a community authority can revoke reuse');
    }
    entry.status = 'revoked';
    entry.statusLog.push({ status: 'revoked', by, note: note || 'reuse revoked', at: Date.now() });
    return this.view(id);
  }

  resolve(id) {
    return this.view(id);
  }

  view(id) {
    const entry = this.#must(id);
    const reuseAllowed = entry.status !== 'retracted' && entry.status !== 'revoked' && entry.status !== 'embargoed';
    return {
      id: entry.id,
      contentHash: entry.contentHash,
      sourceUri: entry.sourceUri,
      steward: entry.steward,
      license: entry.license,
      policyHash: entry.policyHash,
      status: entry.status,
      sourceShutdown: entry.sourceShutdown,
      mirrors: entry.mirrors.map((m) => m.cid),
      resolvable: !entry.sourceShutdown || entry.mirrors.length > 0,
      reuseAllowed,
      statusLog: entry.statusLog.map((e) => ({ ...e })),
    };
  }

  #must(id) {
    const entry = this.datasets.get(id);
    if (!entry) throw new RegistryError('unknown dataset');
    return entry;
  }

  #mustBe(actor, expected, message) {
    if (actor !== expected) throw new RegistryError(message);
  }

  #mustStewardOrAuthority(entry, actor, message) {
    if (actor !== entry.steward && !entry.authorities.has(actor)) {
      throw new RegistryError(message);
    }
  }
}

module.exports = { Registry, RegistryError, STATUSES };
