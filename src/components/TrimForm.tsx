import { useMemo, useState } from "react";
import type { Horse, Photo, Trim } from "../types";
import { HOOF_ORDER, HOOF_META, emptyHooves } from "../constants";
import { addDays, today } from "../utils";
import { HoofEditor } from "./HoofEditor";
import { PhotoField } from "./PhotoField";

interface Props {
  horse: Horse;
  /** 完成复查时传入待复查的旧记录；新增修整时为 null */
  recheckSource?: Trim | null;
  onSubmit: (data: {
    date: string;
    nextRecheckDate: string;
    gaitIssue: string;
    hooves: Trim["hooves"];
    photos: Photo[];
    note: string;
  }) => void;
  onCancel: () => void;
}

/**
 * 新增修整 / 完成复查共用表单。
 * 复查时默认带出上一次四蹄记录，便于直接在原值上调整。
 */
export function TrimForm({ horse, recheckSource, onSubmit, onCancel }: Props) {
  const defaults = useMemo(() => {
    if (recheckSource) {
      // 深拷贝，避免直接改到已保存记录
      return {
        date: today(),
        nextRecheckDate: addDays(today(), 28),
        gaitIssue: recheckSource.gaitIssue,
        hooves: JSON.parse(JSON.stringify(recheckSource.hooves)) as Trim["hooves"],
        photos: [] as Photo[],
        note: "",
      };
    }
    return {
      date: today(),
      nextRecheckDate: addDays(today(), 42),
      gaitIssue: "",
      hooves: emptyHooves(),
      photos: [] as Photo[],
      note: "",
    };
  }, [recheckSource]);

  const [date, setDate] = useState(defaults.date);
  const [nextRecheckDate, setNextRecheckDate] = useState(defaults.nextRecheckDate);
  const [gaitIssue, setGaitIssue] = useState(defaults.gaitIssue);
  const [hooves, setHooves] = useState<Trim["hooves"]>(defaults.hooves);
  const [photos, setPhotos] = useState<Photo[]>(defaults.photos);
  const [note, setNote] = useState(defaults.note);
  const [error, setError] = useState("");

  function updateHoof(id: keyof Trim["hooves"], next: Trim["hooves"][typeof id]) {
    setHooves((prev) => ({ ...prev, [id]: next }));
  }

  function handleSubmit() {
    // 校验：四蹄的蹄形/磨耗/蹄铁必须填写
    for (const id of HOOF_ORDER) {
      const h = hooves[id];
      const missing: string[] = [];
      if (!h.shape) missing.push("蹄形");
      if (!h.wear) missing.push("磨耗");
      if (!h.shoeType) missing.push("蹄铁类型");
      if (missing.length > 0) {
        setError(`「${HOOF_META[id].label}」缺少：${missing.join("、")}`);
        return;
      }
      // 某蹄标为异常时必须写清问题
      if (h.abnormal && !h.problem.trim()) {
        setError(`「${HOOF_META[id].label}」已标记异常，请写清问题描述`);
        return;
      }
    }
    if (!date) {
      setError("请选择修整日期");
      return;
    }
    if (nextRecheckDate && nextRecheckDate < date) {
      setError("下一复查日不能早于本次修整日期");
      return;
    }
    setError("");
    onSubmit({ date, nextRecheckDate, gaitIssue, hooves, photos, note });
  }

  return (
    <div className="trim-form">
      <div className="trim-form-head">
        <div>
          <p className="eyebrow">{recheckSource ? "完成复查" : "新增修整"}</p>
          <h3>
            {horse.code} {horse.name}
          </h3>
          {recheckSource && (
            <p className="muted">
              上次修整 {recheckSource.date}，复查日 {recheckSource.nextRecheckDate}
            </p>
          )}
        </div>
        <div className="form-actions">
          <button onClick={onCancel}>取消</button>
          <button className="primary" onClick={handleSubmit}>
            {recheckSource ? "完成复查并保存" : "保存修整记录"}
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-row-3">
        <label>
          <span>本次修整日期 *</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>下一复查日（留空则不提醒）</span>
          <input
            type="date"
            value={nextRecheckDate}
            onChange={(e) => setNextRecheckDate(e.target.value)}
          />
        </label>
        <label className="gait-field">
          <span>步态问题（无异常可留空）</span>
          <input
            value={gaitIssue}
            placeholder="如：右前肢运步偏紧、转弯时躲闪"
            onChange={(e) => setGaitIssue(e.target.value)}
          />
        </label>
      </div>

      <div className="hoof-grid">
        {HOOF_ORDER.map((id) => (
          <HoofEditor
            key={id}
            hoofId={id}
            value={hooves[id]}
            previous={recheckSource?.hooves[id]}
            onChange={(next) => updateHoof(id, next)}
          />
        ))}
      </div>

      <div className="form-block">
        <span className="block-label">照片与备注</span>
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
          placeholder="本次修整总体备注，如训练调整建议、用料等"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
}
