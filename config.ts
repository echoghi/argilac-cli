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

export enum Environment {
  LOCAL,
  MAINNET
}

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
