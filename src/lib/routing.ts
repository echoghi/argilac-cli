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
  walletAddress,
  TransactionInfo,
  getConfig
} from './provider';
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  ERC20_ABI,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  V3_SWAP_ROUTER_ADDRESS
} from '../constants';
import { checkAllowance, fromReadableAmount } from '../utils';
import Logger from './logger';
import { trackError } from './log';

export async function generateRoute(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: number
): Promise<SwapRoute | null> {
  let route = null;
  const config = getConfig();

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
  } catch (e: any) {
    Logger.error('Failed to generate route for swap');

    trackError({
      type: 'GEN_ROUTE',
      message: e.message,
      chain: config?.activeChain.displayName
    });
  }

  return route;
}

export async function executeRoute(
  route: SwapRoute,
  tokenIn: Token,
  tradeAmount: number
): Promise<TransactionInfo> {
  const config = getConfig();
  const provider = getProvider();
  let res: TransactionInfo = {
    state: TransactionState.Failed
  };

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet');
  }

  // Get approval for token transfer if needed
  const tokenApproval = await getTokenTransferApproval(tokenIn, tradeAmount);

  // Fail if transfer approvals do not go through
  if (tokenApproval.state !== TransactionState.Sent) {
    return res;
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
  } catch (e: any) {
    Logger.error('Failed to execute route for swap');

    trackError({
      type: 'EXEC_ROUTE',
      message: e.message,
      chain: config?.activeChain.displayName
    });
  }

  return res;
}

export async function getTokenTransferApproval(
  token: Token,
  tradeAmount?: number
): Promise<TransactionInfo> {
  const config = getConfig();
  const provider = getProvider();
  const address = walletAddress;

  let res: TransactionInfo = {
    state: TransactionState.Failed
  };

  if (!provider || !address) {
    Logger.error('No Provider Found');
    return res;
  }

  try {
    const tradeSize = tradeAmount || TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER;
    const approvedAmount = await checkAllowance(address, token);

    // If the approved amount is greater than the trade size, we don't need to approve again
    if (approvedAmount >= tradeSize) {
      res.state = TransactionState.Sent;
      return res;
    } else {
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

      const transaction = await tokenContract.populateTransaction.approve(
        V3_SWAP_ROUTER_ADDRESS,
        fromReadableAmount(
          tradeAmount || TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
          token.decimals
        ).toString()
      );

      return sendTransaction({
        ...transaction,
        from: address
      });
    }
  } catch (e: any) {
    Logger.error('Failed to get token approval for swap');

    trackError({
      type: 'TOKEN_APPROVAL',
      message: e.message,
      chain: config?.activeChain.displayName
    });

    return res;
  }
}
