import Logger from './libs/logger';
import { buy } from './libs/buy';
import { sell } from './libs/sell';
import { hasGasMoney } from './libs/utils';
import sendTelegramAlert from './libs/sendTelegramAlert';

/**
 * Processes buy or sell orders based on the given type, provided there are sufficient gas funds.
 *
 * @param {'BUY' | 'SELL'} type - The type of order, either 'BUY' or 'SELL'.
 * @param {string} price - The price at which the order is being executed.
 */

export const run = async (type: 'BUY' | 'SELL', price: string) => {
  const hasGas = await hasGasMoney();

  if (!hasGas) {
    Logger.error('Insufficient gas funds');
    sendTelegramAlert('Insufficient gas funds');

    return;
  }

  if (type === 'BUY') {
    Logger.info('Processing buy order...');

    await buy(price);
  }

  if (type === 'SELL') {
    Logger.info('Processing sell order...');

    await sell(price);
  }
};
