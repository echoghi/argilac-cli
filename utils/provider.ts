import { ethers } from 'ethers';
import Web3 from 'web3';

require('dotenv').config();

// @ts-ignore
export const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_ENDPOINT));

export const ethersProvider = new ethers.providers.JsonRpcProvider(process.env.INFURA_ENDPOINT);
