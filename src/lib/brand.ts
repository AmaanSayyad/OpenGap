export const BRAND = "Opengap";
export const TAGLINE = "Buy tokenized stocks when they're cheaper";
export const LOGO_SRC = "/opengap.png";
export const SITE_URL = "https://opengap.vercel.app";
export const GITHUB_URL = "https://github.com/AmaanSayyad/OpenGap";

export const GLOSSARY = {
  tape: "Tape is the live price on Jupiter — what you actually pay if you buy right now.",
  mark: "Mark is the official reference price from the issuer (PreStocks, or Yahoo on listed names). It is not a quote you can lift.",
  book: "Book is the old name for your portfolio: SOL, USDC, and any lots you hold, with live dollar values. The app now says Portfolio everywhere.",
  green: "Green means tape is cheaper than mark. That gap is the trade.",
} as const;
