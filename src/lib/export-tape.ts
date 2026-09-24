import type { TapeRow } from "@/lib/types";

export function exportTapeCsv(rows: TapeRow[], filename = "opengap-tape") {
  const header = "symbol,name,issuer,tape,mark,gap,implied,sector";
  const body = rows
    .map((row) =>
      [
        row.symbol,
        csv(row.name),
        row.issuer ?? "prestocks",
        row.execPrice.toFixed(6),
        row.markPrice.toFixed(6),
        row.premium.toFixed(6),
        row.impliedValuation.toFixed(2),
        csv(row.sector ?? ""),
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}\n`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csv(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
