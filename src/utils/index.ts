import { Token, TradeType } from '@uniswap/sdk-core';
import { Trade } from '@uniswap/v3-sdk';
import { BigNumber, ethers } from 'ethers';
import { ERC20_ABI, V3_SWAP_ROUTER_ADDRESS } from '../constants';
import { getProvider, ethersProvider, walletAddress, getConfig } from '../lib/provider';
import { getToken } from '../lib/token';

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
  abi: any,
  provider: ethers.providers.Provider = getProvider()
): Promise<number> {
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
  const config = getConfig();
  // @ts-ignore
  const stablecoin = getToken(config?.tokens.stablecoin);
  // @ts-ignore
  const token = getToken(config?.tokens.token);

  const updatedStableBalance = await getTokenBalance(walletAddress, stablecoin.address, ERC20_ABI);
  const updatedTokenBalance = await getTokenBalance(walletAddress, token.address, ERC20_ABI);

  const formattedStablecoinBalance = await formatBalance(updatedStableBalance, stablecoin.decimals);
  const formattedTokenBalance = await formatBalance(updatedTokenBalance, token.decimals);

  return {
    stablecoinBalance: updatedStableBalance,
    tokenBalance: updatedTokenBalance,

    formattedStablecoinBalance,
    formattedTokenBalance
  };
}

/**
 * Checks if the wallet has enough balance in the native currency to cover gas fees.
 *
 * @returns A promise that resolves to a boolean indicating whether the wallet has enough gas money.
 */
export async function hasGasMoney(): Promise<boolean> {
  const config = getConfig();

  let hasBalance = false;

  // @ts-ignore
  if (config?.activeChain.currency === 'MATIC') {
    // @ts-ignore
    const nativeToken = getToken(config?.activeChain.currency);
    const maticBalance = await getTokenBalance(walletAddress, nativeToken.address, ERC20_ABI);

    const formattedBalance = await formatBalance(maticBalance, nativeToken.decimals);

    hasBalance = formattedBalance >= 0.5;
  } else {
    // get eth balance
    const ethBalance = await ethersProvider.getBalance(walletAddress);
    const formattedBalance = await formatBalance(ethBalance, 18);

    hasBalance = formattedBalance >= 0.03;
  }

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
  const config = getConfig();

  if (!config) return 0;

  const size = config.strategy.size > 1 ? 1 : config.strategy.size;

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

/**
 * Generates a random hash
 */
export function generateRandomHash() {
  // Generate a random byte array of length 32
  const randomBytes = ethers.utils.randomBytes(32);

  // Create a hash using the keccak256 function
  const randomHash = ethers.utils.keccak256(randomBytes);

  return randomHash;
}
