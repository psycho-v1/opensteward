'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Registry } = require('../core/registry');

test('dataset still resolves after the source repository is marked shut down', () => {
  const registry = new Registry();
  registry.register({
    id: 'ds-1',
    contentHash: 'sha256:abc',
    sourceUri: 'https://archive.example/ds-1',
    steward: 'steward.eth',
  });
  registry.addMirror('ds-1', 'bafy-mirror-1', 'steward.eth');
  registry.markSourceShutdown('ds-1', 'steward.eth');
  const view = registry.resolve('ds-1');
  assert.equal(view.sourceShutdown, true);
  assert.equal(view.resolvable, true);
  assert.deepEqual(view.mirrors, ['bafy-mirror-1']);
  assert.equal(view.contentHash, 'sha256:abc');
});

test('retraction changes status and does not erase the original hash', () => {
  const registry = new Registry();
  registry.register({
    id: 'ds-2',
    contentHash: 'sha256:def',
    sourceUri: 'https://archive.example/ds-2',
    steward: 'steward.eth',
  });
  registry.setStatus('ds-2', 'retracted', 'steward.eth', 'methods error');
  const view = registry.resolve('ds-2');
  assert.equal(view.status, 'retracted');
  assert.equal(view.contentHash, 'sha256:def');
  assert.equal(view.reuseAllowed, false);
  assert.equal(view.statusLog[0].status, 'registered');
  assert.equal(view.statusLog.at(-1).status, 'retracted');
});

test('a community authority can revoke reuse and a stranger cannot', () => {
  const registry = new Registry();
  registry.register({
    id: 'ds-3',
    contentHash: 'sha256:ghi',
    sourceUri: 'https://archive.example/ds-3',
    steward: 'steward.eth',
  });
  registry.addAuthority('ds-3', 'board.eth', 'steward.eth');
  assert.throws(() => registry.revokeReuse('ds-3', 'stranger.eth', 'no'), /community authority/);
  const view = registry.revokeReuse('ds-3', 'board.eth', 'CARE terms violated');
  assert.equal(view.status, 'revoked');
  assert.equal(view.reuseAllowed, false);
  assert.equal(view.contentHash, 'sha256:ghi');
});
