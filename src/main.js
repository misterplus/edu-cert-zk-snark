const MerkleTree = require('fixed-merkle-tree');

const MERKLE_TREE_HEIGHT = 20;

async function generateMerkleProof(commitment) {
    console.log('Getting contract state...')
    const events = await contract.getPastEvents('Commited', { fromBlock: 0, toBlock: 'latest' })
    const leaves = events
        .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
        .map((e) => e.returnValues.commitment)
    const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves)

    // Find current commitment in the tree
    let depositEvent = events.find((e) => e.returnValues.commitment === commitment)
    let leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1

    // Validate that our data is correct (optional)
    const isValidRoot = await contract.methods.isKnownRoot(toHex(tree.root())).call()
    const isSpent = await contract.methods.isSpent(toHex(deposit.nullifierHash)).call()
    assert(isValidRoot === true, 'Merkle tree is corrupted')
    assert(isSpent === false, 'The note is already spent')
    assert(leafIndex >= 0, 'The deposit is not found in the tree')

    // Compute merkle proof of our commitment
    const { pathElements, pathIndices } = tree.path(leafIndex)
    return { pathElements, pathIndices, root: tree.root() }
}