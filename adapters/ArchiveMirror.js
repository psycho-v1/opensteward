'use strict';

// Extension point. Contributors implement pin() for IPFS, a federated node,
// or an institutional copy, then call registry.addMirror with the resulting CID.
class ArchiveMirror {
  async pin(_contentHash) {
    throw new Error('ArchiveMirror.pin is not implemented');
  }
}

module.exports = { ArchiveMirror };
