import express from 'express';
import bodyParser from 'body-parser';
import lolcatjs from 'lolcatjs';

import Logger from './lib/logger';
import { run } from './api/routes/trade';

const app = express();
const port = 80;

lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.animate = true;
lolcatjs.options.colors = true;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

/**
 * API route to process a trade signal.
 * Receives the trade type and price as request body parameters, then triggers the run function.
 *
 * @example
 * // Request body format:
 * {
 *   "type": "BUY" | "SELL",
 *   "price": "123.45",
 *   "apiKey": "1234567890"
 * }
 */
app.post('/trade', (req, res) => {
  const type = req?.body?.type;
  const price = req?.body?.price;
  const apiKey = req.body.apiKey;

  // Check if the API key is valid
  if (apiKey !== process.env.API_KEY) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    Logger.error('Invalid API key');
    return;
  }

  lolcatjs.fromString(`Received trade signal: ${type} at ${price}`);

  run(type, price);

  res.status(200).json({ success: true });
});

app.listen(port, () => {
  Logger.info(`Trading bot running at http://localhost:${port}`);
});
