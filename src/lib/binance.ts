import { createHmac } from "node:crypto";

const BINANCE = "https://api.binance.com";

async function signedGet(path: string, extra = "") {
  const key = process.env.BINANCE_API_KEY;
  const secret = process.env.BINANCE_API_SECRET;
  if (!key || !secret) {
    throw new Error("BINANCE_API_KEY / BINANCE_API_SECRET are not set");
  }

  const query = `timestamp=${Date.now()}${extra ? `&${extra}` : ""}`;
  const signature = createHmac("sha256", secret).update(query).digest("hex");
  const response = await fetch(`${BINANCE}${path}?${query}&signature=${signature}`, {
    cache: "no-store",
    headers: { "X-MBX-APIKEY": key },
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

export async function getBinanceStatus() {
  const [account, usdc, btc] = await Promise.all([
    signedGet("/api/v3/account", "omitZeroBalances=true").catch((error) => ({
      ok: false,
      status: 0,
      payload: { error: error instanceof Error ? error.message : "signed failed" },
    })),
    fetch(`${BINANCE}/api/v3/ticker/price?symbol=USDCUSDT`, { cache: "no-store" }).then(
      (response) => response.json() as Promise<{ price?: string }>,
    ),
    fetch(`${BINANCE}/api/v3/ticker/price?symbol=BTCUSDT`, { cache: "no-store" }).then(
      (response) => response.json() as Promise<{ price?: string }>,
    ),
  ]);

  const balances = Array.isArray(
    (account.payload as { balances?: Array<{ asset: string; free: string }> }).balances,
  )
    ? (account.payload as { balances: Array<{ asset: string; free: string }> }).balances
        .filter((row) => Number(row.free) > 0)
        .slice(0, 8)
    : [];

  const payload = account.payload as {
    canTrade?: boolean;
    msg?: string;
    code?: number;
  };

  return {
    signed: account.ok,
    signedStatus: account.status,
    signedError: account.ok ? null : payload.msg ?? null,
    canTrade: Boolean(payload.canTrade),
    balances,
    usdcUsd: Number(usdc.price) || null,
    btcUsd: Number(btc.price) || null,
    note: "Pyth Pro is skipped. Public Binance + Yahoo + DexScreener + CoinGecko feed the basis.",
  };
}
