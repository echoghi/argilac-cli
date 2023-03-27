import express from 'express';
import bodyParser from 'body-parser';
import lolcatjs from 'lolcatjs';

import Logger from './libs/logger';
import { run } from './trade';

const app = express();
const port = 80;

lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.animate = true;
lolcatjs.options.colors = true;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/trade', (req, res) => {
  const type = req?.body?.type;
  const price = req?.body?.price;

  lolcatjs.fromString(`Received trade signal: ${type} at ${price}`);

  run(type, price);

  res.status(200).json({ success: true });
});

app.listen(port, () => {
  Logger.info(`Trading bot running at http://localhost:${port}`);
});
