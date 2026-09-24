import { readFileSync } from "node:fs";
import { join } from "node:path";

export const OPEN_GAP_SKILL_SLUG = "opengap-basis";
export const OPEN_GAP_SKILL_NAME = "OpenGap Basis Trader";
export const OPEN_GAP_SKILL_DESCRIPTION =
  "Buy tokenized stocks when the Jupiter tape is cheaper than the issuer mark. Never launch a token.";

export const OPEN_GAP_PERSONA =
  "Buy tokenised stocks when the tape is cheaper than the mark.";

export const OPEN_GAP_PUBLIC_DESCRIPTION =
  "Buy tokenized stocks when the Jupiter tape is cheaper than the issuer mark.";

export const OPEN_GAP_SKILLS = [
  "defi-trading",
  "portfolio",
  "market-intel",
  "wallet-ops",
] as const;

export const OPEN_GAP_MIN_GAP = -0.03;
export const OPEN_GAP_FILL_USDC = 5;
export const OPEN_GAP_MAX_INVENTORY_USDC = 15;
export const OPEN_GAP_AUTOMATION = "OpenGap basis scan";
export const OPEN_GAP_RUN = "OpenGap basis loop";

export function openGapSkillMarkdown() {
  try {
    return readFileSync(
      join(process.cwd(), "skills/opengap-basis/SKILL.md"),
      "utf8",
    );
  } catch {
    return FALLBACK_SKILL;
  }
}

const FALLBACK_SKILL = `# OpenGap Basis Trader

Buy a PreStock or Tessera mint only when gap <= -0.03. Max 5 USDC per fill. Never launch a token.
`;
