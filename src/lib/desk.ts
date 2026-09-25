import type { Desk } from "@/lib/tour";

export const DESK_QUERY = "desk";

export function parseDesk(value: string | null): Desk {
  if (value === "tessera" || value === "prestocks") {
    return value;
  }
  if (value === "launch" || value === "clawpump") return "launch";
  if (value === "listed" || value === "basis") return "basis";
  return "prestocks";
}

export function deskQueryValue(desk: Desk) {
  if (desk === "prestocks") return null;
  if (desk === "basis") return "listed";
  if (desk === "launch") return "clawpump";
  return desk;
}
