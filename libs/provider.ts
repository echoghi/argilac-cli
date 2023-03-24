import { ethers, BigNumber, Wallet } from 'ethers';
import Web3 from 'web3';

require('dotenv').config();

const wallet = createWallet();

// @ts-ignore
export const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ALCHEMY_RPC_TESTNET));

export const ethersProvider = wallet.provider;

export const walletAddress = wallet.address;

function createWallet(): ethers.Wallet {
  // @ts-ignore
  const wallet = Wallet.fromMnemonic(process.env.MNEMONIC);
  const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_RPC_TESTNET);

  return new ethers.Wallet(wallet.privateKey, provider);
}

export function getProvider() {
  return ethersProvider;
}

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent'
}

export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value);
  }
  return sendTransactionViaWallet(transaction);
}

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
