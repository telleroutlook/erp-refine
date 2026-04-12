// scripts/seed/data/shared.ts
// Shared helper functions for data generation

export function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

export function randomAmount(min: number, max: number, decimals = 2): number {
  return +(min + Math.random() * (max - min)).toFixed(decimals);
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function monthStart(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function monthEnd(year: number, month: number): Date {
  return new Date(year, month, 0);
}

/** Generate date ranges for 6 months: Oct 2025 - Mar 2026 */
export function getHistoryMonths(): Array<{ year: number; month: number; start: Date; end: Date; label: string }> {
  return [
    { year: 2025, month: 10, start: monthStart(2025, 10), end: monthEnd(2025, 10), label: '2025-10' },
    { year: 2025, month: 11, start: monthStart(2025, 11), end: monthEnd(2025, 11), label: '2025-11' },
    { year: 2025, month: 12, start: monthStart(2025, 12), end: monthEnd(2025, 12), label: '2025-12' },
    { year: 2026, month: 1, start: monthStart(2026, 1), end: monthEnd(2026, 1), label: '2026-01' },
    { year: 2026, month: 2, start: monthStart(2026, 2), end: monthEnd(2026, 2), label: '2026-02' },
    { year: 2026, month: 3, start: monthStart(2026, 3), end: monthEnd(2026, 3), label: '2026-03' },
  ];
}

/** Shorter history for Org2: Jan-Mar 2026 */
export function getShortHistoryMonths(): Array<{ year: number; month: number; start: Date; end: Date; label: string }> {
  return getHistoryMonths().slice(3); // Jan-Mar 2026
}

/** Weighted random pick — higher-indexed items slightly more likely */
export function weightedPick<T>(arr: T[], weights?: number[]): T {
  if (!weights) return pick(arr);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

/** Generate a reference tag for tracking created documents */
export function makeRef(prefix: string, monthLabel: string, index: number): string {
  return `${prefix}-${monthLabel}-${String(index).padStart(3, '0')}`;
}
