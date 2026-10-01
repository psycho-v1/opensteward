'use strict';

// Extension point. Contributors issue a reuse-policy credential off-chain and
// pass only its hash to Registry.register as policyHash.
class CredentialIssuer {
  async issuePolicy(_terms) {
    throw new Error('CredentialIssuer.issuePolicy is not implemented');
  }
}

module.exports = { CredentialIssuer };
