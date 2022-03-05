# Privacy-Centric Higher Education Certificate based on on-chain zk-SNARK (PCHEC)

## Traditional Protocol

### Roles

- Student
- School
- MOE (Ministry of Education)
- Relevant 3rd party
- Irrelevant 3rd party

### Issuerance

1. School submits all student data to MOE.
2. MOE publishes all data received in `1`.
3. School verifies online that all data are correct.
4. MOE registers all data into a central database.

### Verification

1. Student logs into an official website provided by MOE using their citizen ID and a randomly initialized password (which they may change later).

2. Student requests a certificate signed by MOE, which expires after a period of time (default to one month).

3. A relevant 3rd party that received the signed certificate may verify that this certificate is indeed signed by MOE on the official website.

### Invalidation

1. If a school wants to revoke one's certificate, they submit related data to MOE.
2. MOE flags the underlying certificate invalid.

### Potential Cheats, Problems and Privacy Violations

- In `Issuerance-1`
  - An individual in power may submit arbitrary data to MOE.
- In `Issuerance-2`
  - All student data is publicized.
- In `Issuerance-4`
  - An individual in power may store arbitrary data into the database.
  - All student data is internally available for MOE.
- In `Verification-1`
  - Leaking passwords will lead to one's profile data being leaked.
  - The official website may suffer from DDOS attacks.
- In `Verification-2`
  - Leaking of the private key used by MOE will lead to fake certificates being signed.
- In `Verification-3`
  - A fake certificate holder may provide a fake website for verifying their fake certificate.
  - A irrelevant 3rd party that intercepts such a certificate will lead to one's profile data being leaked.

## PCHEC Protocol

### Roles

- Student (Prover)
- School (Aggregator)
- MOE (Signer)
- Relevant 3rd party (Verifier)
- Irrelevant 3rd party (Observer)

### Issuerance

1. Let each student's data be `d(s)`, where `s` is the student.
2. School generates and sends a random secret `n(s)` to each student, calculates `commit(s) = hash(d(s), n(s))`, then generates a zk-proof `lp(s)` for each `commit(s)` without revealing `n(s)`. All `n(s)` are then deleted.
3. MOE generates a one-time private-public key pair, sends the public key to the school. School then aggregates all `commit(s)`, constructs a merkle tree out of them, multi-signs the root hash, then encrypts and submits all `commit(s)`, `lp(s)`, `d(s)` and the multi-signed root hash to MOE.
4. MOE decrypts the data using the private key, reconstructs the merkle tree, verifies the root hash is correct and multi-signed, then publishes all `commit(s)`.
5. School verifies online that all `commit(s)` are correct.
6. MOE multi-signs the root hash and adds all `commit(s)` in that tree to the commitment merkle tree, returning a leaf index `l(commit(s))` for each of them. All the pairing `d(s)` are then deleted.

### Verification

1. Student generates a zk-proof `tp(s)` using their `d(s)`, `n(s)` and a timestamp `t` (for when they want this proof to expire), proving their `commit(s)` belongs to the commitment merkle tree without revealing `n(s)`.
2. A relevant 3rd party generates a one-time private-public key pair, sends the public key to the student. The student then encrypts their `tp(s)`, `d(s)` and `t` with the public key, then sends the encrypted data back to the relevant 3rd party.
3. The relevant 3rd party then decrypts the data with the private key, revealing `tp(s)`, `d(s)` and `t` to themselves. Then they may use these info to interact with the smart contract storing the commitment merkle tree, verifying the underlying certificate.

### Invalidation

1. If a school wants to revoke one's certificate, they reconstruct and multi-sign `hash(d(s))` using `d(s)`. Then submit it to MOE.
2. After MOE multi-signs `hash(d(s))`, it is flaged as blacklisted, any related proof generated will be rendered invalid.

### Solution to Previous Problems

- In `Issuerance-3`
  - An individual in power may submit arbitrary data to MOE.
    - Solution: A commitment must be multi-signed before it's submitted. If one of all `commit(s)` is incorrect, a multi-signer would and should refuse to sign.
- In `Issuerance-4`
  - All student data is publicized.
    - Solution: Revealing `commit(s)` does not reveal anything about `d(s)`.
- In `Issuerance-6`
  - An individual in power may store arbitrary data into the database.
    - Solution: A commitment must be verified and multi-signed before it's added to the merkle tree. If one of all `commit(s)` is incorrect, a multi-signer would and should refuse to sign.
  - All student data is internally available for MOE.
    - Solution: All `d(s)` are deleted after all `commit(s)` have been added to the tree.
- In `Verification-1`
  - Leaking passwords will lead to one's profile data being leaked.
    - Solution: Leaking `n(s)` does not reveal `d(s)`.
  - The official website may suffer from DDOS attacks.
    - Solution: Smart contracts are not vulnerable to DDOS attacks.
- In `Verification-2`
  - Leaking of the private key used by MOE will lead to fake certificates being signed.
    - Solution: Leaking only one of the private keys used by one of the multi-signers would not lead to fake certificates being signed.
- In `Verification-3`
  - A fake certificate holder may provide a fake website for verifying their fake certificate.
    - Solution: Smart Contracts are phishing-resistent.
  - A irrelevant 3rd party that intercepts such a certificate will lead to one's profile data being leaked.
    - Solution: Without the relevant 3rd party's private key, a irrelevant 3rd party cannot reveal the underlying `d(s)`.

### Information Availability

- Student `s` controls `d(s)` permanently.
- School and MOE don't need to store `d(s)`, though they may decide to depending on their needs.
- `d(s)` is only revealed to relevant 3rd parties.
- `n(s)` is only controlled by `s` and not by any other entities.

### Data Immutability

- Once a `commit(s)` is added to the commitment merkle tree, it becomes immutable and cannot be edited or removed.
- In the event of human errors in aggregating `d(s)`, the bad `commit(s)` can be flagged invalid by means described in `Invalidation`.
- Then the school may submit new corrected `commit(s)`, following the same process described in `Issuerance`.

### Technical Information

- Contents of `d(s)` (128-bit)

```json
{
  "id": "uint64", // Citizen ID, 18-digit
  "school": "uint16", // School ID, 5-digit
  "major": "uint16", // Major ID, 2-digit
  "degree": "uint16", // Enum type for degrees, 2-digit
  "year": "uint16" // Year of Graduation, 4-digit
}
```
