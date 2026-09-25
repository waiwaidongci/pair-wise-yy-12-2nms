import type { HoofId, HoofState } from "./types";

export const HOOF_ORDER: HoofId[] = ["LF", "RF", "LH", "RH"];

export const HOOF_META: Record<HoofId, { label: string; group: "前蹄" | "后蹄" }> = {
  LF: { label: "左前蹄", group: "前蹄" },
  RF: { label: "右前蹄", group: "前蹄" },
  LH: { label: "左后蹄", group: "后蹄" },
  RH: { label: "右后蹄", group: "后蹄" },
};

export const SHAPE_OPTIONS = ["正常", "偏陡（立蹄）", "偏平（卧蹄）", "广蹄", "窄蹄", "蹄壁裂纹", "崩蹄缺角"];
export const WEAR_OPTIONS = ["均匀", "外侧偏重", "内侧偏重", "趾尖偏重", "蹄跟偏重", "局部过度磨耗"];
export const SHOE_OPTIONS = ["铁蹄铁", "铝蹄铁", "橡胶蹄铁", "加护蹄垫", "无蹄铁（裸蹄）"];

export function emptyHoof(): HoofState {
  return { shape: "", wear: "", shoeType: "", nailPositions: "", abnormal: false, problem: "" };
}

export function emptyHooves(): Record<HoofId, HoofState> {
  return { LF: emptyHoof(), RF: emptyHoof(), LH: emptyHoof(), RH: emptyHoof() };
}
