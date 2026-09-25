import { useMemo, useState } from "react";
import type { Horse, Review, TrimRecord } from "../types";
import { HOOF_LABEL, daysOverdue, todayStr } from "../utils";

interface Props {
  horses: Horse[];
  records: TrimRecord[];
  reviews: Review[];
  onOpenDetail: (horseId: string) => void;
  onNewRecord: (horseId: string) => void;
  onAddHorse: (horse: Horse) => void;
}

export default function HorseList({
  horses,
  records,
  reviews,
  onOpenDetail,
  onNewRecord,
  onAddHorse,
}: Props) {
  const today = todayStr();
  const [filter, setFilter] = useState<"全部" | "运动马" | "休养马">("全部");
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"运动马" | "休养马">("运动马");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const stats = useMemo(() => {
    const map = new Map<
      string,
      { dueCount: number; abnormalHooves: string[] }
    >();
    for (const h of horses) {
      const dueCount = reviews.filter(
        (r) =>
          r.horseId === h.id &&
          r.status === "pending" &&
          daysOverdue(r.dueDate, today) >= 0
      ).length;
      const horseRecords = records
        .filter((r) => r.horseId === h.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      const latest = horseRecords[0];
      const abnormalHooves = latest
        ? latest.hooves.filter((x) => x.abnormal).map((x) => HOOF_LABEL[x.position])
        : [];
      map.set(h.id, { dueCount, abnormalHooves });
    }
    return map;
  }, [horses, records, reviews, today]);

  const visible = horses.filter((h) => {
    if (filter !== "全部" && h.status !== filter) return false;
    const kw = keyword.trim().toLowerCase();
    if (kw && !`${h.code} ${h.name}`.toLowerCase().includes(kw)) return false;
    return true;
  });

  const submitHorse = () => {
    if (!code.trim()) {
      setFormError("请填写马匹编号");
      return;
    }
    if (horses.some((h) => h.code === code.trim())) {
      setFormError("该编号已存在，不能重复建档");
      return;
    }
    onAddHorse({
      id: crypto.randomUUID ? crypto.randomUUID() : `h-${Date.now()}`,
      code: code.trim(),
      name: name.trim() || code.trim(),
      status,
      note: note.trim(),
      createdAt: Date.now(),
    });
    setCode("");
    setName("");
    setNote("");
    setFormError("");
    setShowForm(false);
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>马匹档案</p>
          <h2>马匹列表（{horses.length}）</h2>
        </div>
        <button className="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "收起" : "新增马匹"}
        </button>
      </div>

      {showForm && (
        <div className="inline-form">
          <div className="field-grid">
            <label>
              <span>马匹编号 *</span>
              <input
                placeholder="如 HORSE-45"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <label>
              <span>马名</span>
              <input
                placeholder="如 疾风"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              <span>状态</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "运动马" | "休养马")}
              >
                <option>运动马</option>
                <option>休养马</option>
              </select>
            </label>
            <label>
              <span>备注</span>
              <input
                placeholder="选填"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <div className="actions">
            <button className="primary" onClick={submitHorse}>
              保存马匹
            </button>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="chips">
          {(["全部", "运动马", "休养马"] as const).map((f) => (
            <button
              key={f}
              className={filter === f ? "chip active" : "chip"}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="搜索编号或马名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {visible.length === 0 && <p className="empty">没有符合条件的马匹</p>}

      <div className="horse-grid">
        {visible.map((h) => {
          const s = stats.get(h.id)!;
          return (
            <article key={h.id} className="horse-card">
              <div className="horse-head">
                <div>
                  <h3>{h.code}</h3>
                  <p>
                    {h.name} · {h.status}
                  </p>
                </div>
                <div className="badges">
                  {s.dueCount > 0 && (
                    <span className="tag warn">待复查 {s.dueCount}</span>
                  )}
                  {s.abnormalHooves.length > 0 && (
                    <span className="tag danger">
                      异常：{s.abnormalHooves.join("、")}
                    </span>
                  )}
                  {s.dueCount === 0 && s.abnormalHooves.length === 0 && (
                    <span className="tag ok">正常</span>
                  )}
                </div>
              </div>
              {h.note && <p className="muted">{h.note}</p>}
              <div className="actions">
                <button onClick={() => onOpenDetail(h.id)}>查看档案</button>
                <button className="primary" onClick={() => onNewRecord(h.id)}>
                  新增修整记录
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
