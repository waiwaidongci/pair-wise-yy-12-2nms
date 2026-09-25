import { useState } from "react";
import type { Horse, Photo, Trim } from "../types";
import { HOOF_META, HOOF_ORDER } from "../constants";
import { diffHooves, isPending } from "../archiveLogic";
import { daysFromToday, formatDate } from "../utils";
import { PhotoField } from "./PhotoField";

interface Props {
  horse: Horse;
  trims: Trim[];
  now: string;
  onNewTrim: () => void;
  onRecheck: (trimId: string) => void;
  onAppend: (trimId: string, additions: { photos?: Photo[]; note?: string }) => void;
}

export function HorseDetail({ horse, trims, now, onNewTrim, onRecheck, onAppend }: Props) {
  const sorted = [...trims].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="panel detail">
      <div className="heading">
        <div>
          <p className="eyebrow">
            {horse.code} · {horse.category}
          </p>
          <h2>{horse.name || "未命名"} 修整档案</h2>
        </div>
        <button className="primary" onClick={onNewTrim}>
          ＋ 新增修整
        </button>
      </div>

      {sorted.length === 0 && <p className="muted empty-tip">还没有修整记录，点击右上角新增第一次修整。</p>}

      <div className="timeline">
        {sorted.map((trim, index) => {
          // 按时间正序的上一条，即本次修整的“上次记录”
          const prev = sorted[index + 1];
          return (
            <TrimCard
              key={trim.id}
              trim={trim}
              previous={prev}
              now={now}
              onRecheck={() => onRecheck(trim.id)}
              onAppend={onAppend}
            />
          );
        })}
      </div>
    </section>
  );
}

function TrimCard({
  trim,
  previous,
  now,
  onRecheck,
  onAppend,
}: {
  trim: Trim;
  previous?: Trim;
  now: string;
  onRecheck: () => void;
  onAppend: Props["onAppend"];
}) {
  const [open, setOpen] = useState(false);
  const changes = previous ? diffHooves(previous, trim) : [];
  const changedHooves = changes.filter(
    (c) =>
      c.shapeChanged ||
      c.wearChanged ||
      c.abnormalCleared ||
      c.abnormalNew ||
      c.shoeChanged ||
      c.nailChanged
  );
  const shoeChanges = changes.filter((c) => c.shoeChanged || c.nailChanged);
  const abnormalHooves = HOOF_ORDER.filter((h) => trim.hooves[h].abnormal);
  const pending = isPending(trim);

  return (
    <article className={`trim-card${pending ? "" : " done"}`}>
      <header className="trim-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <strong>修整日 {formatDate(trim.date)}</strong>
          <p className="muted">
            下一复查 {formatDate(trim.nextRecheckDate) || "未安排"}
            {pending && trim.nextRecheckDate && trim.nextRecheckDate <= now && (
              <span className="badge badge-due inline">
                {trim.nextRecheckDate === now
                  ? "今天到期"
                  : `逾期 ${-daysFromToday(trim.nextRecheckDate, now)} 天`}
              </span>
            )}
            {!pending && <span className="badge badge-ok inline">复查已完成</span>}
          </p>
        </div>
        <div className="trim-head-right">
          {abnormalHooves.length > 0 && (
            <span className="badge badge-danger">{abnormalHooves.length} 蹄异常</span>
          )}
          {trim.photos.length > 0 && <span className="badge">📷 {trim.photos.length}</span>}
          <span className="caret">{open ? "收起 ▲" : "展开 ▼"}</span>
        </div>
      </header>

      {trim.gaitIssue && <p className="gait-line">步态：{trim.gaitIssue}</p>}

      {/* 变化摘要：与上次同一蹄对比 + 蹄铁类型/钉位改动 */}
      {previous && (
        <div className="change-summary">
          <h5>与上次（{formatDate(previous.date)}）对比</h5>
          {changedHooves.length === 0 ? (
            <p className="muted">四蹄蹄形、磨耗、蹄铁与钉位均无变化。</p>
          ) : (
            <ul>
              {changedHooves.map((c) => (
                <li key={c.hoof}>
                  <b>{c.label}：</b>
                  {c.abnormalNew && <span className="tag-new">新异常</span>}
                  {c.abnormalCleared && <span className="tag-cleared">异常解除</span>}
                  {c.shapeChanged && (
                    <span className="change-chip">
                      蹄形 {c.before.shape || "—"} → {c.after.shape}
                    </span>
                  )}
                  {c.wearChanged && (
                    <span className="change-chip">
                      磨耗 {c.before.wear || "—"} → {c.after.wear}
                    </span>
                  )}
                  {c.shoeChanged && (
                    <span className="change-chip shoe">
                      蹄铁 {c.before.shoeType || "—"} → {c.after.shoeType}
                    </span>
                  )}
                  {c.nailChanged && (
                    <span className="change-chip shoe">
                      钉位 {c.before.nailPositions || "—"} → {c.after.nailPositions || "—"}
                    </span>
                  )}
                  {c.abnormalNew && c.after.problem && <em> 问题：{c.after.problem}</em>}
                </li>
              ))}
            </ul>
          )}
          {shoeChanges.length === 0 && previous && (
            <p className="muted">蹄铁类型与钉位均未改动。</p>
          )}
        </div>
      )}
      {!previous && <p className="muted">这是该马的首次修整记录，暂无上次数据可对比。</p>}

      {open && (
        <div className="trim-body">
          <div className="hoof-state-grid">
            {HOOF_ORDER.map((id) => {
              const h = trim.hooves[id];
              return (
                <div key={id} className={`hoof-state${h.abnormal ? " is-abnormal" : ""}`}>
                  <h5>
                    {HOOF_META[id].label}
                    {h.abnormal ? <span className="badge badge-danger inline">异常</span> : <span className="badge badge-ok inline">正常</span>}
                  </h5>
                  <dl>
                    <dt>蹄形</dt>
                    <dd>{h.shape}</dd>
                    <dt>磨耗</dt>
                    <dd>{h.wear}</dd>
                    <dt>蹄铁</dt>
                    <dd>{h.shoeType}</dd>
                    <dt>钉位</dt>
                    <dd>{h.nailPositions || "—"}</dd>
                  </dl>
                  {h.abnormal && <p className="problem-text">问题：{h.problem}</p>}
                </div>
              );
            })}
          </div>

          {trim.note && <p className="note-line">备注：{trim.note}</p>}

          <PhotoField photos={trim.photos} readOnly />

          <AppendBox onSave={(additions) => onAppend(trim.id, additions)} />

          {pending && trim.nextRecheckDate && trim.nextRecheckDate <= now && (
            <button className="primary recheck-btn" onClick={onRecheck}>
              完成复查（登记本次复查结果）
            </button>
          )}
        </div>
      )}
    </article>
  );
}

/** 复查后补照片、补备注：保存后立即落盘，重新打开仍可查到 */
function AppendBox({
  onSave,
}: {
  onSave: (additions: { photos?: Photo[]; note?: string }) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    if (photos.length === 0 && !note.trim()) return;
    onSave({ photos: photos.length ? photos : undefined, note: note.trim() || undefined });
    setPhotos([]);
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="append-box">
      <h5>复查后补充照片 / 备注</h5>
      <PhotoField
        photos={photos}
        onAdd={(p) => setPhotos((prev) => [...prev, p])}
        onRemove={(pid) => setPhotos((prev) => prev.filter((p) => p.id !== pid))}
        onCaptionChange={(pid, caption) =>
          setPhotos((prev) => prev.map((p) => (p.id === pid ? { ...p, caption } : p)))
        }
      />
      <textarea
        rows={2}
        value={note}
        placeholder="补充备注，会追加到本次记录"
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="append-actions">
        <button onClick={save} disabled={photos.length === 0 && !note.trim()}>
          保存补充
        </button>
        {saved && <span className="muted">已保存到本次记录 ✓</span>}
      </div>
    </div>
  );
}
