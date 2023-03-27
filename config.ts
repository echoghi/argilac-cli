import { Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

import {
  AAVE_TOKEN,
  DAI_TOKEN,
  MATIC_TOKEN,
  USDC_TOKEN,
  WBTC_TOKEN,
  WETH_TOKEN,
  WMATIC_TOKEN
} from './libs/constants';

require('dotenv').config();

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
  WALLET_EXTENSION
}

// Inputs that configure this example to run
export interface ExampleConfig {
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
  rpc: {
    testnet: process.env.RPC_TESTNET,
    mainnet: process.env.RPC_MAINNET
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: 1,
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM
  }
};
