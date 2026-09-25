// 档案领域模型：所有修整记录都挂在 horseId 下，保证同马记录不串档。

export type HoofId = "LF" | "RF" | "LH" | "RH";
export type HorseCategory = "运动马" | "休养马";

/** 单个蹄位在一次修整中的状态 */
export interface HoofState {
  /** 蹄形评估 */
  shape: string;
  /** 磨耗情况 */
  wear: string;
  /** 蹄铁类型 */
  shoeType: string;
  /** 钉位记录 */
  nailPositions: string;
  /** 是否标记异常 */
  abnormal: boolean;
  /** 异常问题描述（abnormal 为 true 时必填） */
  problem: string;
}

export interface Photo {
  id: string;
  /** 压缩后的 dataURL，直接随档案存入 localStorage */
  dataUrl: string;
  caption: string;
  createdAt: string;
}

/** 一次修整（复查）记录 */
export interface Trim {
  id: string;
  /** 所属马匹，查询时一律按此 id 过滤 */
  horseId: string;
  /** 修整日期 YYYY-MM-DD */
  date: string;
  /** 下一复查日 YYYY-MM-DD */
  nextRecheckDate: string;
  /** 整体步态问题 */
  gaitIssue: string;
  /** 四蹄分别建档，键即蹄位（左前/右前/左后/右后） */
  hooves: Record<HoofId, HoofState>;
  photos: Photo[];
  note: string;
  /** 完成复查的时间戳；null 表示复查尚未完成 */
  recheckCompletedAt: string | null;
  createdAt: string;
}

export interface Horse {
  id: string;
  /** 马匹编号，唯一 */
  code: string;
  name: string;
  category: HorseCategory;
  createdAt: string;
}

export interface Archive {
  horses: Horse[];
  trims: Trim[];
}
