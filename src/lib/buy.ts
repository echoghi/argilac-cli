import { ERC20_ABI } from '../constants';
import { getLog, saveLog, saveTrade, trackError } from './log';
import Logger from './logger';
import { getConfig, walletAddress } from './provider';
import { executeRoute, generateRoute } from './routing';
import sendTelegramAlert from './sendTelegramAlert';
import {
  formatBalance,
  generateRandomHash,
  getBuyAmount,
  getTokenBalance,
  getTokenBalances
} from '../utils';
import { getToken } from './token';

/**
 * Executes a buy order by swapping a stablecoin for a token, updates the log, and sends an alert with the result.
 *
 * @param {string} price - The price at which the position is being opened.
 * @throws Will throw an error if the buy order fails or the trade is cancelled.
 */

export async function buy(price: string) {
  const config = getConfig();
  const chain = config?.activeChain.displayName;
  // @ts-ignore
  const stablecoin = getToken(config?.tokens.stablecoin);
  // @ts-ignore
  const token = getToken(config?.tokens.token);

  const usdcBalance = await getTokenBalance(walletAddress, stablecoin.address, ERC20_ABI);
  const formattedBalance = await formatBalance(usdcBalance, stablecoin.decimals);
  // @ts-ignore
  const hasBalance = formattedBalance > config.strategy.min;
  const log = getLog();

  if (log?.positionOpen) {
    Logger.error('Position already open, skipping buy order');

    trackError({
      type: 'ORDER_CONFLICT',
      message: 'Buy order recieved, but a position is already open',
      chain
    });
  } else if (!hasBalance) {
    Logger.error('Insufficient USDC balance');
  }

  const tradeAmount = getBuyAmount(formattedBalance);

  const route = await generateRoute(stablecoin, token, tradeAmount);

  if (route && hasBalance && !log.positionOpen) {
    try {
      const res = await executeRoute(route, stablecoin, tradeAmount);

      if (!res.hash) return;

      const { formattedStablecoinBalance, formattedTokenBalance } = await getTokenBalances();

      saveLog({
        ...log,
        positionOpen: formattedTokenBalance > 0,
        stablecoinBalance: formattedStablecoinBalance,
        tokenBalance: formattedTokenBalance,
        lastTrade: `Position opened at ${price}`,
        lastTradeTime: `[${new Date().toLocaleString()}]`,
        lastTradePrice: price
      });

      const randomHash = generateRandomHash();
      const link = `${config?.activeChain.explorer}tx/${res.hash}`;

      saveTrade({
        key: randomHash,
        type: 'Buy',
        price,
        date: new Date().toLocaleString(),
        in: `${formattedTokenBalance} ${token.symbol}`,
        out: `${tradeAmount} ${stablecoin.symbol}`,
        link,
        chain
      });

      sendTelegramAlert(
        `Position opened at ${price} (${formattedTokenBalance.toFixed(5)} WETH). ${link}`
      );

      Logger.success(`Buy order executed: ${link}`);
    } catch (e: any) {
      Logger.error('Buy order failed');

      sendTelegramAlert('Buy order failed');

      trackError({
        type: 'BUY',
        message: e.message,
        chain
      });
    }
  } else {
    Logger.error('Trade cancelled');
  }
}
