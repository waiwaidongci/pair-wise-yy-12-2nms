import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Archive, Horse, Photo, Trim } from "./types";
import { buildSeed } from "./seed";
import { uid } from "./utils";

/** 全部数据集中存于这一个键；每条 trim 都带 horseId，读取时按马过滤 */
const STORAGE_KEY = "farrier-archive-v1";

function loadArchive(): Archive {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Archive;
      if (Array.isArray(parsed.horses) && Array.isArray(parsed.trims)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("读取本地档案失败，使用初始数据", err);
  }
  return buildSeed();
}

export interface NewTrimInput {
  horseId: string;
  date: string;
  nextRecheckDate: string;
  gaitIssue: string;
  hooves: Trim["hooves"];
  note: string;
  /** 复查补录时可以直接带上既有照片 */
  photos?: Photo[];
}

interface ArchiveContextValue {
  archive: Archive;
  addHorse: (input: { code: string; name: string; category: Horse["category"] }) => Horse;
  addTrim: (input: NewTrimInput) => Trim;
  /** 完成复查：旧记录标记完成（从未完成列表移除），同时生成一条新修整记录 */
  completeRecheck: (trimId: string, input: Omit<NewTrimInput, "horseId">) => Trim | null;
  /** 给已有记录补照片/备注 */
  appendAttachments: (trimId: string, additions: { photos?: Photo[]; note?: string }) => void;
  resetAll: () => void;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [archive, setArchive] = useState<Archive>(loadArchive);

  // 新增、复查、补充后落盘；重新打开页面仍能查到
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
    } catch (err) {
      // 一般是照片过多触发配额，保留内存状态并提示
      console.error("档案保存失败（可能本地存储空间不足）", err);
      alert("保存失败：本地存储空间可能不足，请减少照片后重试。");
    }
  }, [archive]);

  const addHorse = useCallback(
    (input: { code: string; name: string; category: Horse["category"] }) => {
      const code = input.code.trim();
      if (archive.horses.some((h) => h.code === code)) {
        throw new Error(`马匹编号 ${code} 已存在`);
      }
      const horse: Horse = {
        id: uid("horse"),
        code,
        name: input.name.trim(),
        category: input.category,
        createdAt: new Date().toISOString(),
      };
      setArchive((prev) => ({ ...prev, horses: [...prev.horses, horse] }));
      return horse;
    },
    [archive.horses]
  );

  const addTrim = useCallback((input: NewTrimInput) => {
    const trim: Trim = {
      id: uid("trim"),
      horseId: input.horseId,
      date: input.date,
      nextRecheckDate: input.nextRecheckDate,
      gaitIssue: input.gaitIssue,
      hooves: input.hooves,
      photos: input.photos ?? [],
      note: input.note,
      recheckCompletedAt: null,
      createdAt: new Date().toISOString(),
    };
    setArchive((prev) => ({ ...prev, trims: [...prev.trims, trim] }));
    return trim;
  }, []);

  const completeRecheck = useCallback(
    (trimId: string, input: Omit<NewTrimInput, "horseId">) => {
      const old = archive.trims.find((t) => t.id === trimId);
      if (!old) return null;
      const created: Trim = {
        id: uid("trim"),
        horseId: old.horseId,
        date: input.date,
        nextRecheckDate: input.nextRecheckDate,
        gaitIssue: input.gaitIssue,
        hooves: input.hooves,
        photos: input.photos ?? [],
        note: input.note,
        recheckCompletedAt: null,
        createdAt: new Date().toISOString(),
      };
      const completedAt = new Date().toISOString();
      setArchive((prev) => ({
        ...prev,
        trims: [
          ...prev.trims.map((t) => (t.id === trimId ? { ...t, recheckCompletedAt: completedAt } : t)),
          created,
        ],
      }));
      return created;
    },
    [archive.trims]
  );

  const appendAttachments = useCallback(
    (trimId: string, additions: { photos?: Photo[]; note?: string }) => {
      setArchive((prev) => ({
        ...prev,
        trims: prev.trims.map((t) => {
          if (t.id !== trimId) return t;
          const note = additions.note
            ? [t.note, additions.note].filter(Boolean).join("\n")
            : t.note;
          return {
            ...t,
            photos: additions.photos ? [...t.photos, ...additions.photos] : t.photos,
            note,
          };
        }),
      }));
    },
    []
  );

  const resetAll = useCallback(() => setArchive(buildSeed()), []);

  const value = useMemo<ArchiveContextValue>(
    () => ({ archive, addHorse, addTrim, completeRecheck, appendAttachments, resetAll }),
    [archive, addHorse, addTrim, completeRecheck, appendAttachments, resetAll]
  );

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}

export function useArchive(): ArchiveContextValue {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchive 必须在 ArchiveProvider 内使用");
  return ctx;
}
