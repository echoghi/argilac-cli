import { ERC20_ABI, USDC_TOKEN, WETH_TOKEN } from './constants';
import { getLog, saveLog, trackError } from './log';
import Logger from './logger';
import { walletAddress } from './provider';
import { executeRoute, generateRoute } from './routing';
import { formatBalance, getTokenBalance, getTokenBalances } from './utils';

export async function buy(price: string) {
  const usdcBalance = await getTokenBalance(walletAddress, USDC_TOKEN.address, ERC20_ABI);
  const formattedBalance = await formatBalance(usdcBalance, USDC_TOKEN.decimals);
  const hasBalance = formattedBalance > 0;
  const log = getLog();

  if (log.positionOpen) {
    Logger.error('Position already open, skipping buy order');
  } else if (!hasBalance) {
    Logger.error('Insufficient USDC balance');
  }

  const route = await generateRoute(USDC_TOKEN, WETH_TOKEN, 10);

  if (route && hasBalance && !log.positionOpen) {
    try {
      const res = await executeRoute(route, USDC_TOKEN);

      const { formattedUSDCBalance, formattedWETHBalance } = await getTokenBalances();

      saveLog({
        ...log,
        positionOpen: true,
        usdcBalance: formattedUSDCBalance,
        wethBalance: formattedWETHBalance,
        lastTrade: `Position opened at ${price}`,
        lastTradeTime: `[${new Date().toLocaleString()}]`,
        lastTradePrice: price
      });

      Logger.success('Buy order executed');
    } catch (e) {
      Logger.error('Buy order failed');

      trackError({
        type: 'BUY',
        message: e.message
      });
    }
  } else {
    Logger.error('Trade cancelled');
  }
}
