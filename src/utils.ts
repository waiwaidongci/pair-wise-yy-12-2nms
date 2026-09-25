import type { HoofPosition, TrimRecord } from "./types";

export const HOOF_POSITIONS: { key: HoofPosition; label: string }[] = [
  { key: "LF", label: "左前蹄" },
  { key: "RF", label: "右前蹄" },
  { key: "LH", label: "左后蹄" },
  { key: "RH", label: "右后蹄" },
];

export const HOOF_LABEL: Record<HoofPosition, string> = {
  LF: "左前蹄",
  RF: "右前蹄",
  LH: "左后蹄",
  RH: "右后蹄",
};

export const SHAPE_OPTIONS = [
  "正常",
  "蹄壁过薄",
  "蹄踵过低",
  "蹄叉萎缩",
  "蹄壁裂纹",
  "蹄底不平",
  "蹄冠变形",
];

export const WEAR_OPTIONS = [
  "均匀",
  "外侧磨耗",
  "内侧磨耗",
  "蹄踵磨耗",
  "蹄尖磨耗",
  "严重不均",
];

export const SHOE_OPTIONS = [
  "钢蹄铁",
  "铝蹄铁",
  "塑料蹄铁",
  "裸蹄（无蹄铁）",
  "加护蹄垫",
  "定制蹄铁",
];

export const NAIL_OPTIONS = [
  "常规6钉",
  "常规8钉",
  "外侧4钉",
  "仅前蹄钉",
  "无钉（粘合）",
  "定制钉位",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 本地时区的今天，YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** due 相对 today 逾期的天数；未到期返回 <= 0 */
export function daysOverdue(due: string, today: string): number {
  const a = new Date(due + "T00:00:00").getTime();
  const b = new Date(today + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 逐蹄对比本次与上次记录，返回变化描述列表。
 * 覆盖：同一蹄的蹄形/磨耗/异常状态变化，以及蹄铁类型和钉位改动。
 */
export function diffRecords(
  cur: TrimRecord,
  prev: TrimRecord | undefined
): string[] {
  if (!prev) return [];
  const changes: string[] = [];

  for (const hoof of cur.hooves) {
    const before = prev.hooves.find((h) => h.position === hoof.position);
    if (!before) continue;
    const label = HOOF_LABEL[hoof.position];
    if (before.shape !== hoof.shape) {
      changes.push(`${label} 蹄形：${before.shape} → ${hoof.shape}`);
    }
    if (before.wear !== hoof.wear) {
      changes.push(`${label} 磨耗：${before.wear} → ${hoof.wear}`);
    }
    if (before.abnormal !== hoof.abnormal) {
      changes.push(
        hoof.abnormal
          ? `${label} 状态：正常 → 异常（${hoof.problem}）`
          : `${label} 状态：异常 → 恢复正常`
      );
    } else if (
      hoof.abnormal &&
      before.abnormal &&
      before.problem !== hoof.problem
    ) {
      changes.push(`${label} 异常问题：${before.problem} → ${hoof.problem}`);
    }
  }

  if (prev.shoeType !== cur.shoeType) {
    changes.push(`蹄铁类型：${prev.shoeType} → ${cur.shoeType}`);
  }
  if (prev.nailPattern !== cur.nailPattern) {
    changes.push(`钉位：${prev.nailPattern} → ${cur.nailPattern}`);
  }
  return changes;
}

/** 把图片文件压缩为 dataURL，避免 localStorage 超限 */
export function fileToDataUrl(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法处理图片"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
