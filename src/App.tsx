import { useMemo, useState } from "react";
import { ArchiveProvider, useArchive } from "./store";
import { today } from "./utils";
import { isDue, summarizeHorse } from "./archiveLogic";
import { HOOF_META, HOOF_ORDER } from "./constants";
import { HorseList, Reminders } from "./components/HorseList";
import { HorseForm } from "./components/HorseForm";
import { HorseDetail } from "./components/HorseDetail";
import { TrimForm } from "./components/TrimForm";

type Filter = "全部" | "前蹄" | "后蹄" | "运动马" | "休养马";
const FILTERS: Filter[] = ["全部", "前蹄", "后蹄", "运动马", "休养马"];

function Workspace() {
  const { archive, addHorse, addTrim, completeRecheck, appendAttachments, resetAll } = useArchive();
  // “今天”只在挂载时取一次，保证会话内状态稳定
  const [now] = useState(today);

  const [filter, setFilter] = useState<Filter>("全部");
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(
    archive.horses[0]?.id ?? null
  );
  const [addingHorse, setAddingHorse] = useState(false);
  /** 表单模式：new = 新增修整；recheck:<trimId> = 完成某条到期复查 */
  const [formMode, setFormMode] = useState<null | { kind: "new" } | { kind: "recheck"; trimId: string }>(
    null
  );

  const selectedHorse = archive.horses.find((h) => h.id === selectedHorseId) ?? null;
  const horseTrims = useMemo(
    // 关键隔离：详情只取 horseId 完全匹配的记录，同一匹马的记录不会混到其他马
    () => (selectedHorse ? archive.trims.filter((t) => t.horseId === selectedHorse.id) : []),
    [archive.trims, selectedHorse]
  );
  const recheckSource =
    formMode?.kind === "recheck"
      ? archive.trims.find((t) => t.id === formMode.trimId) ?? null
      : null;

  // 顶部统计由档案实时汇总
  const metrics = useMemo(() => {
    let pending = 0;
    const abnormalHorses = new Set<string>();
    for (const horse of archive.horses) {
      const trims = archive.trims.filter((t) => t.horseId === horse.id);
      const s = summarizeHorse(trims, now);
      pending += s.pendingCount;
      if (s.hasAbnormal) abnormalHorses.add(horse.id);
    }
    return { pending, abnormalHorses: abnormalHorses.size, horses: archive.horses.length };
  }, [archive, now]);

  const dueTrimsCount = archive.trims.filter((t) => isDue(t, now)).length;

  function handleAddHorse(data: { code: string; name: string; category: "运动马" | "休养马" }) {
    try {
      const horse = addHorse(data);
      setAddingHorse(false);
      setSelectedHorseId(horse.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "新增失败");
    }
  }

  function handleTrimSubmit(data: {
    date: string;
    nextRecheckDate: string;
    gaitIssue: string;
    hooves: (typeof archive.trims)[number]["hooves"];
    photos: import("./types").Photo[];
    note: string;
  }) {
    if (!selectedHorse) return;
    if (formMode?.kind === "recheck") {
      completeRecheck(formMode.trimId, data);
    } else {
      addTrim({ ...data, horseId: selectedHorse.id });
    }
    // 保存后按蹄位指出归档结果：异常蹄列问题，正常蹄列蹄位
    const normal: string[] = [];
    const abnormal: string[] = [];
    HOOF_ORDER.forEach((h) => {
      const state = data.hooves[h];
      if (state.abnormal) abnormal.push(`${HOOF_META[h].label}：${state.problem.trim()}`);
      else normal.push(HOOF_META[h].label);
    });
    const lines = [
      `${formMode?.kind === "recheck" ? "复查已完成" : "修整记录已保存"}，已归入 ${selectedHorse.code}`,
      `正常蹄位：${normal.join("、")}`,
    ];
    if (abnormal.length) lines.push(`异常蹄位：\n${abnormal.join("\n")}`);
    alert(lines.join("\n"));
    setFormMode(null);
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>马术蹄铁修整档案</h1>
          <p>逐马归档 · 四蹄分别记录 · 复查提醒 · 变化对比 · 本地保存</p>
        </div>
        <button className="ghost" onClick={() => {
          if (confirm("确定要恢复为演示数据吗？当前所有记录将被清除。")) resetAll();
        }}>
          重置演示数据
        </button>
      </header>

      <section className="metrics">
        <article>
          <small>到期待复查</small>
          <strong className={dueTrimsCount > 0 ? "num-danger" : ""}>{dueTrimsCount}</strong>
        </article>
        <article>
          <small>进行中复查</small>
          <strong>{metrics.pending}</strong>
        </article>
        <article>
          <small>异常马匹</small>
          <strong className={metrics.abnormalHorses > 0 ? "num-danger" : ""}>
            {metrics.abnormalHorses}
          </strong>
        </article>
        <article>
          <small>马匹档案</small>
          <strong>{metrics.horses}</strong>
        </article>
      </section>

      <div className="chips filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? "chip active" : "chip"}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="layout">
        <HorseList
          archive={archive}
          now={now}
          filter={filter}
          selectedHorseId={selectedHorseId}
          onSelect={setSelectedHorseId}
          onAddHorse={() => setAddingHorse(true)}
        />

        <div className="main-col">
          <Reminders
            archive={archive}
            now={now}
            onOpenHorse={(id) => setSelectedHorseId(id)}
            onRecheck={(trimId) => {
              const t = archive.trims.find((x) => x.id === trimId);
              if (t) {
                setSelectedHorseId(t.horseId);
                setFormMode({ kind: "recheck", trimId });
              }
            }}
          />

          {addingHorse && (
            <section className="panel">
              <HorseForm
                existingCodes={archive.horses.map((h) => h.code)}
                onSubmit={handleAddHorse}
                onCancel={() => setAddingHorse(false)}
              />
            </section>
          )}

          {selectedHorse &&
            (formMode ? (
              <section className="panel">
                <TrimForm
                  horse={selectedHorse}
                  recheckSource={formMode.kind === "recheck" ? recheckSource : null}
                  onSubmit={handleTrimSubmit}
                  onCancel={() => setFormMode(null)}
                />
              </section>
            ) : (
              <HorseDetail
                horse={selectedHorse}
                trims={horseTrims}
                now={now}
                onNewTrim={() => setFormMode({ kind: "new" })}
                onRecheck={(trimId) => setFormMode({ kind: "recheck", trimId })}
                onAppend={appendAttachments}
              />
            ))}
        </div>
      </div>

      <footer className="page-foot">
        所有档案仅保存在本浏览器本地（localStorage），按马匹编号隔离，不上传服务器。
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <ArchiveProvider>
      <Workspace />
    </ArchiveProvider>
  );
}
