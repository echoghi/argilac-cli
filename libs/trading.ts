import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';
import {
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade
} from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import JSBI from 'jsbi';

import { getPoolInfo } from './pool';
import { sendTransaction, TransactionState, walletAddress, ethersProvider } from './provider';
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
} from './constants';
import { fromReadableAmount } from './utils';
import Logger from './logger';
import { CurrentConfig } from '../config';

export type TokenTrade = Trade<Token, Token, TradeType>;

// Trading Functions
export async function createTrade(): Promise<TokenTrade> {
  const poolInfo = await getPoolInfo();

  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    FeeAmount.MEDIUM,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  const swapRoute = new Route([pool], CurrentConfig.tokens.in, CurrentConfig.tokens.out);

  const amountOut = await getOutputQuote(swapRoute);

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(CurrentConfig.tokens.amountIn, CurrentConfig.tokens.in.decimals).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(CurrentConfig.tokens.out, JSBI.BigInt(amountOut)),
    tradeType: TradeType.EXACT_INPUT
  });

  return uncheckedTrade;
}

export async function executeTrade(trade: TokenTrade): Promise<TransactionState> {
  const provider = ethersProvider;

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet');
  }

  // Give approval to the router to spend the token
  const tokenApproval = await getTokenTransferApproval(CurrentConfig.tokens.in);

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed;
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress
  };

  const methodParameters = SwapRouter.swapCallParameters([trade], options);

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
  };

  const res = await sendTransaction(tx);

  return res;
}

// Helper Quoting and Pool Functions
async function getOutputQuote(route: Route<Currency, Currency>) {
  const provider = ethersProvider;

  if (!provider) {
    throw new Error('Provider required to get pool state');
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(CurrentConfig.tokens.amountIn, CurrentConfig.tokens.in.decimals).toString()
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true
    }
  );

  let quoteCallReturnData;

  try {
    quoteCallReturnData = await provider.call({
      to: QUOTER_CONTRACT_ADDRESS,
      data: calldata
    });
  } catch (e) {
    Logger.error(e.message);
  }

  return quoteCallReturnData
    ? ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
    : 0;
}

export async function checkTokenTransferApproval(token: Token): Promise<TransactionState> {
  const provider = ethersProvider;
  const address = walletAddress;
  if (!provider || !address) {
    Logger.error('No Provider Found');
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

    const transaction = await tokenContract.populateTransaction.allowance(
      walletAddress,
      SWAP_ROUTER_ADDRESS
    );

    return sendTransaction({
      ...transaction,
      from: address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    });
  } catch (e) {
    Logger.error(e);
    return TransactionState.Failed;
  }
}

export async function getTokenTransferApproval(token: Token): Promise<TransactionState> {
  const provider = ethersProvider;
  const address = walletAddress;
  if (!provider || !address) {
    Logger.error('No Provider Found');
    return TransactionState.Failed;
  }

  try {
    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      fromReadableAmount(TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, token.decimals).toString()
    );

    return sendTransaction({
      ...transaction,
      from: address
    });
  } catch (e) {
    Logger.error(e);
    return TransactionState.Failed;
  }
}
