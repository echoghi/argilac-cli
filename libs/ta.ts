import Logger from './logger';

const apiKey = process.env.POLYGON_API_KEY;

// https://polygon.io/docs/crypto/get_v1_indicators_sma__cryptoticker
export const getSMA = async (window: number) => {
  let data;

  try {
    const res = await fetch(
      `https://api.polygon.io/v1/indicators/sma/X:ETHUSD?timespan=day&window=${window}&series_type=close&order=desc&apiKey=${apiKey}`
    );
    data = await res.json();
  } catch (err) {
    Logger.error('Error fetching SMA data');
  }

  return data?.results?.values.pop().value;
};

// https://polygon.io/docs/crypto/get_v1_indicators_rsi__cryptoticker
export const getRSI = async (window: number) => {
  let data;

  try {
    const res = await fetch(
      `https://api.polygon.io/v1/indicators/rsi/X:ETHUSD?timespan=hour&window=${window}&series_type=close&order=desc&apiKey=${apiKey}`
    );
    data = await res.json();
  } catch (err) {
    Logger.error('Error fetching RSI data');
  }

  return data?.results?.values.pop().value;
};

// https://polygon.io/docs/crypto/get_v1_indicators_ema__cryptoticker
export const getMACD = async () => {
  let data;

  try {
    const res = await fetch(
      `https://api.polygon.io/v1/indicators/macd/X:ETHUSD?timespan=day&short_window=12&long_window=26&signal_window=14&series_type=close&order=desc&apiKey=${apiKey}`
    );
    data = await res.json();
  } catch (err) {
    Logger.error('Error fetching MACD data');
  }

  return data?.results?.values.pop();
};
