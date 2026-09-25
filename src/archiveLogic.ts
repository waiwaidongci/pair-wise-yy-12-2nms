import type { HoofState, Trim } from "./types";
import { HOOF_META, HOOF_ORDER } from "./constants";
import { daysFromToday } from "./utils";

export function isPending(trim: Trim): boolean {
  return trim.recheckCompletedAt === null;
}

/** 到期或已过复查日且尚未完成复查 */
export function isDue(trim: Trim, now: string): boolean {
  return isPending(trim) && daysFromToday(trim.nextRecheckDate, now) <= 0;
}

/** 该马最新一条未完成记录决定“待复查”状态 */
export function latestPendingTrim(trims: Trim[]): Trim | null {
  const pending = trims.filter(isPending).sort((a, b) => b.date.localeCompare(a.date));
  return pending[0] ?? null;
}

export function trimHasAbnormal(trim: Trim): boolean {
  return HOOF_ORDER.some((h) => trim.hooves[h].abnormal) || Boolean(trim.gaitIssue.trim());
}

/** 马匹是否仍存在未解决的异常蹄（按最新一次修整的四蹄状态） */
export function horseHasOpenAbnormal(trims: Trim[]): boolean {
  const latest = [...trims].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return false;
  return HOOF_ORDER.some((h) => latest.hooves[h].abnormal);
}

export interface HorseSummary {
  pendingCount: number;
  dueCount: number;
  hasAbnormal: boolean;
}

export function summarizeHorse(trims: Trim[], now: string): HorseSummary {
  const pending = trims.filter(isPending);
  return {
    pendingCount: pending.length,
    dueCount: pending.filter((t) => isDue(t, now)).length,
    hasAbnormal: horseHasOpenAbnormal(trims),
  };
}

export interface HoofChange {
  hoof: keyof Trim["hooves"];
  label: string;
  shapeChanged: boolean;
  wearChanged: boolean;
  abnormalCleared: boolean;
  abnormalNew: boolean;
  problemChanged: boolean;
  shoeChanged: boolean;
  nailChanged: boolean;
  before: HoofState;
  after: HoofState;
}

/** 逐蹄对比同马相邻两次修整 */
export function diffHooves(prev: Trim, next: Trim): HoofChange[] {
  return HOOF_ORDER.map((hoof) => {
    const before = prev.hooves[hoof];
    const after = next.hooves[hoof];
    return {
      hoof,
      label: HOOF_META[hoof].label,
      shapeChanged: before.shape !== after.shape,
      wearChanged: before.wear !== after.wear,
      abnormalCleared: before.abnormal && !after.abnormal,
      abnormalNew: !before.abnormal && after.abnormal,
      problemChanged: before.problem !== after.problem,
      shoeChanged: before.shoeType !== after.shoeType,
      nailChanged: before.nailPositions !== after.nailPositions,
      before,
      after,
    };
  });
}
