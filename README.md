![Logo](./src/assets/banner.png)

# ⚡️ Argilac ⚡️

An automated crypto trading bot cli that trades based on TradingView alerts. Check out https://github.com/echoghi/argilac for the app version if you prefer to manage your bot with a simple UI.

## Setup Instructions

### 1. Server Setup

1. Install [Ngrok](https://ngrok.com), create an account, and set up an auth token.
2. Create a `.env` file and add the following variables: `MNEMONIC` and `API_KEY`. Generate an api key by running `yarn apiKey`.
3. Create `config.json` & `chainData.json` files in the `./src/config` folder and customize your preferences based on `example.config.json` & `example.chainData.json`. You will need your own rpc url to make trades. See `example.chainData.json` for rpc info on other chains and tokens you can switch to. This file is what enables you to switch chains & tokens by simply swapping values in your main `config.json`. The values in the strategy object define the values used in your trades. "Size" is the percentage of your chosen stablecoin to use per buy (default is 25%). "Slippage" is for the uniswap settings. "Min" is the lower threshold of your stablecoin balance where the bot will stop trading if the balance reaches it (ie. the bot will stop trading if it hits 50 USDC or lower). "Max" is the upper threshold where the bot will stop trading.
4. Start the server by running `yarn server`.
5. Launch Ngrok with `yarn ngrok` to expose your server on port 80.
   > **Note:** TradingView only accepts URLs with port numbers 80 and 443. More info [here](https://www.tradingview.com/support/solutions/43000529348-about-webhooks/)

### 2. TradingView Alerts Setup

1. Open a chart with your desired token pair, select an indicator/strategy, and create buy/sell alerts.
2. In the "Settings" tab of each alert, add `{ type: "BUY", price: "{{close}}", apiKey: "YOUR_KEY" }` for buy alerts and `{ type: "SELL", price: "{{close}}", apiKey: "YOUR_KEY" }` for sell alerts.
3. In the "Notifications" tab, add the URL from your Ngrok output and append "/route" to the end.

### 3. Telegram Bot Setup (Optional)

1. Add @BotFather on Telegram and follow the prompts to obtain an API key.
2. Use "Telegram Bot Raw" to get your unique chat ID.
3. Add your API key as `TELEGRAM_BOT_TOKEN` and chat ID as `TELEGRAM_CHAT_ID` in your `.env` file.
4. The bot will send notifications for buys, sells, errors, and insufficient balance (out of gas) to Telegram. If you don't provide an API key or chat ID, Telegram notifications will be disabled. You can toggle the alerts in `config.json` as well.

### 4. Profit!

Your bot should now be up and running. Monitor buys/sells in the server output or via the optional Telegram bot. You can also receive email notifications directly from TradingView through your alert settings.

> **Note:** Testnet stablecoin/token pair prices may differ from mainnet prices, making strategy testing challenging. It's recommended to backtest strategies on TradingView using Pine Script before deploying. Sample strategies/indicators are available in the `src/pinescript` folder.
