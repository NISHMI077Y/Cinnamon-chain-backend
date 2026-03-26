const { ethers } = require('ethers');
const logger = require('./logger');
const { SEPOLIA_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS } = require('./env');

const ABI = [
  'function storeResult(bytes32 hash) external',
  'function verifyResult(bytes32 hash) external view returns (bool)',
];

let provider;
let wallet;
let contract;

try {
  provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  wallet = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
  if (CONTRACT_ADDRESS) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
  }
  logger.info('Blockchain provider initialized (Sepolia)');
} catch (err) {
  logger.error(`Blockchain init error: ${err.message}`);
}

module.exports = { provider, wallet, contract, ABI };