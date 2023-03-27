import {
  AlphaRouter,
  ChainId,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType
} from '@uniswap/smart-order-router';
import { TradeType, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core';
import { CurrentConfig } from '../config';
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
import { ethers } from 'ethers';

export async function generateRoute(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: number
): Promise<SwapRoute | null> {
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

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(amountIn, tokenIn.decimals).toString()
    ),
    tokenOut,
    TradeType.EXACT_INPUT,
    options
  );

  return route;
}

export async function executeRoute(route: SwapRoute, tokenIn: Token): Promise<TransactionState> {
  const provider = getProvider();

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet');
  }

  const tokenApproval = await getTokenTransferApproval(tokenIn);

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const res = await sendTransaction({
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
  });

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
    console.error(e);
    return TransactionState.Failed;
  }
}
