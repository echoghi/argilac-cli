import { Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

import { MATIC_TOKEN, USDC_TOKEN, WETH_TOKEN } from './libs/constants';

require('dotenv').config();

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
  WALLET_EXTENSION
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment;
  rpc: {
    testnet: string | undefined;
    mainnet: string | undefined;
  };
  tokens: {
    in: Token;
    amountIn: number;
    out: Token;
    poolFee: number;
  };
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.LOCAL,
  rpc: {
    testnet: process.env.ALCHEMY_RPC_TESTNET,
    mainnet: process.env.ALCHEMY_RPC_MAINNET
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: 5,
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM
  }
};
