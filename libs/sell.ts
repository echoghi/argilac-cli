import { ERC20_ABI, USDC_TOKEN, WETH_TOKEN } from './constants';
import { getLog, saveLog } from './log';
import Logger from './logger';
import { walletAddress } from './provider';
import { executeRoute, generateRoute } from './routing';
import { formatBalance, getTokenBalance, getTokenBalances } from './utils';

export async function sell(price: string) {
  const wethBalance = await getTokenBalance(walletAddress, WETH_TOKEN.address, ERC20_ABI);
  const formattedBalance = await formatBalance(wethBalance, WETH_TOKEN.decimals);
  const hasBalance = formattedBalance > 0.000000000000001;
  const log = getLog();

  if (!hasBalance) {
    Logger.error('Insufficient WETH balance');
  }

  if (!log.positionOpen) {
    Logger.error('No position already open, skipping sell order');
  }

  const route = await generateRoute(WETH_TOKEN, USDC_TOKEN, formattedBalance);

  if (route && hasBalance && log.positionOpen) {
    try {
      const res = await executeRoute(route, WETH_TOKEN);

      const { formattedUSDCBalance, formattedWETHBalance } = await getTokenBalances();

      const lastTradePNL =
        Number(price) * Number(formattedBalance) -
        Number(log.lastTradePrice) * Number(formattedBalance);

      saveLog({
        positionOpen: false,
        usdcBalance: formattedUSDCBalance,
        wethBalance: formattedWETHBalance,
        lastTrade: `Position closed at ${price}`,
        lastTradeTime: `[${new Date().toLocaleString()}]`,
        lastTradePrice: price,
        PNL: log.PNL ? log.PNL + lastTradePNL : lastTradePNL
      });

      Logger.success('Sell order executed');
    } catch (e) {
      Logger.error('Sell order failed');
      console.error(e);
    }
  } else {
    Logger.error('Trade cancelled');
  }
}
