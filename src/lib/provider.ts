import { ethers, BigNumber, providers, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import Web3 from 'web3';
import fs from 'fs';

import Logger from './logger';

require('dotenv').config();

export interface Config {
  exchange: string;
  activeChain: {
    name: string;
    rpc: string;
    explorer: string;
    displayName: string;
    currency: string;
    id: number;
  };
  tokens: {
    stablecoin: string;
    amountIn: number;
    token: string;
  };
  strategy: {
    size: number;
    slippage: number;
    min: number;
    max: boolean;
  };
  logs: {
    telegram: boolean;
  };
}

/**
 * Reads config.json
 * @returns {config} user config
 */
export function getConfig(): Config | undefined {
  let config;

  try {
    const configJSON = fs.readFileSync('./src/config/config.json', 'utf-8');
    config = JSON.parse(configJSON);
  } catch (e) {
    Logger.error('Error reading config.json');
  }

  return config;
}

/**
 * Reads chainData.json
 * @returns {chainData}
 */
export function getChainData(): any {
  let data;

  try {
    const configJSON = fs.readFileSync('./src/config/chainData.json', 'utf-8');
    data = JSON.parse(configJSON);
  } catch (e) {
    Logger.error('Error reading chainData.json');
  }

  return data;
}

const config = getConfig();

const wallet = createWallet();

const mainnetProvider = new ethers.providers.JsonRpcProvider(config?.activeChain.rpc);

// @ts-ignore
export const web3 = new Web3(new Web3.providers.HttpProvider(config?.activeChain.rpc));

export const ethersProvider = wallet.provider;

export const walletAddress = wallet.address;

/**
 * Creates an Ethereum wallet instance using a mnemonic from the environment variable.
 *
 * @returns {ethers.Wallet} A wallet instance connected to the specified provider.
 *
 */

export function createWallet(): ethers.Wallet {
  // @ts-ignore
  const wallet = Wallet.fromMnemonic(process.env.MNEMONIC);
  const provider = new ethers.providers.JsonRpcProvider(config?.activeChain.rpc);

  return new ethers.Wallet(wallet.privateKey, provider);
}

export function getProvider(): providers.Provider {
  return ethersProvider;
}

export function getMainnetProvider(): BaseProvider {
  return mainnetProvider;
}

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent'
}

export interface TransactionInfo {
  state: TransactionState;
  hash?: string;
}

/**
 * Sends a transaction and returns the transaction state.
 *
 * @param {ethers.providers.TransactionRequest} transaction - The transaction to send.
 * @returns {Promise<TransactionState>} A promise that resolves to the state of the transaction (Sent or Failed).
 *
 */

export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionInfo> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value);
  }
  return sendTransactionViaWallet(transaction);
}

/**
 * Sends a transaction via a connected wallet and returns the transaction state.
 *
 * @param {ethers.providers.TransactionRequest} transaction - The transaction to send.
 * @returns {Promise<TransactionState>} A promise that resolves to the state of the transaction (Sent or Failed).
 * @throws Will throw an error if the provider is not available.
 *
 */

async function sendTransactionViaWallet(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionInfo> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value);
  }
  let res: TransactionInfo = {
    state: TransactionState.Failed
  };

  const txRes = await wallet.sendTransaction(transaction);

  let receipt = null;
  const provider = ethersProvider;
  if (!provider) {
    return res;
  }

  while (receipt === null) {
    try {
      // @ts-ignore
      receipt = await provider.getTransactionReceipt(txRes.hash);

      if (receipt === null) {
        continue;
      }
    } catch (e) {
      console.log(`Receipt error:`, e);
      break;
    }
  }

  // Transaction was successful if status === 1
  res.state = receipt ? TransactionState.Sent : TransactionState.Failed;
  res.hash = txRes.hash;

  return res;
}
