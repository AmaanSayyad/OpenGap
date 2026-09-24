import type { TapeRow } from "@/lib/types";

export function premium(execPrice: number, markPrice: number) {
  if (!markPrice) return 0;
  return (execPrice - markPrice) / markPrice;
}

export function deepestDiscount(rows: TapeRow[]) {
  return [...rows].sort((a, b) => a.premium - b.premium)[0] ?? null;
}

export function widestPremium(rows: TapeRow[]) {
  return [...rows].sort((a, b) => b.premium - a.premium)[0] ?? null;
}

export function pre8Index(rows: TapeRow[]) {
  if (rows.length === 0) {
    return { premium: 0, execValue: 0, markValue: 0 };
  }
  const execValue = rows.reduce((sum, row) => sum + row.execPrice, 0) / rows.length;
  const markValue = rows.reduce((sum, row) => sum + row.markPrice, 0) / rows.length;
  return {
    execValue,
    markValue,
    premium: premium(execValue, markValue),
  };
}
