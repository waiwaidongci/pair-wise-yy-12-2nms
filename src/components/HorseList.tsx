import { useMemo, useState } from "react";
import type { Archive } from "../types";
import { daysFromToday, formatDate } from "../utils";
import { isDue, isPending, summarizeHorse } from "../archiveLogic";

interface Props {
  archive: Archive;
  now: string;
  filter: "全部" | "前蹄" | "后蹄" | "运动马" | "休养马";
  selectedHorseId: string | null;
  onSelect: (horseId: string) => void;
  onAddHorse: () => void;
}

/** 马匹列表：同步显示每匹马的待复查数与异常标记 */
export function HorseList({ archive, now, filter, selectedHorseId, onSelect, onAddHorse }: Props) {
  const [keyword, setKeyword] = useState("");

  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return archive.horses
      .map((horse) => {
        const trims = archive.trims.filter((t) => t.horseId === horse.id);
        return { horse, summary: summarizeHorse(trims, now), trims };
      })
      .filter(({ horse, trims }) => {
        if (kw && !`${horse.code} ${horse.name}`.toLowerCase().includes(kw)) return false;
        if (filter === "运动马" || filter === "休养马") return horse.category === filter;
        if (filter === "前蹄" || filter === "后蹄") {
          const latest = [...trims].sort((a, b) => b.date.localeCompare(a.date))[0];
          if (!latest) return false;
          const ids = filter === "前蹄" ? ["LF", "RF"] : ["LH", "RH"];
          return ids.some((id) => latest.hooves[id as keyof typeof latest.hooves].abnormal);
        }
        return true;
      })
      .sort((a, b) => {
        // 有到期复查的排最前
        if (a.summary.dueCount !== b.summary.dueCount) return b.summary.dueCount - a.summary.dueCount;
        return a.horse.code.localeCompare(b.horse.code);
      });
  }, [archive, now, filter, keyword]);

  return (
    <section className="panel horse-list">
      <div className="heading">
        <div>
          <p className="eyebrow">马匹档案</p>
          <h2>
            马匹列表 <small>{rows.length}</small>
          </h2>
        </div>
        <button className="primary" onClick={onAddHorse}>
          ＋ 新马匹
        </button>
      </div>
      <input
        className="search"
        placeholder="按编号 / 马名搜索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ul>
        {rows.map(({ horse, summary }) => (
          <li key={horse.id}>
            <button
              className={`horse-row${selectedHorseId === horse.id ? " selected" : ""}${
                summary.dueCount > 0 ? " due" : ""
              }`}
              onClick={() => onSelect(horse.id)}
            >
              <div className="horse-row-main">
                <strong>
                  {horse.code}
                  {horse.name ? <span className="horse-name"> {horse.name}</span> : null}
                </strong>
                <span className="horse-cat">{horse.category}</span>
              </div>
              <div className="horse-row-badges">
                {summary.hasAbnormal && <span className="badge badge-danger">异常</span>}
                {summary.dueCount > 0 ? (
                  <span className="badge badge-due">到期 {summary.dueCount}</span>
                ) : summary.pendingCount > 0 ? (
                  <span className="badge badge-wait">待复查 {summary.pendingCount}</span>
                ) : (
                  <span className="badge badge-ok">已跟进</span>
                )}
              </div>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="muted empty-tip">没有匹配的马匹</li>}
      </ul>
      <p className="list-foot">
        数据保存在本机浏览器（localStorage），共 {archive.trims.length} 条修整记录
      </p>
    </section>
  );
}

interface RemindersProps {
  archive: Archive;
  now: string;
  onOpenHorse: (horseId: string) => void;
  onRecheck: (trimId: string) => void;
}

/** 复查提醒：只列到期且未完成的记录，完成复查后即从这里移走 */
export function Reminders({ archive, now, onOpenHorse, onRecheck }: RemindersProps) {
  const due = useMemo(() => {
    return archive.trims
      .filter((t) => isDue(t, now))
      .map((t) => ({ trim: t, horse: archive.horses.find((h) => h.id === t.horseId) }))
      .filter((x): x is { trim: NonNullable<typeof x.trim>; horse: NonNullable<typeof x.horse> } =>
        Boolean(x.horse)
      )
      .sort((a, b) => a.trim.nextRecheckDate.localeCompare(b.trim.nextRecheckDate));
  }, [archive, now]);

  const upcoming = useMemo(() => {
    return archive.trims
      .filter((t) => isPending(t) && !isDue(t, now) && daysFromToday(t.nextRecheckDate, now) <= 7)
      .map((t) => ({ trim: t, horse: archive.horses.find((h) => h.id === t.horseId) }))
      .filter((x): x is { trim: NonNullable<typeof x.trim>; horse: NonNullable<typeof x.horse> } =>
        Boolean(x.horse)
      )
      .sort((a, b) => a.trim.nextRecheckDate.localeCompare(b.trim.nextRecheckDate));
  }, [archive, now]);

  return (
    <section className="panel reminders">
      <div className="heading">
        <div>
          <p className="eyebrow">复查提醒</p>
          <h2>
            待办复查 <small>{due.length}</small>
          </h2>
        </div>
      </div>

      {due.length === 0 ? (
        <p className="muted empty-tip">当前没有到期的复查，所有马匹都在跟进周期内。</p>
      ) : (
        <ul className="reminder-list">
          {due.map(({ trim, horse }) => {
            const overdue = -daysFromToday(trim.nextRecheckDate, now);
            return (
              <li key={trim.id} className="reminder-item is-due">
                <div>
                  <strong>
                    {horse.code} {horse.name}
                  </strong>
                  <p>
                    复查日 {formatDate(trim.nextRecheckDate)}
                    {overdue > 0 ? ` · 已逾期 ${overdue} 天` : " · 今天到期"}
                  </p>
                </div>
                <div className="reminder-actions">
                  <button onClick={() => onOpenHorse(horse.id)}>档案</button>
                  <button className="primary" onClick={() => onRecheck(trim.id)}>
                    完成复查
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {upcoming.length > 0 && (
        <>
          <h4 className="reminder-sub">7 天内即将到期</h4>
          <ul className="reminder-list">
            {upcoming.map(({ trim, horse }) => (
              <li key={trim.id} className="reminder-item">
                <div>
                  <strong>
                    {horse.code} {horse.name}
                  </strong>
                  <p>
                    {formatDate(trim.nextRecheckDate)} · 还有 {daysFromToday(trim.nextRecheckDate, now)} 天
                  </p>
                </div>
                <button onClick={() => onOpenHorse(horse.id)}>档案</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
