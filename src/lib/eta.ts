import { MINUTES_PER_RECORD } from "./queue-types";

/**
 * Minutes until the record at `index` in the upcoming list starts
 * (index 0 = the next one). The record playing now counts only for the
 * time it has left.
 */
export function etaMinutes(
  index: number,
  nowStartedAt: string | Date | null,
  at: Date = new Date(),
  minutesPerRecord: number = MINUTES_PER_RECORD,
): number {
  let remaining = 0;
  if (nowStartedAt) {
    const elapsed = (at.getTime() - new Date(nowStartedAt).getTime()) / 60000;
    remaining = Math.max(0, minutesPerRecord - elapsed);
  }
  return Math.max(0, Math.round(remaining + index * minutesPerRecord));
}
