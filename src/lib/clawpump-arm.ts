import {
  CLAWPUMP_AGENT_ID,
  chatAgent,
  getAgent,
  startAgent,
  updateAgent,
} from "@/lib/clawpump";
import {
  createAgentRun,
  createAutomation,
  createCustomSkill,
  exchangePlatform,
  listAgentRuns,
  listAutomations,
  listCustomSkills,
  patchPlatformAgent,
  updateCustomSkill,
  type AgentRun,
  type Automation,
  type CustomSkill,
} from "@/lib/clawpump-platform";
import { getOpenGapSignal, signalBrief } from "@/lib/opengap-signal";
import {
  OPEN_GAP_AUTOMATION,
  OPEN_GAP_FILL_USDC,
  OPEN_GAP_MAX_INVENTORY_USDC,
  OPEN_GAP_PERSONA,
  OPEN_GAP_PUBLIC_DESCRIPTION,
  OPEN_GAP_RUN,
  OPEN_GAP_SKILL_DESCRIPTION,
  OPEN_GAP_SKILL_NAME,
  OPEN_GAP_SKILLS,
  openGapSkillMarkdown,
} from "@/lib/opengap-skill";

export async function armOpenGapAgent() {
  const skill = openGapSkillMarkdown();
  const signal = await getOpenGapSignal();
  const brief = signalBrief(signal);
  const notes: string[] = [];

  const updated = await updateAgent(CLAWPUMP_AGENT_ID, {
    persona: OPEN_GAP_PERSONA,
    system_prompt: skill,
    skills: [...OPEN_GAP_SKILLS],
  }).catch((error: unknown) => {
    notes.push(asError("v1 update", error));
    return null;
  });
  if (updated) notes.push("persona + system prompt set");

  let custom: CustomSkill | null = null;
  let automation: Automation | null = null;
  let run: AgentRun | null = null;

  try {
    const session = await exchangePlatform();
    await patchPlatformAgent(session, CLAWPUMP_AGENT_ID, {
      public_description: OPEN_GAP_PUBLIC_DESCRIPTION,
      is_public: true,
      config: {
        persona: OPEN_GAP_PERSONA,
        system_prompt: skill,
      },
      enabled_skills: [...OPEN_GAP_SKILLS],
    }).catch((error: unknown) => {
      notes.push(asError("platform patch", error));
    });

    const skills = await listCustomSkills(session, CLAWPUMP_AGENT_ID);
    const existing = skills.find((item) =>
      [item.slug, item.name].some((value) =>
        value?.toLowerCase().includes("opengap"),
      ),
    );
    custom = existing
      ? await updateCustomSkill(session, CLAWPUMP_AGENT_ID, existing.id, {
          name: OPEN_GAP_SKILL_NAME,
          description: OPEN_GAP_SKILL_DESCRIPTION,
          content: skill,
          enabled: true,
        })
      : await createCustomSkill(session, CLAWPUMP_AGENT_ID, {
          name: OPEN_GAP_SKILL_NAME,
          description: OPEN_GAP_SKILL_DESCRIPTION,
          content: skill,
          enabled: true,
        });
    notes.push(existing ? "custom skill updated" : "custom skill created");

    const autos = await listAutomations(session, CLAWPUMP_AGENT_ID);
    automation =
      autos.find((item) => item.name === OPEN_GAP_AUTOMATION) ??
      (await createAutomation(session, {
        agent_id: CLAWPUMP_AGENT_ID,
        name: OPEN_GAP_AUTOMATION,
        description: "Scan the OpenGap tape and buy only a −3% or cheaper name.",
        trigger_type: "scheduled_at",
        trigger_config: { runAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() },
        action_type: "agent_prompt",
        action_config: { prompt: brief },
        trigger_once: false,
      }).catch((error: unknown) => {
        notes.push(asError("automation", error));
        return null;
      }));
    if (automation) notes.push("scan scheduled");

    const runs = await listAgentRuns(session, CLAWPUMP_AGENT_ID);
    const live = runs.find(
      (item) =>
        item.objective?.includes("OpenGap") &&
        (item.status === "running" || item.status === "queued"),
    );
    run =
      live ??
      (await createAgentRun(session, {
        agent_id: CLAWPUMP_AGENT_ID,
        objective: `${OPEN_GAP_RUN}. ${brief}`,
        mode: "monitor",
        max_steps: 16,
        budget_usd: OPEN_GAP_MAX_INVENTORY_USDC,
        run_now: true,
        input: { signal, fillUsdc: OPEN_GAP_FILL_USDC },
      }).catch((error: unknown) => {
        notes.push(asError("agent run", error));
        return null;
      }));
    if (run) notes.push(`run ${run.status ?? "created"}`);
  } catch (error) {
    notes.push(asError("platform", error));
  }

  const started = await startAgent(CLAWPUMP_AGENT_ID);
  notes.push(`agent ${started.status}`);

  const chat = await chatAgent(CLAWPUMP_AGENT_ID, brief).catch((error: unknown) => {
    notes.push(asError("chat", error));
    return null;
  });
  if (chat) notes.push("first turn sent");

  const agent = await getAgent(CLAWPUMP_AGENT_ID).catch(() => started);

  return {
    agent,
    skill: custom
      ? { id: custom.id, name: custom.name, enabled: custom.enabled ?? true }
      : { name: OPEN_GAP_SKILL_NAME, enabled: true, via: "system_prompt" },
    automation: automation ? { id: automation.id, name: automation.name } : null,
    run: run
      ? { id: run.id, status: run.status, mode: run.mode }
      : null,
    signal,
    chat: chat
      ? { content: chat.content.slice(0, 1200), cost: chat.cost }
      : null,
    launched: false,
    notes,
  };
}

function asError(label: string, error: unknown) {
  return `${label}: ${error instanceof Error ? error.message : "failed"}`;
}
