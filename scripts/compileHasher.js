const path = require('path');
const fs = require('fs');
const genContract = require('circomlibjs').mimcSpongecontract;


const outputPath = path.join(__dirname, '..', 'build', "contracts", 'Hasher.json');

function main() {
  const contract = {
    contractName: 'Hasher',
    abi: genContract.abi,
    bytecode: genContract.createCode('mimcsponge', 220),
  }

  fs.writeFileSync(outputPath, JSON.stringify(contract));
}

main();
