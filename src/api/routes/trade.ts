import Logger from '../../lib/logger';
import { buy } from '../../lib/buy';
import { sell } from '../../lib/sell';
import { hasGasMoney } from '../../utils';
import sendTelegramAlert from '../../lib/sendTelegramAlert';

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
