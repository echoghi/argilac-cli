import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { FeeAmount, computePoolAddress } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';

import { POOL_FACTORY_CONTRACT_ADDRESS } from '../constants';
import { getConfig, getProvider } from './provider';
import { getToken } from './token';

interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: ethers.BigNumber;
  liquidity: ethers.BigNumber;
  tick: number;
}

/**
 * Retrieves pool information from a Uniswap V3 pool.
 *
 * @returns {Promise<PoolInfo>} A promise that resolves to an object containing pool information, such as token addresses, fee, tick spacing, liquidity, square root price, and current tick.
 * @throws Will throw an error if the provider is not available.
 */

export async function getPoolInfo(): Promise<PoolInfo> {
  const config = getConfig();
  // @ts-ignore
  const tokenA = getToken(config.tokens.in.symbol);
  // @ts-ignore
  const tokenB = getToken(config.tokens.out.symbol);

  const provider = getProvider();
  if (!provider) {
    throw new Error('No provider');
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA,
    tokenB,
    fee: FeeAmount.MEDIUM
  });

  const poolContract = new ethers.Contract(currentPoolAddress, IUniswapV3PoolABI.abi, provider);

  const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.tickSpacing(),
    poolContract.liquidity(),
    poolContract.slot0()
  ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1]
  };
}
