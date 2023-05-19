import { generateRandomHash } from '../utils';
import Logger from './logger';

function genApiKey() {
  const hash = generateRandomHash();

  return hash.slice(2);
}

const apiKey = genApiKey();

Logger.info(`API Key: ${apiKey}`);
