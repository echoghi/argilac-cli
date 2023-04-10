import { SupportedChainId, Token } from '@uniswap/sdk-core';

// Addresses
export const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
export const QUOTER_CONTRACT_ADDRESS = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e	';
export const WETH_CONTRACT_ADDRESS = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa';
export const WBTC_CONTRACT_ADDRESS = '0x0d787a4a1548f673ed375445535a6c7A1EE56180';
export const MATIC_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000001010';
export const USDC_CONTRACT_ADDRESS = '0xE097d6B3100777DC31B34dC2c58fB524C2e76921';
export const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
export const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

export const WETH_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  WETH_CONTRACT_ADDRESS,
  18,
  'WETH',
  'Wrapped Ether'
);

export const WBTC_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  WBTC_CONTRACT_ADDRESS,
  18,
  'WBTC',
  'Wrapped Bitcoin'
);

export const DAI_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  '0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F',
  18,
  'DAI',
  'DAI Token'
);

export const MATIC_TOKEN = new Token(
  SupportedChainId.POLYGON_MUMBAI,
  MATIC_CONTRACT_ADDRESS,
  18,
  'MATIC',
  'Matic'
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
  'function allowance(address owner, address spender) external view returns (uint256)',

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
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 500;
