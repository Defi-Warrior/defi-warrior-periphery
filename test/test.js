const bytecode = require('@defi-warrior/core/build/UniswapV2Pair.json').bytecode
const keccak256 = require('@ethersproject/solidity').keccak256

const COMPUTED_INIT_CODE_HASH = keccak256(['bytes'], [`0x${bytecode}`])

console.log(COMPUTED_INIT_CODE_HASH)