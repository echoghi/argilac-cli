import Logger from './libs/logger';
import { buy } from './libs/buy';
import { sell } from './libs/sell';

export const run = async (type: 'BUY' | 'SELL', price: string) => {
  if (type === 'BUY') {
    Logger.info('Processing buy order...');

    await buy(price);
  }

  if (type === 'SELL') {
    Logger.info('Processing sell order...');

    await sell(price);
  }
};
