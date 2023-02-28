import Web3 from 'web3';
import { ethers } from 'ethers';
import {
  ChainId,
  Fetcher,
  Token,
  TokenAmount,
  Pair,
  WETH,
  Route,
  Trade,
  TradeType
} from '@uniswap/sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import Logger from './utils/logger';

const privateKey = 'YOUR_PRIVATE_KEY';
// Provider URL for Polygon testnet
const provider = new JsonRpcProvider('https://endpoints.omniatech.io/v1/matic/mumbai/public');
const wallet = new Wallet(privateKey, provider);

const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const weth = new Token(ChainId.MAINNET, wethAddress, 18, 'WETH', 'Wrapped Ether');
const usdc = new Token(ChainId.MAINNET, usdcAddress, 6, 'USDC', 'USD Coin');

const smaDaysToSell = 50;
const smaDaysToBuy = 100;

async function getWethPrice(): Promise<number> {
  const wethUsdcPair = await Fetcher.fetchPairData(weth, usdc, provider);
  const wethUsdcRoute = new Route([wethUsdcPair], weth);
  const price = parseFloat(wethUsdcRoute.midPrice.toSignificant(6));
  Logger.info(price);
  return price;
}

async function getWethSMA(days: number): Promise<number> {
  const wethPriceHistory = await Fetcher.fetchTokenData(
    ChainId.MAINNET,
    wethAddress,
    provider,
    'WETH',
    'Wrapped Ether'
  );
  Logger.info(wethPriceHistory);
  const wethSMA =
    wethPriceHistory.reduce((sum, data) => sum + parseFloat(data.price.toSignificant(6)), 0) / days;
  return wethSMA;
}

async function run() {
  provider.on('block', async () => {
    Logger.info(`Listening on new block, waiting...`);

    const wethPrice = await getWethPrice();
    const wethSma50 = await getWethSMA(smaDaysToSell);

    Logger.info(`WETH price: ${wethPrice}`);
    Logger.info(`WETH SMA 50 days: ${wethSma50}`);

    if (wethPrice < wethSma50) {
      Logger.info('Selling WETH for USDC...');
      const wethUsdcPair = await Fetcher.fetchPairData(weth, usdc, provider);
      const route = new Route([wethUsdcPair], weth);
      const trade = new Trade(route, new TokenAmount(weth, 100), TradeType.EXACT_INPUT);
      const tx = await wallet.sendTransaction({
        to: trade.route.pairs[0].liquidityToken.address,
        data: '',
        value: trade.inputAmount.raw.toString(),
        gasPrice: await provider.getGasPrice(),
        gasLimit: 500000
      });
      Logger.success(`Transaction sent: ${tx.hash}`);
    } else {
      const wethSma100 = await getWethSMA(smaDaysToBuy);
      Logger.info(`WETH SMA 100 days: ${wethSma100}`);

      if (wethPrice > wethSma100) {
        Logger.info('Buying WETH with USDC...');
        const usdcWethPair = await Fetcher.fetchPairData(usdc, weth, provider);
        const route = new Route([usdcWethPair], usdc);
        const trade = new Trade(route, new TokenAmount(usdc, 100), TradeType.EXACT_INPUT);
        const tx = await wallet.sendTransaction({
          to: trade.route.pairs[0].liquidityToken.address,
          data: '',
          value: 0,
          gasPrice: await provider.getGasPrice(),
          gasLimit: 500000,
          from: wallet.address
        });

        Logger.success(`Transaction sent: ${tx.hash}`);
      } else {
        Logger.info('No action required.');
      }
    }
  });
}

getWethPrice();
