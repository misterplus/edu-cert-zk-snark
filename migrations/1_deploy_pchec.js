const Hasher = artifacts.require('Hasher');
const CertVerifier = artifacts.require('CertVerifier');
const MultiSignedSubmission = artifacts.require('MultiSignedSubmission');

module.exports = function (deployer, network, accounts) {
  deployer
    .deploy(Hasher)
    .then(() => deployer.deploy(CertVerifier))
    .then(() =>
      deployer.deploy(
        MultiSignedSubmission,
        [accounts[0], accounts[1]],
        20, Hasher.address, CertVerifier.address
      )
    );
}