import { ethers } from 'ethers';
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS } from './constants';
import { ethersProvider } from './provider';
import { fromReadableAmount, toReadableAmount } from './utils';
import { Token } from '@uniswap/sdk-core';

export async function quote(toSwap: Token, toRecieve: Token): Promise<string> {
  const quoterContract = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, Quoter.abi, ethersProvider);
  const poolConstants = await getPoolConstants(toSwap, toRecieve);

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(10, toSwap.decimals).toString(),
    0
  );

  return toReadableAmount(quotedAmountOut, toRecieve.decimals);
}

async function getPoolConstants(
  toSwap: Token,
  toRecieve: Token
): Promise<{
  token0: string;
  token1: string;
  fee: number;
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: toRecieve,
    tokenB: toSwap,
    fee: FeeAmount.MEDIUM
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    ethersProvider
  );

  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee()
  ]);

  return {
    token0,
    token1,
    fee
  };
}
