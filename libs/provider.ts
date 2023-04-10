import { ethers, BigNumber, providers, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';
import Web3 from 'web3';
import { CurrentConfig } from '../config';

require('dotenv').config();

const wallet = createWallet();

const mainnetProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.testnet);

// @ts-ignore
export const web3 = new Web3(new Web3.providers.HttpProvider(CurrentConfig.rpc.testnet));

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
  const provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.testnet);

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

/**
 * Sends a transaction and returns the transaction state.
 *
 * @param {ethers.providers.TransactionRequest} transaction - The transaction to send.
 * @returns {Promise<TransactionState>} A promise that resolves to the state of the transaction (Sent or Failed).
 *
 */

export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
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
): Promise<TransactionState> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value);
  }
  const txRes = await wallet.sendTransaction(transaction);

  let receipt = null;
  const provider = ethersProvider;
  if (!provider) {
    return TransactionState.Failed;
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
  if (receipt) {
    return TransactionState.Sent;
  } else {
    return TransactionState.Failed;
  }
}
