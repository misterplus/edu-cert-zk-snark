// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHasher {
    function MiMCSponge(
        uint256 xL_in,
        uint256 xR_in,
        uint256 k
    ) external pure returns (uint256 xL, uint256 xR);
}

contract MerkleTreeWithHistory {
    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant ZERO_VALUE = 17870935602538782692476552055299689589933537678236710878293770434123048853704; // = keccak256("PCHEC") % FIELD_SIZE
    IHasher public immutable hasher;

    uint32 public levels;

    // filledSubtrees and roots could be bytes32[size], but using mappings makes it cheaper because
    // it removes index range check on every interaction
    mapping(uint256 => bytes32) public filledSubtrees;
    mapping(uint256 => bytes32) public roots;
    uint32 public constant ROOT_HISTORY_SIZE = 30;
    uint32 public currentRootIndex = 0;
    uint32 public nextIndex = 0;

    constructor(uint32 _levels, IHasher _hasher) {
        require(_levels > 0, "_levels should be greater than zero");
        require(_levels < 32, "_levels should be less than 32");
        levels = _levels;
        hasher = _hasher;

        for (uint32 i = 0; i < _levels; i++) {
            filledSubtrees[i] = zeros(i);
        }

        roots[0] = zeros(_levels - 1);
    }

    /**
     *  @dev Hash 2 tree leaves, returns MiMC(_left, _right)
     */
    function hashLeftRight(bytes32 _left, bytes32 _right) public view returns (bytes32) {
        require(uint256(_left) < FIELD_SIZE, "_left should be inside the field");
        require(uint256(_right) < FIELD_SIZE, "_right should be inside the field");
        uint256 R = uint256(_left);
        uint256 C = 0;
        (R, C) = hasher.MiMCSponge(R, C, 0);
        R = addmod(R, uint256(_right), FIELD_SIZE);
        (R, C) = hasher.MiMCSponge(R, C, 0);
        return bytes32(R);
    }

    function _insert(bytes32 _leaf) internal returns (uint32 index) {
        uint32 _nextIndex = nextIndex;
        require(_nextIndex != uint32(2)**levels, "Merkle tree is full. No more leaves can be added");
        uint32 currentIndex = _nextIndex;
        bytes32 currentLevelHash = _leaf;
        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros(i);
                filledSubtrees[i] = currentLevelHash;
            } else {
                left = filledSubtrees[i];
                right = currentLevelHash;
            }
            currentLevelHash = hashLeftRight(left, right);
            currentIndex /= 2;
        }

        uint32 newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        currentRootIndex = newRootIndex;
        roots[newRootIndex] = currentLevelHash;
        nextIndex = _nextIndex + 1;
        return _nextIndex;
    }

    /**
    @dev Whether the root is present in the root history
    */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
        if (_root == 0) {
            return false;
        }
        uint32 _currentRootIndex = currentRootIndex;
        uint32 i = _currentRootIndex;
        do {
            if (_root == roots[i]) {
                return true;
            }
            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        } while (i != _currentRootIndex);
        return false;
    }

    /**
    @dev Returns the last root
    */
    function getLastRoot() public view returns (bytes32) {
        return roots[currentRootIndex];
    }

    /// @dev provides Zero (Empty) elements for a MiMC MerkleTree. Up to 32 levels
    function zeros(uint256 i) public pure returns (bytes32) {
        if (i == 0) return bytes32(0x278297528E0489446FB78B4CF05099A2EF5FFF5B256E0B54D9761D62C75EA0C8);
        else if (i == 1) return bytes32(0x2f8ce443cd53ba590ef204d2261b2a431601ae8ad56320aec23465bae156b655);
        else if (i == 2) return bytes32(0x0d3d8e0ba091c77cf42d8f7d814fde5cad587c38d864011520fcceff603ba46f);
        else if (i == 3) return bytes32(0x040be9499aaf2bb03424e47d0545cb039b7912b5119be4f465149431a0bde177);
        else if (i == 4) return bytes32(0x1cdc739b33ce58a1ac8b0564e650ba4b5b34322b4c7c7bfae389d403d06a79a1);
        else if (i == 5) return bytes32(0x149e176333a4a369224c26bb2ae9038d8be13590e6328b71725a0b856ca98897);
        else if (i == 6) return bytes32(0x008713ee0292fbc4d666f267de42f52007f6a0c82823189771c7c8c5f309798b);
        else if (i == 7) return bytes32(0x2d5616aa97de9d0c007236195be914f01b34f04530b5bfcc88a59401003b61c9);
        else if (i == 8) return bytes32(0x19bbb4beb9f19185a742e4dea8a07cb83765cb44cad457a55e746db6bd401078);
        else if (i == 9) return bytes32(0x1aabc8e35ac7bbdfc10d431b4995611c70f4a0cebac40b33d024746ff899d8ad);
        else if (i == 10) return bytes32(0x2a9a68e86edf0778caa3357680277f64d7af27f8df89b6a5c678a8235e387bf9);
        else if (i == 11) return bytes32(0x0601524ba16b79f512fd21a5a4666020b4dd793153601927c5a0a506566f3ed7);
        else if (i == 12) return bytes32(0x0df2aa9b3b3a081d58ecf3dc482b180546c5c35cfb2f0608fc796307d0ded38c);
        else if (i == 13) return bytes32(0x1d217b6b567da3e90b686dac06f02e990455736f994fc7aa894be4bdd1323d6e);
        else if (i == 14) return bytes32(0x17cc760ab2b16fd91566eb22a1dd942f9223a4dc6ec6a6f21a915ad04deb98fa);
        else if (i == 15) return bytes32(0x141d24459f51bdacec6f6fb9e6a9cbb5f1b6b8f4ccf083d441472d06066049dc);
        else if (i == 16) return bytes32(0x2f82ed560771587e0aec8f977c5d31cee540ff43b035e6f3509280a9d56c0db5);
        else if (i == 17) return bytes32(0x277c3446cb46d4f9690d16eb5231a8382a85cde3a531724a5ea367237a1d02c1);
        else if (i == 18) return bytes32(0x040ef0834739cf226cabbbb7c42541f5928f61ee405b2b47c0f6a53170c8922d);
        else if (i == 19) return bytes32(0x1488beca15edfd849195ba9f935595d5caea448f7d981ce39ad149988a379d75);
        else if (i == 20) return bytes32(0x2f283d416edb19766b18169703c79b1b40269907b974dbfe6040f1161e423d60);
        else if (i == 21) return bytes32(0x267ae64abbe0ed7edaefd1466cac66e7c9a2ff04815d725d5196ca0488ca2829);
        else if (i == 22) return bytes32(0x22127c8746f816beac9af099e3de9c83c4342dc26a13d0aaa8885af500cb394f);
        else if (i == 23) return bytes32(0x1e9ff002a4fb520782b01eb0d95a1a369704080f37c28a407d9eb5baccb7e906);
        else if (i == 24) return bytes32(0x095aee0cca145adcabef1d13d45ab245b0c422b7ab41537ebf54d0edbdd6bf6e);
        else if (i == 25) return bytes32(0x271ebb3b699c864a6c95b42e2d0b38f790de0b3115e57e593c6d6fff55ecb05e);
        else if (i == 26) return bytes32(0x2c2702681efc2287639a629ea7a2cdb9fe07a1ecda9e2319a4f55b9a35f8d92c);
        else if (i == 27) return bytes32(0x19f5bbc673f79a2631e8030520f8c9e687d62f7a866f11e80b265c76ffa7a657);
        else if (i == 28) return bytes32(0x00c802da704f209cd0689b0824047e8828fadcd59ac2460b2c0e6e8465d76fd4);
        else if (i == 29) return bytes32(0x0589832b99e764c98d2c36cead357f29dab842f6f09d6e56d6e933d1973de498);
        else if (i == 30) return bytes32(0x1fa1dc10f62670f71aedf1f987a9903d7358437f22cf723107ce7a82ab9b09ec);
        else if (i == 31) return bytes32(0x299e71a8c6785f265f2f741edc67a70cd2e0b7e0fb2215c6fa6935b3958309b1);
        else revert("Index out of bounds");
    }
}
