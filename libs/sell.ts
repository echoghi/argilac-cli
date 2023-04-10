import { ERC20_ABI, USDC_TOKEN, WETH_TOKEN } from './constants';
import { getLog, saveLog, trackError } from './log';
import Logger from './logger';
import { walletAddress } from './provider';
import { executeRoute, generateRoute } from './routing';
import sendTelegramAlert from './sendTelegramAlert';
import { formatBalance, formatUSD, getTokenBalance, getTokenBalances } from './utils';

/**
 * Executes a sell order by swapping WETH for USDC, updates the log, and sends an alert with the result.
 *
 * @param {string} price - The price at which the position is being closed.
 * @throws Will throw an error if the sell order fails or the trade is cancelled.
 */

export async function sell(price: string) {
  const wethBalance = await getTokenBalance(walletAddress, WETH_TOKEN.address, ERC20_ABI);
  const usdcBalance = await getTokenBalance(walletAddress, USDC_TOKEN.address, ERC20_ABI);

  const formattedOldUSDCBalance = await formatBalance(usdcBalance, USDC_TOKEN.decimals);
  const formattedBalance = await formatBalance(wethBalance, WETH_TOKEN.decimals);
  const hasBalance = formattedBalance > 0;
  const log = getLog();

  if (!log.positionOpen) {
    Logger.error('No position currently open, skipping sell order');
  } else if (!hasBalance) {
    Logger.error('Insufficient WETH balance');
  }

  const route = await generateRoute(WETH_TOKEN, USDC_TOKEN, formattedBalance);

  if (route && hasBalance && log.positionOpen) {
    try {
      // Sell all WETH for USDC
      const res = await executeRoute(route, WETH_TOKEN, formattedBalance);

      const { formattedUSDCBalance, formattedWETHBalance } = await getTokenBalances();

      // USDC balance after trade - cost basis - USDC balance before trade
      const lastTradePNL = formattedUSDCBalance - 10 - formattedOldUSDCBalance;

      const formattedTradePNL = formatUSD(lastTradePNL);
      const PNL = log.PNL ? log.PNL + lastTradePNL : lastTradePNL;

      saveLog({
        positionOpen: formattedWETHBalance > 0,
        usdcBalance: formattedUSDCBalance,
        wethBalance: formattedWETHBalance,
        lastTrade: `Position closed at ${price}`,
        lastTradeTime: `[${new Date().toLocaleString()}]`,
        lastTradePrice: price,
        PNL
      });

      if (lastTradePNL > 0) {
        const message = `Position closed at ${price} for a gain of ${formattedTradePNL} - Total P&L: ${formatUSD(
          PNL
        )}`;
        sendTelegramAlert(message);
        Logger.success(message);
      } else {
        const message = `Position closed at ${price} for a loss of ${formattedTradePNL} - Total P&L: ${formatUSD(
          PNL
        )}`;
        sendTelegramAlert(message);
        Logger.error(message);
      }
    } catch (e) {
      Logger.error('Sell order failed');

      sendTelegramAlert('Sell order failed');

      trackError({
        type: 'SELL',
        message: e.message
      });
    }
  } else {
    Logger.error('Trade cancelled');
  }
}
