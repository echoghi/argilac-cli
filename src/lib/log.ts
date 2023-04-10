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

interface Error {
  type: string;
  message: string;
  time?: string;
}

/**
 * Reads and returns the contents of the log.json file.
 *
 * @returns {Log} An object containing the log data.
 *
 */

export function getLog(): Log {
  let log;

  try {
    const logJSON = fs.readFileSync('./logs/log.json', 'utf-8');
    log = JSON.parse(logJSON);
  } catch (e) {
    Logger.error('Error reading log.json');
  }

  return log;
}

/**
 * Saves the provided log data to the log.json file.
 *
 * @param {Log} newLog - An object containing the log data to be saved.
 *
 */
export function saveLog(newLog: Log) {
  try {
    fs.writeFileSync(`./logs/log.json`, JSON.stringify(newLog, null, 2));
  } catch (e) {
    Logger.error('Error saving log.json');
  }
}

/**
 * Reads error-log.json and returns an array of error objects.
 * @returns {Error[]} An array of error objects.
 */
export function getErrorLog(): Error[] {
  let errors = [];

  try {
    const logJSON = fs.readFileSync('./logs/error-log.json', 'utf-8');
    errors = JSON.parse(logJSON);
  } catch (e) {
    Logger.error('Error reading error-log.json');
  }

  return errors;
}

/**
 * Adds an error object to error-log.json.
 * @param {Error} error - The error object to be added.
 */
export function trackError(error: Error) {
  try {
    const errors = getErrorLog();
    errors.push({
      time: new Date().toLocaleString(),
      ...error
    });

    fs.writeFileSync(`./logs/error-log.json`, JSON.stringify(errors, null, 2));
  } catch (e) {
    Logger.error('Error saving log.json');
  }
}
