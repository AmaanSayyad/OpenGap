import {
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  CpAmm,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  getBaseFeeParams,
  getDynamicFeeParams,
  getSqrtPriceFromPrice,
  type PoolFeesParams,
} from "@meteora-ag/cp-amm-sdk";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { STOCK_POOL, TOKEN_MINT } from "@/lib/company";
import { USDC_MINT, WSOL_MINT } from "@/lib/constants";
import { getJupiterQuote } from "@/lib/jupiter";
import {
  executeServerSwap,
  getTestKeypair,
  getWalletStatus,
} from "@/lib/server-wallet";

const SPACEX_MINT = STOCK_POOL.quoteMint;
const POOL_RPC = "https://api.mainnet-beta.solana.com";

async function tokenHolding(connection: Connection, owner: PublicKey, mint: string) {
  const result = await connection.getParsedTokenAccountsByOwner(owner, {
    mint: new PublicKey(mint),
  });
  return result.value.reduce(
    (sum, account) => {
      const token = account.account.data.parsed?.info?.tokenAmount;
      return {
        ui: sum.ui + (typeof token?.uiAmount === "number" ? token.uiAmount : 0),
        raw: sum.raw.add(new BN(token?.amount ?? "0")),
      };
    },
    { ui: 0, raw: new BN(0) },
  );
}

function tokenProgramOf(owner: PublicKey) {
  return owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;
}

export async function createStockPairedPool() {
  const connection = new Connection(POOL_RPC, "confirmed");
  const payer = getTestKeypair();
  const wallet = await getWalletStatus();
  const cpAmm = new CpAmm(connection);

  const tokenAMint = new PublicKey(TOKEN_MINT);
  const tokenBMint = new PublicKey(SPACEX_MINT);

  const [tokenAInfo, tokenBInfo] = await Promise.all([
    connection.getAccountInfo(tokenAMint),
    connection.getAccountInfo(tokenBMint),
  ]);
  if (!tokenAInfo || !tokenBInfo) {
    throw new Error("Could not read OPENGAP or SPACEX mint");
  }

  const tokenAProgram = tokenProgramOf(tokenAInfo.owner);
  const tokenBProgram = tokenProgramOf(tokenBInfo.owner);
  const [tokenA, tokenB] = await Promise.all([
    getMint(connection, tokenAMint, "confirmed", tokenAProgram),
    getMint(connection, tokenBMint, "confirmed", tokenBProgram),
  ]);

  const solNow = await connection.getBalance(payer.publicKey);
  const usdc = await tokenHolding(connection, payer.publicKey, USDC_MINT);
  if (solNow < 50_000_000 && usdc.ui >= 2) {
    const quote = await getJupiterQuote({
      inputMint: USDC_MINT,
      outputMint: WSOL_MINT,
      amount: Math.floor(Math.min(usdc.ui, 3) * 1_000_000),
    });
    await executeServerSwap(quote);
  }

  let openGap = await tokenHolding(connection, payer.publicKey, TOKEN_MINT);
  let spaceX = await tokenHolding(connection, payer.publicKey, SPACEX_MINT);

  if (openGap.raw.lten(0) && wallet.mainnetSol > 0.025) {
    const quote = await getJupiterQuote({
      inputMint: WSOL_MINT,
      outputMint: TOKEN_MINT,
      amount: 5_000_000,
    });
    await executeServerSwap(quote);
    openGap = await tokenHolding(connection, payer.publicKey, TOKEN_MINT);
  }
  if (spaceX.raw.lten(0) && (await getWalletStatus()).mainnetSol > 0.02) {
    const quote = await getJupiterQuote({
      inputMint: WSOL_MINT,
      outputMint: SPACEX_MINT,
      amount: 5_000_000,
    });
    await executeServerSwap(quote);
    spaceX = await tokenHolding(connection, payer.publicKey, SPACEX_MINT);
  }

  if (openGap.raw.lten(0) || spaceX.raw.lten(0)) {
    return {
      created: false,
      reason:
        "Server wallet does not hold both OPENGAP and SPACEX, and there is not enough SOL to buy them. The ClawPump agent wallet already holds both — it can seed the pool.",
      wallet: wallet.publicKey,
      openGap: openGap.ui,
      spaceX: spaceX.ui,
      sol: wallet.mainnetSol,
    };
  }

  const tokenAAmount = BN.max(new BN(1), openGap.raw.muln(50).divn(100));
  const tokenBAmount = BN.max(new BN(1), spaceX.raw.muln(50).divn(100));

  const price = (
    Number(tokenBAmount.toString()) /
    10 ** tokenB.decimals /
    (Number(tokenAAmount.toString()) / 10 ** tokenA.decimals)
  ).toString();

  const initSqrtPrice = getSqrtPriceFromPrice(
    price,
    tokenA.decimals,
    tokenB.decimals,
  );
  const liquidityDelta = cpAmm.getLiquidityDelta({
    maxAmountTokenA: tokenAAmount,
    maxAmountTokenB: tokenBAmount,
    sqrtPrice: initSqrtPrice,
    sqrtMinPrice: MIN_SQRT_PRICE,
    sqrtMaxPrice: MAX_SQRT_PRICE,
    collectFeeMode: CollectFeeMode.BothToken,
  });

  const baseFee = getBaseFeeParams({
    baseFeeMode: BaseFeeMode.FeeTimeSchedulerLinear,
    feeTimeSchedulerParam: {
      startingFeeBps: 100,
      endingFeeBps: 25,
      numberOfPeriod: 10,
      totalDuration: 3600,
    },
  });

  const poolFees: PoolFeesParams = {
    baseFee,
    compoundingFeeBps: 0,
    padding: 0,
    dynamicFee: getDynamicFeeParams(25),
  };

  const positionNft = Keypair.generate();
  const { tx, pool, position } = await cpAmm.createCustomPool({
    payer: payer.publicKey,
    creator: payer.publicKey,
    positionNft: positionNft.publicKey,
    tokenAMint,
    tokenBMint,
    tokenAAmount,
    tokenBAmount,
    sqrtMinPrice: MIN_SQRT_PRICE,
    sqrtMaxPrice: MAX_SQRT_PRICE,
    liquidityDelta,
    initSqrtPrice,
    poolFees,
    hasAlphaVault: false,
    activationType: ActivationType.Timestamp,
    collectFeeMode: CollectFeeMode.BothToken,
    activationPoint: null,
    tokenAProgram,
    tokenBProgram,
    isLockLiquidity: false,
  });

  const signature = await sendAndConfirmTransaction(connection, tx, [
    payer,
    positionNft,
  ]);

  return {
    created: true,
    pool: pool.toBase58(),
    position: position.toBase58(),
    signature,
    url: `https://app.meteora.ag/dammv2/${pool.toBase58()}`,
    openGap: openGap.ui,
    spaceX: spaceX.ui,
  };
}
