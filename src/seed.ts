import type { Archive, Horse, Trim, HoofState } from "./types";
import { emptyHooves } from "./constants";
import { addDays, today, uid } from "./utils";

function hoof(partial: Partial<HoofState>): HoofState {
  return {
    shape: "",
    wear: "",
    shoeType: "",
    nailPositions: "",
    abnormal: false,
    problem: "",
    ...partial,
  };
}

/** 首次打开时的演示档案：含已到期、今日到期与未到期三种复查状态 */
export function buildSeed(): Archive {
  const now = today();
  const horses: Horse[] = [
    { id: "horse_seed_18", code: "HORSE-18", name: "追风", category: "运动马", createdAt: new Date().toISOString() },
    { id: "horse_seed_27", code: "HORSE-27", name: "栗子", category: "休养马", createdAt: new Date().toISOString() },
    { id: "horse_seed_31", code: "HORSE-31", name: "青云", category: "运动马", createdAt: new Date().toISOString() },
  ];

  const trims: Trim[] = [
    {
      id: uid("trim"),
      horseId: "horse_seed_18",
      date: addDays(now, -38),
      nextRecheckDate: addDays(now, -24),
      gaitIssue: "直线运步尚可，右前肢略紧",
      hooves: {
        ...emptyHooves(),
        RF: hoof({ shape: "偏陡（立蹄）", wear: "外侧偏重", shoeType: "铁蹄铁", nailPositions: "外侧第3钉略浅", abnormal: true, problem: "右前蹄外侧磨耗，蹄壁外翻倾向" }),
        LF: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准7钉位" }),
        LH: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准" }),
        RH: hoof({ shape: "正常", wear: "趾尖偏重", shoeType: "铁蹄铁", nailPositions: "标准" }),
      },
      photos: [],
      note: "右前肢步幅偏短，待复查确认外磨是否改善。",
      recheckCompletedAt: new Date(addDays(now, -23) + "T09:30").toISOString(),
      createdAt: new Date(addDays(now, -38) + "T10:00").toISOString(),
    },
    {
      id: uid("trim"),
      horseId: "horse_seed_18",
      date: addDays(now, -23),
      nextRecheckDate: addDays(now, -9),
      gaitIssue: "右前紧张感减轻",
      hooves: {
        ...emptyHooves(),
        RF: hoof({ shape: "正常", wear: "外侧偏重", shoeType: "铝蹄铁", nailPositions: "外侧第3钉加深1mm", abnormal: true, problem: "外磨仍在但减轻，换铝铁减负，继续观察" }),
        LF: hoof({ shape: "正常", wear: "均匀", shoeType: "铝蹄铁", nailPositions: "标准7钉位" }),
        LH: hoof({ shape: "正常", wear: "均匀", shoeType: "铝蹄铁", nailPositions: "标准" }),
        RH: hoof({ shape: "正常", wear: "均匀", shoeType: "铝蹄铁", nailPositions: "标准" }),
      },
      photos: [],
      note: "四蹄全部由铁蹄铁更换为铝蹄铁，复查重点仍在右前。",
      recheckCompletedAt: null,
      createdAt: new Date(addDays(now, -23) + "T09:40").toISOString(),
    },
    {
      id: uid("trim"),
      horseId: "horse_seed_27",
      date: addDays(now, -14),
      nextRecheckDate: now,
      gaitIssue: "休养中，慢步偶有躲闪",
      hooves: {
        ...emptyHooves(),
        LH: hoof({ shape: "蹄壁裂纹", wear: "局部过度磨耗", shoeType: "加护蹄垫", nailPositions: "裂纹处避钉", abnormal: true, problem: "左后蹄侧壁纵向裂纹约2cm，已加护蹄垫" }),
        LF: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准" }),
        RF: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准" }),
        RH: hoof({ shape: "正常", wear: "蹄跟偏重", shoeType: "加护蹄垫", nailPositions: "标准" }),
      },
      photos: [],
      note: "拍照归档裂纹走向，两周后看是否延伸。",
      recheckCompletedAt: null,
      createdAt: new Date(addDays(now, -14) + "T15:00").toISOString(),
    },
    {
      id: uid("trim"),
      horseId: "horse_seed_31",
      date: addDays(now, -6),
      nextRecheckDate: addDays(now, 22),
      gaitIssue: "步态轻微不稳，需教练复核",
      hooves: {
        ...emptyHooves(),
        LF: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准" }),
        RF: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准" }),
        LH: hoof({ shape: "偏平（卧蹄）", wear: "蹄跟偏重", shoeType: "铁蹄铁", nailPositions: "后跟加第8钉", abnormal: true, problem: "左后偏平、跟磨，步态轻微不稳，已标记待教练复核" }),
        RH: hoof({ shape: "正常", wear: "均匀", shoeType: "铁蹄铁", nailPositions: "标准" }),
      },
      photos: [],
      note: "复查日未到，但异常已标记，列表中带异常标识。",
      recheckCompletedAt: null,
      createdAt: new Date(addDays(now, -6) + "T11:20").toISOString(),
    },
  ];

  return { horses, trims };
}
