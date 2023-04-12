import { Token, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';
import { BigNumber, ethers } from 'ethers';
import {
  ERC20_ABI,
  MATIC_TOKEN,
  USDC_TOKEN,
  V3_SWAP_ROUTER_ADDRESS,
  WETH_TOKEN
} from '../constants';
import { getProvider, ethersProvider, walletAddress } from '../lib/provider';
import { CurrentConfig } from '../config';

const MAX_DECIMALS = 4;

/**
 * Converts a human-readable amount to a BigNumber based on the specified number of decimals.
 *
 * @param amount The human-readable amount to convert.
 * @param decimals The number of decimals in the token's value.
 * @returns A BigNumber representing the converted amount.
 */
export function fromReadableAmount(amount: number, decimals: number): BigNumber {
  const fixedAmount = Number(amount.toFixed(decimals));
  return ethers.utils.parseUnits(fixedAmount.toString(), decimals);
}

/**
 * Converts a raw amount to a human-readable string based on the specified number of decimals.
 *
 * @param rawAmount The raw amount to convert.
 * @param decimals The number of decimals in the token's value.
 * @returns A formatted string representing the human-readable amount.
 */
export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.utils.formatUnits(rawAmount, decimals).slice(0, MAX_DECIMALS);
}

/**
 * Formats a trade object into a readable string, displaying the input and output amounts with their respective currency symbols.
 *
 * @param trade The trade object containing input and output amounts and their currencies.
 * @returns A formatted string representing the trade with input and output amounts and currency symbols.
 */
export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`;
}

/**
 * Retrieves the token balance for a given address and token contract.
 *
 * @param address The address of the user whose token balance you want to retrieve.
 * @param tokenAddress The address of the token contract.
 * @param abi The ABI of the token contract.
 * @returns A promise that resolves to the token balance as a number.
 */
export async function getTokenBalance(
  address: string,
  tokenAddress: string,
  abi: any
): Promise<number> {
  const provider = getProvider();
  const tokenContract = new ethers.Contract(tokenAddress, abi, provider);

  const balance = await tokenContract.balanceOf(address);

  return Number(balance);
}

/**
 * Formats a balance value as a human-readable number based on the specified number of decimals.
 *
 * @param balance The balance value as a BigNumberish.
 * @param decimals The number of decimals in the token's value.
 * @returns A promise that resolves to the formatted balance as a number.
 */
export async function formatBalance(
  balance: ethers.BigNumberish,
  decimals: number
): Promise<number> {
  let formattedBalance = Number(ethers.utils.formatUnits(`${balance}`, decimals));

  // Check if positive balance is just "dust"
  if (formattedBalance <= 0.000000000000001) {
    formattedBalance = 0;
  }

  return formattedBalance;
}

/**
 * Retrieves the token balances for USDC and WETH tokens for the wallet address.
 *
 * @returns A promise that resolves to an object containing the raw and formatted balances for USDC and WETH tokens.
 */
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

/**
 * Checks if the wallet has enough balance in MATIC to cover gas fees.
 *
 * @returns A promise that resolves to a boolean indicating whether the wallet has enough gas money.
 */
export async function hasGasMoney(): Promise<boolean> {
  const maticBalance = await getTokenBalance(walletAddress, MATIC_TOKEN.address, ERC20_ABI);

  const formattedBalance = await formatBalance(maticBalance, MATIC_TOKEN.decimals);
  const hasBalance = formattedBalance >= 1;

  return hasBalance;
}

export function formatUSD(amount: number): string {
  const formattedNumber = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return formattedNumber;
}

/**
 * Calculates the buy amount based on the given balance and the configured strategy size.
 *
 * @param balance The available balance to calculate the buy amount.
 * @returns The calculated buy amount, considering the configured strategy size.
 */
export function getBuyAmount(balance: number): number {
  const size = CurrentConfig.strategy.size > 1 ? 1 : CurrentConfig.strategy.size;

  return balance * size;
}

/**
 * This function checks the token allowance for a given address and token.
 *
 * @param address The address of the user whose token allowance you want to check.
 * @param token The token object containing the token contract address.
 * @returns A promise that resolves to the allowance value.
 */
export async function checkAllowance(address: string, token: Token): Promise<number> {
  const tokenContract = new ethers.Contract(token.address, ERC20_ABI, ethersProvider);

  const allowance = await tokenContract.allowance(address, V3_SWAP_ROUTER_ADDRESS);

  return Number(ethers.utils.formatUnits(allowance, token.decimals));
}

/**
 * Sends the entire ETH balance of a wallet to another address.
 * @param {ethers.Wallet} wallet - The wallet instance containing the ETH to be sent.
 * @param {string} toAddress - The destination address for the ETH transfer.
 * @returns {Promise<ethers.providers.TransactionReceipt>} The transaction receipt for the successful transfer.
 * @throws {Error} If the transaction fails or there is an insufficient ETH balance.
 */
export async function sendEntireEthBalance(
  wallet: ethers.Wallet,
  toAddress: string
): Promise<ethers.providers.TransactionReceipt> {
  const balance = await wallet.getBalance();

  if (balance.isZero()) {
    throw new Error('Insufficient ETH balance in the wallet.');
  }

  const gasPrice = await wallet.provider.getGasPrice();
  const gasLimit = ethers.BigNumber.from(21000); // Gas limit for a simple ETH transfer
  const gasCost = gasPrice.mul(gasLimit);

  if (balance.lt(gasCost)) {
    throw new Error('Insufficient ETH balance to cover the gas cost for the transaction.');
  }

  const amountToSend = balance.sub(gasCost);
  const transaction = {
    to: toAddress,
    value: amountToSend,
    gasLimit,
    gasPrice
  };

  const txResponse = await wallet.sendTransaction(transaction);
  const txReceipt = await wallet.provider.waitForTransaction(txResponse.hash);

  return txReceipt;
}
