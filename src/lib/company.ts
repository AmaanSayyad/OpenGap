export const TOKEN_MINT = "Fvto3QgSLbcWdq331BoR66RDkT7dZYgTS9JzbntMf7rD";
export const TOKEN_SYMBOL = "OPENGAP";
export const TOKEN_NAME = "OpenGap";
export const TOKEN_URL = `https://clawpump.tech/tokens/${TOKEN_MINT}`;
export const TOKEN_SOLSCAN = `https://solscan.io/token/${TOKEN_MINT}`;
export const ANSEMHACK_URL = "https://clawpump.tech/ansemhack";

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
  note: "Stock-paired Meteora DAMM for the Stocklana ClawPump bounty. Not a second memecoin.",
} as const;

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
  "AnsemHack entry ticket — the live ClawPump token judges can verify against @Open_Gap.",
  "Creator fees from $OPENGAP stay with the project. The desk is the product; the token is not equity.",
  "The agent never mints again. A human already launched this mint on purpose.",
] as const;

export const ROADMAP = [
  "Funded agent buys −3% PreStock / Tessera lots on Jupiter and posts the signature.",
  "More issuer names as they list. Tighter inventory and a kill-switch on the skill.",
  "Token stays the fee-share / membership line — not a second product, not a US stock.",
] as const;

export const MARKET = [
  "Tokenized private and listed names now trade 24/7 on Solana. PreStocks, Tessera, and xStocks print a live Jupiter price that often sits away from the issuer mark.",
  "That gap is a real market: wallets already hold the mint, Jupiter already quotes it, and nobody has a simple desk that says “buy only when live is cheaper than official.”",
  "OpenGap sells that desk — and a public agent that can lift a $5 lot when the print is at least 3% green.",
] as const;

export const GTM = [
  "Judges: live tape at opengap.xyz, public agent, this mint on ClawPump.",
  "Distribution: @Open_Gap, Telegram, and the deepest green name on the tape.",
  "Users: Phantom in, one Jupiter lot, fill in History. Not a US brokerage.",
] as const;
