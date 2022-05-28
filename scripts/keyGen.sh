#!/bin/bash

npx snarkjs groth16 setup ../$1.r1cs ../$2 $1_0000.zkey
npx snarkjs zkey contribute $1_0000.zkey $1_0001.zkey --name="misterplus" -v
npx snarkjs zkey beacon $1_0001.zkey $1_final.zkey $3 10 -n="Final Beacon phase2"
npx snarkjs zkey export verificationkey $1_final.zkey verification_key.json
