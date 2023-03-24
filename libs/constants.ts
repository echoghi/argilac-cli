import { SupportedChainId, Token } from '@uniswap/sdk-core';

// Addresses
export const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
export const QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
export const WETH_CONTRACT_ADDRESS = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa';
export const MATIC_CONTRACT_ADDRESS = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889';
export const USDC_CONTRACT_ADDRESS = '0xE097d6B3100777DC31B34dC2c58fB524C2e76921';
export const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

export const WETH_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  WETH_CONTRACT_ADDRESS,
  18,
  'WETH',
  'Wrapped Ether'
);

export const MATIC_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  MATIC_CONTRACT_ADDRESS,
  18,
  'MATIC',
  'MATIC'
);

export const USDC_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  USDC_CONTRACT_ADDRESS,
  6,
  'USDC',
  'USD//C'
);

export const ERC20_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)'
];

export const WETH_ABI = [
  // Wrap ETH
  'function deposit() payable',

  // Unwrap ETH
  'function withdraw(uint wad) public'
];

// Transactions

export const MAX_FEE_PER_GAS = 100000000000;
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000;
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000;
