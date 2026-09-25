export type HoofPosition = "LF" | "RF" | "LH" | "RH";

export interface HoofEntry {
  position: HoofPosition;
  shape: string; // 蹄形评估
  wear: string; // 磨耗情况
  abnormal: boolean; // 异常标记
  problem: string; // 异常时必填的问题描述
}

export interface PhotoNote {
  id: string;
  hoof: HoofPosition | ""; // 可选：关联蹄位
  note: string;
  image?: string; // 压缩后的 dataURL
  createdAt: number;
}

export interface TrimRecord {
  id: string;
  horseId: string;
  date: string; // 修蹄日期 YYYY-MM-DD
  nextReviewDate: string; // 下次复查日期
  shoeType: string; // 蹄铁类型
  nailPattern: string; // 钉位
  gaitNote: string; // 步态问题
  hooves: HoofEntry[]; // 固定四蹄
  photos: PhotoNote[];
  createdAt: number;
}

export interface Review {
  id: string;
  horseId: string;
  recordId: string;
  dueDate: string;
  status: "pending" | "done";
  doneDate?: string;
  result?: string; // 复查结论
}

export interface Horse {
  id: string;
  code: string; // 马匹编号
  name: string;
  status: "运动马" | "休养马";
  note: string;
  createdAt: number;
}

export interface DB {
  horses: Horse[];
  records: TrimRecord[];
  reviews: Review[];
}
