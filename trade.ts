import Logger from './libs/logger';
import { buy } from './libs/buy';
import { sell } from './libs/sell';
import { hasGasMoney } from './libs/utils';
import sendTelegramAlert from './libs/sendTelegramAlert';

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
