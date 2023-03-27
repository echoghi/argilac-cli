import { ERC20_ABI, USDC_TOKEN, WETH_TOKEN } from './constants';
import { getLog, saveLog, trackError } from './log';
import Logger from './logger';
import { walletAddress } from './provider';
import { executeRoute, generateRoute } from './routing';
import { formatBalance, formatUSD, getTokenBalance, getTokenBalances } from './utils';

export async function sell(price: string) {
  const wethBalance = await getTokenBalance(walletAddress, WETH_TOKEN.address, ERC20_ABI);
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
      const res = await executeRoute(route, WETH_TOKEN);

      const { formattedUSDCBalance, formattedWETHBalance } = await getTokenBalances();

      const lastTradePNL =
        Number(price) * Number(formattedBalance) -
        Number(log.lastTradePrice) * Number(formattedBalance);

      const formattedPNL = formatUSD(lastTradePNL);

      saveLog({
        positionOpen: false,
        usdcBalance: formattedUSDCBalance,
        wethBalance: formattedWETHBalance,
        lastTrade: `Position closed at ${price}`,
        lastTradeTime: `[${new Date().toLocaleString()}]`,
        lastTradePrice: price,
        PNL: log.PNL ? log.PNL + lastTradePNL : lastTradePNL
      });

      if (lastTradePNL > 0) {
        Logger.success(`Sell order executed for a gain of ${formattedPNL}`);
      } else {
        Logger.error(`Sell order executed for a loss of ${formattedPNL}`);
      }
    } catch (e) {
      Logger.error('Sell order failed');

      trackError({
        type: 'SELL',
        message: e.message,
        time: new Date().toLocaleString()
      });
    }
  } else {
    Logger.error('Trade cancelled');
  }
}
