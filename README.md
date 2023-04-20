![Logo](./src/assets/banner.png)

# ⚡️ argilac ⚡️

Crypto trading bot that buys/sells spot based on alerts from TradingView.

> ⚠️ **Under Construction:** ⚠️ Argilac works fine out of the box, but some values such as the active RPC endpoint, token contract addresses, and active token pairs in `buy.ts` and `sell.ts` are hardcoded. The current configuration will trade WETH/USDC on the Polygon Mumbai testnet. If you wish to change this, you will have to refactor these hardcoded values in addition to updating the config file. Updates will come soon when I find the time.

#### Setup Server

1. Create an [Ngrok](https://ngrok.com) account and setup an auth token.
2. Set up a `.env` file with the following variables `RPC_MAINNET`, `RPC_TESTNET`, `MNEMONIC`.
3. Check your preferences in `config.ts`. You can set the tokens you wish to buy/sell between here. You can choose to trade live or on the testnet.
   > **Note:** The bot defaults to the Polygon Mumbai testnet trading WETH/USDC, but any EVM chain will work just fine provided that Uniswap pools have liquidity for the token pair you choose. I recommend Polygon or EVM L2s for cheap transactions.
4. Start your server with `yarn server`.
5. Start ngrok with `yarn ngrok` to expose your server to the web on port 80.
   > **Note:** TradingView only accepts URLS with port numbers 80 and 443. More info [here](https://www.tradingview.com/support/solutions/43000529348-about-webhooks/)

#### Setup TradingView Alerts

1. Open the chart with the token pair of your choice, choose an indicator/strategy, and create alerts for buying/selling.
2. In the "Settings" tab of the alert, add the json `{ type: "BUY", price: "{{close}}" }` to your buy alert and `{ type: "SELL", price: "{{close}}" }` to your sell alert.
3. In the "Notifications" tab of the alert add the url provided by your ngrok output and append "/route" to the end.

#### Set up Telegram bot (optional)

1. Add @BotFather on telegram and follow the prompts. You will receive an api key.
2. Add "Telegram Bot Raw" to receive your unique chat id.
3. Add your api key as `TELEGRAM_BOT_TOKEN` and your chat id as `TELEGRAM_CHAT_ID` in your env.
4. Your buys, sells, errors, and insufficient balance (bot is out of gas) notifications will be sent to telegram. If you omitted the api key or chat id, telegram notifications will be turned off.

#### Profit!

Your bot should now be up and running. You can see buys/sells in the server output. I recommend using the telegram bot to keep track of trades, but you can also receive an email straight from TradingView with your alert settings.

> **Note:** Prices for testnet stablecoin/token pairs may not reflect mainnet reality. This makes testing strategies difficult, so I recommend backtesting your strategies on TradingView with pinescript before deploying. You can find some sample strategies/indicators in the pinescript folder.
