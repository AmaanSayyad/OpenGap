const CLAWPUMP = "https://clawpump.tech";
const FALLBACK_API = "https://ai-agents-production-6ca0.up.railway.app";

export type PlatformSession = {
  access_token: string;
  api_url: string;
};

export type CustomSkill = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  enabled?: boolean;
  content?: string;
};

export type Automation = {
  id: string;
  name: string;
  status?: string;
  trigger_type?: string;
  action_type?: string;
  agent_id?: string;
};

export type AgentRun = {
  id: string;
  agent_id?: string;
  objective?: string;
  mode?: string;
  status?: string;
  budget_usd?: number;
};

function apiKey() {
  const key = process.env.CLAWPUMP_API_KEY;
  if (!key) throw new Error("CLAWPUMP_API_KEY is missing on the server");
  return key;
}

export async function exchangePlatform(): Promise<PlatformSession> {
  const response = await fetch(`${CLAWPUMP}/api/mcp/token`, {
    method: "POST",
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey()}`,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as PlatformSession & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? `ClawPump token ${response.status}`);
  }
  return {
    access_token: payload.access_token,
    api_url: (payload.api_url || FALLBACK_API).replace(/\/$/, ""),
  };
}

async function platform<T>(
  session: PlatformSession,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${session.api_url}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${session.access_token}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? `ClawPump platform ${response.status}`,
    );
  }
  return payload;
}

export async function listCustomSkills(session: PlatformSession, agentId: string) {
  const data = await platform<CustomSkill[] | { skills?: CustomSkill[] }>(
    session,
    `/skills/${agentId}`,
  );
  return Array.isArray(data) ? data : (data.skills ?? []);
}

export async function createCustomSkill(
  session: PlatformSession,
  agentId: string,
  body: { name: string; description: string; content: string; enabled?: boolean },
) {
  return platform<CustomSkill>(session, `/skills/${agentId}`, {
    method: "POST",
    body: JSON.stringify({ enabled: true, ...body }),
  });
}

export async function updateCustomSkill(
  session: PlatformSession,
  agentId: string,
  skillId: string,
  body: { name?: string; description?: string; content?: string; enabled?: boolean },
) {
  return platform<CustomSkill>(session, `/skills/${agentId}/${skillId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function patchPlatformAgent(
  session: PlatformSession,
  agentId: string,
  body: Record<string, unknown>,
) {
  return platform(session, `/agents/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function listAutomations(session: PlatformSession, agentId: string) {
  const data = await platform<Automation[] | { automations?: Automation[] }>(
    session,
    `/automations?agent_id=${encodeURIComponent(agentId)}`,
  );
  return Array.isArray(data) ? data : (data.automations ?? []);
}

export async function createAutomation(
  session: PlatformSession,
  body: Record<string, unknown>,
) {
  return platform<Automation>(session, "/automations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listAgentRuns(session: PlatformSession, agentId: string) {
  const data = await platform<AgentRun[] | { runs?: AgentRun[] }>(
    session,
    `/agent-runs?agent_id=${encodeURIComponent(agentId)}&limit=10`,
  );
  return Array.isArray(data) ? data : (data.runs ?? []);
}

export async function createAgentRun(
  session: PlatformSession,
  body: Record<string, unknown>,
) {
  return platform<AgentRun>(session, "/agent-runs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
