import { Token } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

import { USDC_TOKEN, WETH_TOKEN } from './libs/constants';

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
    in: Token; // Token to buy and speculate on
    amountIn: number; // Percentage of equity to use for trade
    out: Token; // Token to hold in between trades
    poolFee: number; // Gas fee for the trade
  };
}

export const CurrentConfig: ExampleConfig = {
  rpc: {
    testnet: process.env.RPC_TESTNET,
    mainnet: process.env.RPC_MAINNET
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: 10,
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM
  }
};
