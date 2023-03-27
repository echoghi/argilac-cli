import {
  AlphaRouter,
  ChainId,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType
} from '@uniswap/smart-order-router';
import { TradeType, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

import {
  getMainnetProvider,
  sendTransaction,
  TransactionState,
  getProvider,
  walletAddress
} from './provider';
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  ERC20_ABI,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  V3_SWAP_ROUTER_ADDRESS
} from './constants';
import { fromReadableAmount } from './utils';
import Logger from './logger';
import { trackError } from './log';

export async function generateRoute(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: number
): Promise<SwapRoute | null> {
  let route;

  try {
    const router = new AlphaRouter({
      chainId: ChainId.POLYGON_MUMBAI,
      provider: getMainnetProvider()
    });

    const options: SwapOptionsSwapRouter02 = {
      recipient: walletAddress,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02
    };

    route = await router.route(
      CurrencyAmount.fromRawAmount(
        tokenIn,
        fromReadableAmount(amountIn, tokenIn.decimals).toString()
      ),
      tokenOut,
      TradeType.EXACT_INPUT,
      options
    );
  } catch (e) {
    Logger.error('Failed to generate route for swap');

    trackError({
      type: 'GEN_ROUTE',
      message: e.message
    });
  }

  return route;
}

export async function executeRoute(route: SwapRoute, tokenIn: Token): Promise<TransactionState> {
  const provider = getProvider();
  let res;

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet');
  }

  const tokenApproval = await getTokenTransferApproval(tokenIn);

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  try {
    res = await sendTransaction({
      data: route.methodParameters?.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: route?.methodParameters?.value,
      from: walletAddress,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    });
  } catch (e) {
    Logger.error('Failed to execute route for swap');

    trackError({
      type: 'EXEC_ROUTE',
      message: e.message
    });
  }

  return res;
}

export async function getTokenTransferApproval(token: Token): Promise<TransactionState> {
  const provider = getProvider();
  const address = walletAddress;
  if (!provider || !address) {
    console.log('No Provider Found');
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

    const transaction = await tokenContract.populateTransaction.approve(
      V3_SWAP_ROUTER_ADDRESS,
      fromReadableAmount(TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, token.decimals).toString()
    );

    return sendTransaction({
      ...transaction,
      from: address
    });
  } catch (e) {
    Logger.error('Failed to get token approval for swap');

    trackError({
      type: 'TOKEN_APPROVAL',
      message: e.message
    });

    return TransactionState.Failed;
  }
}
