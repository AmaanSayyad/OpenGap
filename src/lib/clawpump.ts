import { TOKEN_MINT, TOKEN_URL } from "@/lib/company";

const CLAWPUMP = "https://clawpump.tech";
const V1 = `${CLAWPUMP}/api/v1`;

export const CLAWPUMP_AGENT_ID =
  process.env.CLAWPUMP_AGENT_ID ?? "1b18f251-25ef-4687-b551-d54642406495";

export type ClawSkill = {
  slug: string;
  name: string;
  description: string;
  alwaysOn: boolean;
};

export type ClawAgent = {
  id: string;
  name: string;
  status: string;
  walletAddress: string | null;
  tokenAddress?: string | null;
  skills: string[];
  model: string | null;
  persona: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
};

export type ClawPair = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  imageUrl: string | null;
};

export type ClawCost = {
  paymentMethod: string;
  quoteMint: string;
  payTo: string;
  creationFeeSol: number;
  defaultDevBuySol: number;
  standardCostSol: number;
  quoteValidForSeconds: number;
  steps: string[];
};

export type ClawMacro = {
  symbol: string;
  price_usd: number;
  change_24h: number;
};

export type ClawMover = {
  symbol: string;
  name: string;
  contract: string;
  price_usd: number;
  change_24h: number;
  market_cap_usd: number;
  signal: string;
};

function apiKey() {
  const key = process.env.CLAWPUMP_API_KEY;
  if (!key) throw new Error("CLAWPUMP_API_KEY is missing on the server");
  return key;
}

async function claw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${V1}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey()}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    meta?: { requestId?: string };
  };
  if (!response.ok) {
    const extra = payload.meta?.requestId ? ` (${payload.meta.requestId})` : "";
    throw new Error((payload.error ?? `ClawPump ${response.status}`) + extra);
  }
  return payload;
}

export async function listSkills() {
  const data = await claw<{ skills: ClawSkill[] }>("/skills");
  return data.skills ?? [];
}

export async function listAgents() {
  const data = await claw<{ agents: ClawAgent[] }>("/agents");
  return data.agents ?? [];
}

export async function getAgent(id: string) {
  return claw<ClawAgent>(`/agents/${id}`);
}

export async function startAgent(id: string) {
  return claw<ClawAgent>(`/agents/${id}/start`, { method: "POST" });
}

export async function stopAgent(id: string) {
  return claw<ClawAgent>(`/agents/${id}/stop`, { method: "POST" });
}

export async function updateAgent(
  id: string,
  body: Record<string, unknown>,
) {
  return claw<ClawAgent>(`/agents/${id}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ClawChat = {
  role?: string;
  content: string;
  model?: string;
  cost?: number;
};

export async function chatAgent(id: string, message: string) {
  return claw<ClawChat>(`/agents/${id}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(120_000),
  });
}

export async function listAgentMessages(id: string, limit = 8) {
  const data = await claw<{
    messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
  }>(`/agents/${id}/messages?limit=${limit}`);
  return data.messages ?? [];
}

export async function listPumpPairs() {
  const data = await claw<{
    assets: ClawPair[];
    creatorFeeBps?: { min: number; max: number; default: number };
  }>("/pump-pairs");
  return {
    assets: data.assets ?? [],
    creatorFeeBps: data.creatorFeeBps ?? { min: 100, max: 300, default: 100 },
  };
}

export async function getLaunchCost(quoteMint?: string) {
  const query = quoteMint
    ? `/launch/self-funded?quoteMint=${encodeURIComponent(quoteMint)}`
    : "/launch/self-funded";
  return claw<ClawCost>(query);
}

export async function getMacroSignals() {
  const data = await claw<{ assets: ClawMacro[] }>("/signals/macro");
  return data.assets ?? [];
}

export async function getTopMovers(limit = 6) {
  const data = await claw<{ signals: ClawMover[] }>(
    `/signals/top-movers?limit=${limit}`,
  );
  return data.signals ?? [];
}

export async function getSolPrice() {
  return claw<{ price: number; symbol: string; mint: string; change24h: number }>(
    "/price?mint=SOL",
  );
}

export async function getClawpumpDesk() {
  const [skills, agents, pairs, cost, macro, movers, sol] = await Promise.all([
    listSkills().catch(() => [] as ClawSkill[]),
    listAgents().catch(() => [] as ClawAgent[]),
    listPumpPairs().catch(() => ({
      assets: [] as ClawPair[],
      creatorFeeBps: { min: 100, max: 300, default: 100 },
    })),
    getLaunchCost().catch(() => null),
    getMacroSignals().catch(() => [] as ClawMacro[]),
    getTopMovers().catch(() => [] as ClawMover[]),
    getSolPrice().catch(() => null),
  ]);

  const agent =
    agents.find((item) => item.id === CLAWPUMP_AGENT_ID) ??
    (await getAgent(CLAWPUMP_AGENT_ID).catch(() => null)) ??
    agents[0] ??
    null;

  const detail = agent
    ? await getAgent(agent.id).catch(() => agent)
    : null;

  return {
    configured: Boolean(process.env.CLAWPUMP_API_KEY),
    agent: detail,
    skills,
    pairs: pairs.assets,
    creatorFeeBps: pairs.creatorFeeBps,
    cost,
    macro: macro.filter(
      (row) =>
        row.symbol === "SOL" ||
        row.symbol === "BTC" ||
        row.symbol === "ETH" ||
        row.symbol === "USDC",
    ),
    movers,
    sol,
    links: {
      docs: `${CLAWPUMP}/docs`,
      developers: `${CLAWPUMP}/developers`,
      mcp: `${CLAWPUMP}/mcp`,
      marketplace: `${CLAWPUMP}/marketplace`,
      ansemhack: `${CLAWPUMP}/ansemhack`,
      agent: detail
        ? `${CLAWPUMP}/marketplace`
        : `${CLAWPUMP}/dashboard`,
      wallet: detail?.walletAddress
        ? `https://solscan.io/account/${detail.walletAddress}`
        : null,
      token: TOKEN_URL,
    },
    hack: {
      stocklana: true,
      ansemhack: {
        agentDeployed: Boolean(detail),
        agentPublic: Boolean(detail?.isPublic),
        agentRunning: detail?.status === "running",
        tokenLive: Boolean(detail?.tokenAddress ?? TOKEN_MINT),
        tokenizeDeadline: "2026-10-01T04:00:00.000Z",
      },
    },
    updatedAt: new Date().toISOString(),
  };
}
