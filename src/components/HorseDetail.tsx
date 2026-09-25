import { useMemo, useRef, useState } from "react";
import type {
  Horse,
  HoofPosition,
  PhotoNote,
  Review,
  TrimRecord,
} from "../types";
import {
  HOOF_LABEL,
  HOOF_POSITIONS,
  daysOverdue,
  diffRecords,
  fileToDataUrl,
  todayStr,
  uid,
} from "../utils";

interface Props {
  horse: Horse;
  records: TrimRecord[];
  reviews: Review[];
  onBack: () => void;
  onNewRecord: () => void;
  onAddPhoto: (recordId: string, photo: PhotoNote) => void;
  onDeletePhoto: (recordId: string, photoId: string) => void;
}

export default function HorseDetail({
  horse,
  records,
  reviews,
  onBack,
  onNewRecord,
  onAddPhoto,
  onDeletePhoto,
}: Props) {
  const today = todayStr();
  // 严格按 horseId 过滤，保证不同马的记录不混
  const horseRecords = useMemo(
    () =>
      records
        .filter((r) => r.horseId === horse.id)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [records, horse.id]
  );
  const horseReviews = reviews.filter((r) => r.horseId === horse.id);

  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [photoHoof, setPhotoHoof] = useState<HoofPosition | "">("");
  const [photoText, setPhotoText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reviewOf = (recordId: string) =>
    horseReviews.find((r) => r.recordId === recordId);

  const submitPhoto = async (recordId: string) => {
    if (!photoText.trim() && !photoFile) {
      setPhotoError("请填写备注或选择照片");
      return;
    }
    try {
      const image = photoFile ? await fileToDataUrl(photoFile) : undefined;
      onAddPhoto(recordId, {
        id: uid(),
        hoof: photoHoof,
        note: photoText.trim(),
        image,
        createdAt: Date.now(),
      });
      setPhotoFor(null);
      setPhotoText("");
      setPhotoHoof("");
      setPhotoFile(null);
      setPhotoError("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setPhotoError("照片处理失败，请换一张试试");
    }
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>马匹档案</p>
          <h2>
            {horse.code} · {horse.name}
            <span className="tag ok">{horse.status}</span>
          </h2>
        </div>
        <div className="actions">
          <button onClick={onBack}>返回列表</button>
          <button className="primary" onClick={onNewRecord}>
            新增修整记录
          </button>
        </div>
      </div>
      {horse.note && <p className="muted">{horse.note}</p>}

      {horseRecords.length === 0 && (
        <p className="empty">还没有修整记录，点击右上角「新增修整记录」开始。</p>
      )}

      {horseRecords.map((record, index) => {
        const prev = horseRecords[index + 1]; // 时间上更早的一条
        const changes = diffRecords(record, prev);
        const review = reviewOf(record.id);
        const reviewDue =
          review &&
          review.status === "pending" &&
          daysOverdue(review.dueDate, today) >= 0;
        return (
          <article key={record.id} className="record-card">
            <header className="record-head">
              <div>
                <h3>修整日期：{record.date}</h3>
                <p>
                  蹄铁类型：{record.shoeType} · 钉位：{record.nailPattern}
                  {record.gaitNote && ` · 步态：${record.gaitNote}`}
                </p>
                <p>
                  下次复查：{record.nextReviewDate}{" "}
                  {review?.status === "done" ? (
                    <span className="tag ok">
                      已复查（{review.doneDate}）
                    </span>
                  ) : reviewDue ? (
                    <span className="tag warn">复查已到期</span>
                  ) : (
                    <span className="tag">待复查</span>
                  )}
                </p>
                {review?.status === "done" && review.result && (
                  <p className="muted">复查结论：{review.result}</p>
                )}
              </div>
            </header>

            <table className="hoof-table">
              <thead>
                <tr>
                  <th>蹄位</th>
                  <th>蹄形</th>
                  <th>磨耗</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {record.hooves.map((h) => (
                  <tr key={h.position} className={h.abnormal ? "row-abnormal" : ""}>
                    <td>{HOOF_LABEL[h.position]}</td>
                    <td>{h.shape}</td>
                    <td>{h.wear}</td>
                    <td>
                      {h.abnormal ? (
                        <span className="tag danger">异常：{h.problem}</span>
                      ) : (
                        <span className="tag ok">正常</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="diff-box">
              <h4>与上次对比</h4>
              {!prev && <p className="muted">首次记录，无历史可对比。</p>}
              {prev && changes.length === 0 && (
                <p className="muted">与 {prev.date} 的记录一致，无变化。</p>
              )}
              {prev && changes.length > 0 && (
                <ul>
                  {changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="photo-box">
              <div className="photo-head">
                <h4>照片备注（{record.photos.length}）</h4>
                <button
                  onClick={() => {
                    setPhotoFor(photoFor === record.id ? null : record.id);
                    setPhotoError("");
                  }}
                >
                  {photoFor === record.id ? "收起" : "补照片/备注"}
                </button>
              </div>

              {record.photos.length > 0 && (
                <div className="photo-list">
                  {record.photos.map((p) => (
                    <figure key={p.id}>
                      {p.image && <img src={p.image} alt={p.note || "蹄部照片"} />}
                      <figcaption>
                        {p.hoof && <b>{HOOF_LABEL[p.hoof]} · </b>}
                        {p.note || "（无文字备注）"}
                      </figcaption>
                      <button
                        className="link-danger"
                        onClick={() => onDeletePhoto(record.id, p.id)}
                      >
                        删除
                      </button>
                    </figure>
                  ))}
                </div>
              )}

              {photoFor === record.id && (
                <div className="inline-form">
                  <div className="field-grid">
                    <label>
                      <span>关联蹄位（可选）</span>
                      <select
                        value={photoHoof}
                        onChange={(e) =>
                          setPhotoHoof(e.target.value as HoofPosition | "")
                        }
                      >
                        <option value="">不指定</option>
                        {HOOF_POSITIONS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>照片（可选，本地保存）</span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setPhotoFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    <label className="span-2">
                      <span>备注</span>
                      <input
                        placeholder="如：右前蹄外侧蹄壁恢复情况"
                        value={photoText}
                        onChange={(e) => setPhotoText(e.target.value)}
                      />
                    </label>
                  </div>
                  {photoError && <p className="error-text">{photoError}</p>}
                  <div className="actions">
                    <button
                      className="primary"
                      onClick={() => submitPhoto(record.id)}
                    >
                      保存备注
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
