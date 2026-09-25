import type { DB, TrimRecord } from "./types";
import { addDays, todayStr, uid } from "./utils";

const STORAGE_KEY = "farrier-hoof-db-v1";

function emptyDb(): DB {
  return { horses: [], records: [], reviews: [] };
}

/** 首次打开时的演示数据：含两条历史记录（可对比）、一条已到期复查 */
function seedDb(): DB {
  const today = todayStr();
  const h1 = uid();
  const h2 = uid();
  const h3 = uid();

  const r1: TrimRecord = {
    id: uid(),
    horseId: h1,
    date: addDays(today, -42),
    nextReviewDate: addDays(today, -14),
    shoeType: "钢蹄铁",
    nailPattern: "常规6钉",
    gaitNote: "步态正常",
    hooves: [
      { position: "LF", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      { position: "RF", shape: "正常", wear: "外侧磨耗", abnormal: false, problem: "" },
      { position: "LH", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      { position: "RH", shape: "蹄踵过低", wear: "蹄踵磨耗", abnormal: false, problem: "" },
    ],
    photos: [],
    createdAt: Date.now() - 42 * 86400000,
  };

  const r2: TrimRecord = {
    id: uid(),
    horseId: h1,
    date: addDays(today, -7),
    nextReviewDate: addDays(today, -3), // 已到期 → 进入复查提醒
    shoeType: "铝蹄铁",
    nailPattern: "外侧4钉",
    gaitNote: "右前蹄落地略重",
    hooves: [
      { position: "LF", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      {
        position: "RF",
        shape: "蹄壁过薄",
        wear: "外侧磨耗",
        abnormal: true,
        problem: "右前蹄外侧蹄壁过薄，磨耗加剧，已换铝蹄铁减轻负重",
      },
      { position: "LH", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      { position: "RH", shape: "蹄踵过低", wear: "蹄踵磨耗", abnormal: false, problem: "" },
    ],
    photos: [],
    createdAt: Date.now() - 7 * 86400000,
  };

  const r3: TrimRecord = {
    id: uid(),
    horseId: h2,
    date: addDays(today, -10),
    nextReviewDate: addDays(today, 20), // 未到期 → 不进提醒
    shoeType: "加护蹄垫",
    nailPattern: "常规8钉",
    gaitNote: "后蹄轻微拖沓",
    hooves: [
      { position: "LF", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      { position: "RF", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      { position: "LH", shape: "正常", wear: "均匀", abnormal: false, problem: "" },
      {
        position: "RH",
        shape: "蹄壁裂纹",
        wear: "蹄尖磨耗",
        abnormal: true,
        problem: "右后蹄蹄壁纵向裂纹约2cm，加护蹄垫保护",
      },
    ],
    photos: [],
    createdAt: Date.now() - 10 * 86400000,
  };

  return {
    horses: [
      { id: h1, code: "HORSE-18", name: "疾风", status: "运动马", note: "", createdAt: Date.now() - 90 * 86400000 },
      { id: h2, code: "HORSE-27", name: "乌云", status: "运动马", note: "", createdAt: Date.now() - 60 * 86400000 },
      { id: h3, code: "HORSE-31", name: "白雪", status: "休养马", note: "老将，半休养", createdAt: Date.now() - 30 * 86400000 },
    ],
    records: [r1, r2, r3],
    reviews: [
      {
        id: uid(),
        horseId: h1,
        recordId: r1.id,
        dueDate: r1.nextReviewDate,
        status: "done",
        doneDate: addDays(today, -14),
        result: "复查通过，右前蹄磨耗需继续观察",
      },
      { id: uid(), horseId: h1, recordId: r2.id, dueDate: r2.nextReviewDate, status: "pending" },
      { id: uid(), horseId: h2, recordId: r3.id, dueDate: r3.nextReviewDate, status: "pending" },
    ],
  };
}

export function loadDb(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedDb();
      saveDb(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as DB;
    if (!parsed || !Array.isArray(parsed.horses)) return emptyDb();
    return {
      horses: parsed.horses ?? [],
      records: parsed.records ?? [],
      reviews: parsed.reviews ?? [],
    };
  } catch {
    return emptyDb();
  }
}

/** 持久化；照片过大导致超限时返回 false，由界面提示 */
export function saveDb(db: DB): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}
