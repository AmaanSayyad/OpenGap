import { PLATFORM_FEE_BPS, PLATFORM_FEE_WALLET } from "@/lib/constants";

export const TOKEN_MINT = "Fvto3QgSLbcWdq331BoR66RDkT7dZYgTS9JzbntMf7rD";
export const TOKEN_SYMBOL = "OPENGAP";
export const TOKEN_NAME = "OpenGap";
export const TOKEN_URL = `https://clawpump.tech/tokens/${TOKEN_MINT}`;
export const TOKEN_DEXSCREENER = `https://dexscreener.com/solana/${TOKEN_MINT}`;
export const TOKEN_DEXSCREENER_NOTE =
  "DexScreener paid by a community member.";
export const TOKEN_GMGN = `https://gmgn.ai/sol/token/${TOKEN_MINT}`;
export const TOKEN_DEXSCREENER_EMBED =
  "https://dexscreener.com/solana/65m5eb4WW7w18HJQ9CbzHR1gqUMor8RrmH1dKP2S8wLn?embed=1&loadChartSettings=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15";
export const TOKEN_GMGN_EMBED = `https://www.gmgn.cc/kline/sol/${TOKEN_MINT}?theme=dark&interval=15`;
export const TOKEN_PUMP = `https://pump.fun/coin/${TOKEN_MINT}`;
export const TOKEN_SOLSCAN = `https://solscan.io/token/${TOKEN_MINT}`;
export const ANSEMHACK_URL = "https://clawpump.tech/ansemhack";

export const PUMP_POOL = {
  name: "OPENGAP / SOL",
  dex: "pumpswap",
  base: "OPENGAP",
  quote: "SOL",
  quoteMint: "So11111111111111111111111111111111111111112",
  pairAddress: "65m5eb4WW7w18HJQ9CbzHR1gqUMor8RrmH1dKP2S8wLn",
  url: "https://dexscreener.com/solana/65m5eb4WW7w18HJQ9CbzHR1gqUMor8RrmH1dKP2S8wLn",
  note: "Graduated from the ClawPump / pump.fun curve to PumpSwap. Same mint. Not a second coin.",
} as const;

export const STOCK_POOL = {
  name: "OPENGAP / SPACEX",
  dex: "dammv2",
  base: "OPENGAP",
  quote: "SPACEX",
  quoteMint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
  pairAddress: "Fck8ZewjPmcvY9KZAiQiXx81y7Y8Lr52HLY15kquPqsB",
  url: "https://app.meteora.ag/dammv2/Fck8ZewjPmcvY9KZAiQiXx81y7Y8Lr52HLY15kquPqsB",
  signature:
    "5tk6b3iz7nWbVjE8zNv6xnHW2Lqvc5XRFUsJYhymJVf3DU6TrX478X4YHJYDGCBSapKERzxrJAJCuX2YsMoeU5Pr",
  note: "Stock-paired Meteora DAMM for the Stocklana bounty. Secondary to the PumpSwap SOL pool. Not a second memecoin.",
} as const;

export const POOL_URL = PUMP_POOL.url;

export const FOUNDER = {
  name: "Amaan Sayyad",
  role: "CEO",
  bio: "Blockchain developer and entrepreneur. 42+ hackathon wins, 25+ shipped Web3 products, CEO of OpenGap. Builds desks that turn on-chain prices into a trade.",
  x: "https://x.com/amaanbiz",
  github: "https://github.com/AmaanSayyad",
  linkedin: "https://www.linkedin.com/in/amaan-sayyad-/",
  portfolio: "https://amaan-sayyad-portfolio.vercel.app/",
  proof: "https://docs.google.com/document/d/1WQXjpoRdcEHiq3BiVaAT3jXeBmI9eFvKelK9EWdWOQA/edit?usp=sharing",
} as const;

export const TEAM = [
  FOUNDER,
  { name: "Abdulmajid Hassan", role: "Chief Community Manager" },
  { name: "Konan", role: "Chief Design Officer" },
  { name: "VR", role: "Chief Graphic Officer" },
  { name: "Draheem", role: "Chief Motion Video Designer" },
] as const;

export const TOKEN_UTILITY = [
  "AnsemHack entry ticket — the same mint, launched on ClawPump and now graduated to PumpSwap. Judges verify against @Open_Gap.",
  "Desk revenue is the 1% Jupiter platform fee on every buy and sell. $OPENGAP creator fees stay with the project. The token is not equity.",
  "The agent never mints again. A human already launched this mint on purpose.",
  "DexScreener was paid by a community member. Discord is the room.",
  "Stake $OPENGAP on /stake — 30/90/180/360 days at matching APY. Send to the vault; locks show in Portfolio.",
] as const;

export const BUSINESS = [
  `Every Jupiter buy and sell on the desk takes ${PLATFORM_FEE_BPS / 100}% — shown on the ticket, already netted in the quote.`,
  `Fees collect in USDC or SOL at ${PLATFORM_FEE_WALLET}.`,
  "$OPENGAP creator fees stay with the project. The token is membership, not a second swap tax and not equity.",
] as const;

export const ROADMAP = [
  "1% platform fee is live on every Jupiter fill. Keep it disclosed.",
  "Funded agent buys −3% PreStock / Tessera lots on Jupiter and posts the signature.",
  "More issuer names as they list. Tighter inventory and a kill-switch on the skill.",
] as const;

export const MARKET = [
  "Tokenized private and listed names now trade 24/7 on Solana. PreStocks, Tessera, and xStocks print a live Jupiter price that often sits away from the issuer mark.",
  "That gap is a real market: wallets already hold the mint, Jupiter already quotes it, and nobody has a simple desk that says “buy only when live is cheaper than official.”",
  "OpenGap sells that desk — and a public agent that can lift a $5 lot when the print is at least 3% green.",
] as const;

export const GTM = [
  "Judges: live tape at opengap.xyz, pitch deck, demo video, public agent, this mint graduated to PumpSwap.",
  "Distribution: @Open_Gap, Telegram, Discord, the pitch deck, the demo video, and the deepest green name on the tape.",
  "Users: Phantom in, one Jupiter lot, 1% platform fee, fill in History. Not a US brokerage.",
] as const;
