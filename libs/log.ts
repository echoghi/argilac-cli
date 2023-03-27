import fs from 'fs';

import Logger from './logger';

interface Log {
  positionOpen: boolean;
  usdcBalance: number;
  wethBalance: number;
  lastTrade?: string;
  lastTradeTime?: string;
  lastTradePrice?: string;
  PNL?: number;
}

export function getLog(): Log {
  let log;

  try {
    const logJSON = fs.readFileSync('./log.json', 'utf-8');
    log = JSON.parse(logJSON);
  } catch (e) {
    Logger.error('Error reading log.json');
  }

  return log;
}

export function saveLog(newLog: Log) {
  try {
    fs.writeFileSync(`./log.json`, JSON.stringify(newLog, null, 2));

    Logger.info('Updated state:');
    Logger.table(newLog);
  } catch (e) {
    Logger.error('Error saving log.json');
  }
}
