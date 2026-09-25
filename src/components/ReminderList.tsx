import { useState } from "react";
import type { Horse, Review, TrimRecord } from "../types";
import { HOOF_LABEL, daysOverdue, todayStr } from "../utils";

interface Props {
  horses: Horse[];
  records: TrimRecord[];
  reviews: Review[];
  onComplete: (reviewId: string, result: string) => void;
  onOpenDetail: (horseId: string) => void;
}

export default function ReminderList({
  horses,
  records,
  reviews,
  onComplete,
  onOpenDetail,
}: Props) {
  const today = todayStr();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [result, setResult] = useState("");

  const due = reviews
    .filter((r) => r.status === "pending" && daysOverdue(r.dueDate, today) >= 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const horseOf = (id: string) => horses.find((h) => h.id === id);
  const recordOf = (id: string) => records.find((r) => r.id === id);

  const submitComplete = (reviewId: string) => {
    onComplete(reviewId, result.trim() || "复查完成，未见异常");
    setCompletingId(null);
    setResult("");
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>复查提醒</p>
          <h2>已到期待复查（{due.length}）</h2>
        </div>
      </div>

      {due.length === 0 && (
        <p className="empty">暂无到期的复查，所有马匹都在观察期内。</p>
      )}

      <div className="records">
        {due.map((r) => {
          const horse = horseOf(r.horseId);
          const record = recordOf(r.recordId);
          const overdueDays = daysOverdue(r.dueDate, today);
          const abnormalHooves = record
            ? record.hooves.filter((h) => h.abnormal)
            : [];
          return (
            <article key={r.id} className="reminder-card">
              <div className="reminder-main">
                <h3>
                  {horse ? `${horse.code} · ${horse.name}` : "未知马匹"}
                  <span className="tag warn">
                    {overdueDays === 0 ? "今天到期" : `已逾期 ${overdueDays} 天`}
                  </span>
                </h3>
                <p>
                  应复查日期：{r.dueDate}
                  {record && (
                    <>
                      {" "}
                      · 上次修整：{record.date} · {record.shoeType} ·{" "}
                      {record.nailPattern}
                    </>
                  )}
                </p>
                {abnormalHooves.length > 0 && (
                  <p className="danger-text">
                    上次异常：
                    {abnormalHooves
                      .map((h) => `${HOOF_LABEL[h.position]}（${h.problem}）`)
                      .join("；")}
                  </p>
                )}
              </div>
              <div className="actions">
                {horse && (
                  <button onClick={() => onOpenDetail(horse.id)}>查看档案</button>
                )}
                {completingId === r.id ? (
                  <>
                    <input
                      placeholder="复查结论，如：恢复正常 / 仍需观察"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                    />
                    <button
                      className="primary"
                      onClick={() => submitComplete(r.id)}
                    >
                      确认完成
                    </button>
                    <button onClick={() => setCompletingId(null)}>取消</button>
                  </>
                ) : (
                  <button
                    className="primary"
                    onClick={() => {
                      setCompletingId(r.id);
                      setResult("");
                    }}
                  >
                    完成复查
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
