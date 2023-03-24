import { getSMA, getRSI, getMACD } from './libs/ta';

import Logger from './libs/logger';
import { createTrade } from './libs/trading';

const run = async () => {
  // short term sma (10 day)
  const sma1 = await getSMA(10);
  // long term sma (30 day)
  const sma2 = await getSMA(30);
  // 12 hour RSI
  const rsi = await getRSI(12);
  const macd = await getMACD();

  // buy when the short term sma crosses above the long term sma
  const buySignal = macd.value > macd.signal && sma1 > sma2;

  // sell when the short term sma crosses below the long term sma
  const sellSignal = macd.value < macd.signal && sma1 < sma2;

  // If a buy signal is generated, execute a buy trade on Uniswap
  if (buySignal) {
    Logger.info('Buy signal generated');
    const res = await createTrade();

    Logger.info(res);
  }

  // If a sell signal is generated, execute a sell trade on Uniswap
  if (sellSignal) {
    Logger.info('Sell signal generated');
  }

  const ta = {
    sma1,
    sma2,
    rsi,
    macd: macd.value,
    signal: macd.signal
  };

  console.table(ta);
};

run();
