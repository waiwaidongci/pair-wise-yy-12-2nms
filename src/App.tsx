import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { DB, Horse, PhotoNote, TrimRecord } from "./types";
import { loadDb, saveDb } from "./store";
import { daysOverdue, todayStr, uid } from "./utils";
import HorseList from "./components/HorseList";
import ReminderList from "./components/ReminderList";
import HorseDetail from "./components/HorseDetail";
import RecordForm from "./components/RecordForm";

type View = "horses" | "reminders" | "detail";

function App() {
  const [db, setDb] = useState<DB>(() => loadDb());
  const [view, setView] = useState<View>("horses");
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [recordFormHorseId, setRecordFormHorseId] = useState<string | null>(null);
  const [persistError, setPersistError] = useState("");

  // 任何变更都写回 localStorage，刷新/重开页面后仍可查到
  useEffect(() => {
    const ok = saveDb(db);
    setPersistError(ok ? "" : "本地存储空间不足，照片可能过大，数据未能保存");
  }, [db]);

  const today = todayStr();

  const dueReviews = useMemo(
    () =>
      db.reviews.filter(
        (r) => r.status === "pending" && daysOverdue(r.dueDate, today) >= 0
      ),
    [db.reviews, today]
  );

  const abnormalHorseCount = useMemo(() => {
    let count = 0;
    for (const h of db.horses) {
      const latest = db.records
        .filter((r) => r.horseId === h.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latest && latest.hooves.some((x) => x.abnormal)) count += 1;
    }
    return count;
  }, [db.horses, db.records]);

  const addHorse = (horse: Horse) =>
    setDb((d) => ({ ...d, horses: [...d.horses, horse] }));

  const addRecord = (record: TrimRecord) => {
    setDb((d) => ({
      ...d,
      records: [...d.records, record],
      reviews: [
        ...d.reviews,
        {
          id: uid(),
          horseId: record.horseId,
          recordId: record.id,
          dueDate: record.nextReviewDate,
          status: "pending",
        },
      ],
    }));
    setRecordFormHorseId(null);
  };

  const completeReview = (reviewId: string, result: string) =>
    setDb((d) => ({
      ...d,
      reviews: d.reviews.map((r) =>
        r.id === reviewId
          ? { ...r, status: "done", doneDate: todayStr(), result }
          : r
      ),
    }));

  const addPhoto = (recordId: string, photo: PhotoNote) =>
    setDb((d) => ({
      ...d,
      records: d.records.map((r) =>
        r.id === recordId ? { ...r, photos: [...r.photos, photo] } : r
      ),
    }));

  const deletePhoto = (recordId: string, photoId: string) =>
    setDb((d) => ({
      ...d,
      records: d.records.map((r) =>
        r.id === recordId
          ? { ...r, photos: r.photos.filter((p) => p.id !== photoId) }
          : r
      ),
    }));

  const openDetail = (horseId: string) => {
    setSelectedHorseId(horseId);
    setView("detail");
  };

  const selectedHorse = db.horses.find((h) => h.id === selectedHorseId);
  const recordFormHorse = db.horses.find((h) => h.id === recordFormHorseId);

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62011 · 马术蹄铁修整档案</p>
        <h1>蹄铁师工作台</h1>
        <span>
          逐匹马维护修整档案：四蹄蹄形与磨耗、异常标记、蹄铁类型与钉位改动、
          复查提醒与照片备注，全部保存在本机浏览器中。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>马匹档案</small>
          <strong>{db.horses.length}</strong>
        </article>
        <article>
          <small>待复查（已到期）</small>
          <strong>{dueReviews.length}</strong>
        </article>
        <article>
          <small>异常标记马匹</small>
          <strong>{abnormalHorseCount}</strong>
        </article>
        <article>
          <small>修整记录</small>
          <strong>{db.records.length}</strong>
        </article>
      </section>

      {persistError && <p className="error-text">{persistError}</p>}

      <nav className="tabs">
        <button
          className={view === "horses" ? "active" : ""}
          onClick={() => setView("horses")}
        >
          马匹列表
        </button>
        <button
          className={view === "reminders" ? "active" : ""}
          onClick={() => setView("reminders")}
        >
          复查提醒{dueReviews.length > 0 && `（${dueReviews.length}）`}
        </button>
        {view === "detail" && selectedHorse && (
          <button className="active">档案：{selectedHorse.code}</button>
        )}
      </nav>

      {view === "horses" && (
        <HorseList
          horses={db.horses}
          records={db.records}
          reviews={db.reviews}
          onOpenDetail={openDetail}
          onNewRecord={(id) => setRecordFormHorseId(id)}
          onAddHorse={addHorse}
        />
      )}

      {view === "reminders" && (
        <ReminderList
          horses={db.horses}
          records={db.records}
          reviews={db.reviews}
          onComplete={completeReview}
          onOpenDetail={openDetail}
        />
      )}

      {view === "detail" && selectedHorse && (
        <HorseDetail
          horse={selectedHorse}
          records={db.records}
          reviews={db.reviews}
          onBack={() => setView("horses")}
          onNewRecord={() => setRecordFormHorseId(selectedHorse.id)}
          onAddPhoto={addPhoto}
          onDeletePhoto={deletePhoto}
        />
      )}

      {recordFormHorse && (
        <RecordForm
          horse={recordFormHorse}
          onSave={addRecord}
          onClose={() => setRecordFormHorseId(null)}
        />
      )}
    </main>
  );
}

export default App;
