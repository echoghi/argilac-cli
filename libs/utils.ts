import { Token, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';
import { BigNumber, ethers } from 'ethers';
import { ERC20_ABI, MATIC_TOKEN, USDC_TOKEN, WETH_TOKEN } from './constants';
import { getProvider, walletAddress } from './provider';

const MAX_DECIMALS = 4;

export function fromReadableAmount(amount: number, decimals: number): BigNumber {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, MAX_DECIMALS);
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}

export async function getTokenBalance(address, tokenAddress, abi) {
  const provider = getProvider();
  const tokenContract = new ethers.Contract(tokenAddress, abi, provider);

  const balance = await tokenContract.balanceOf(address);

  return Number(balance);
}

export async function formatBalance(balance, decimals) {
  let formattedBalance = Number(ethers.utils.formatUnits(`${balance}`, decimals));

  // Check if positive balance is just "dust"
  if (formattedBalance <= 0.000000000000001) {
    formattedBalance = 0;
  }

  return formattedBalance;
}

export async function getTokenBalances() {
  const updatedUSDCBalance = await getTokenBalance(walletAddress, USDC_TOKEN.address, ERC20_ABI);
  const updatedWETHBalance = await getTokenBalance(walletAddress, WETH_TOKEN.address, ERC20_ABI);

  const formattedUSDCBalance = await formatBalance(updatedUSDCBalance, USDC_TOKEN.decimals);
  const formattedWETHBalance = await formatBalance(updatedWETHBalance, WETH_TOKEN.decimals);

  return {
    usdcBalance: updatedUSDCBalance,
    wethBalance: updatedWETHBalance,

    formattedUSDCBalance,
    formattedWETHBalance
  };
}

export async function hasGasMoney() {
  const maticBalance = await getTokenBalance(walletAddress, MATIC_TOKEN.address, ERC20_ABI);

  const formattedBalance = await formatBalance(maticBalance, MATIC_TOKEN.decimals);
  const hasBalance = formattedBalance >= 1;

  return hasBalance;
}

export function formatUSD(amount: number): string {
  const formattedNumber = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return formattedNumber;
}
