import { useState } from "react";
import type { HoofEntry, HoofPosition, Horse, TrimRecord } from "../types";
import {
  HOOF_POSITIONS,
  NAIL_OPTIONS,
  SHAPE_OPTIONS,
  SHOE_OPTIONS,
  WEAR_OPTIONS,
  addDays,
  todayStr,
  uid,
} from "../utils";

interface Props {
  horse: Horse;
  onSave: (record: TrimRecord) => void;
  onClose: () => void;
}

function emptyHooves(): HoofEntry[] {
  return HOOF_POSITIONS.map((p) => ({
    position: p.key,
    shape: "正常",
    wear: "均匀",
    abnormal: false,
    problem: "",
  }));
}

export default function RecordForm({ horse, onSave, onClose }: Props) {
  const today = todayStr();
  const [date, setDate] = useState(today);
  const [nextReviewDate, setNextReviewDate] = useState(addDays(today, 42));
  const [shoeType, setShoeType] = useState(SHOE_OPTIONS[0]);
  const [nailPattern, setNailPattern] = useState(NAIL_OPTIONS[0]);
  const [gaitNote, setGaitNote] = useState("");
  const [hooves, setHooves] = useState<HoofEntry[]>(emptyHooves());
  const [errors, setErrors] = useState<string[]>([]);

  const updateHoof = (pos: HoofPosition, patch: Partial<HoofEntry>) => {
    setHooves((list) =>
      list.map((h) => (h.position === pos ? { ...h, ...patch } : h))
    );
  };

  const handleSubmit = () => {
    const problems: string[] = [];
    if (!date) problems.push("请填写修蹄日期");
    if (!nextReviewDate) problems.push("请填写下次复查日期");
    if (!shoeType.trim()) problems.push("请填写蹄铁类型");
    if (!nailPattern.trim()) problems.push("请填写钉位");
    for (const h of hooves) {
      const label = HOOF_POSITIONS.find((p) => p.key === h.position)!.label;
      if (!h.shape.trim()) problems.push(`请填写${label}的蹄形评估`);
      if (!h.wear.trim()) problems.push(`请填写${label}的磨耗情况`);
      if (h.abnormal && !h.problem.trim()) {
        problems.push(`${label}已标记异常，必须写清异常问题`);
      }
    }
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    onSave({
      id: uid(),
      horseId: horse.id,
      date,
      nextReviewDate,
      shoeType: shoeType.trim(),
      nailPattern: nailPattern.trim(),
      gaitNote: gaitNote.trim(),
      hooves: hooves.map((h) => ({
        ...h,
        problem: h.abnormal ? h.problem.trim() : "",
      })),
      photos: [],
      createdAt: Date.now(),
    });
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="heading">
          <div>
            <p>新增修整记录</p>
            <h2>
              {horse.code} · {horse.name}
            </h2>
          </div>
          <button onClick={onClose}>关闭</button>
        </div>

        <div className="field-grid">
          <label>
            <span>修蹄日期 *</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            <span>下次复查日期 *</span>
            <input
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
            />
          </label>
          <label>
            <span>蹄铁类型 *</span>
            <input
              list="shoe-options"
              value={shoeType}
              onChange={(e) => setShoeType(e.target.value)}
            />
            <datalist id="shoe-options">
              {SHOE_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </label>
          <label>
            <span>钉位 *</span>
            <input
              list="nail-options"
              value={nailPattern}
              onChange={(e) => setNailPattern(e.target.value)}
            />
            <datalist id="nail-options">
              {NAIL_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </label>
          <label className="span-2">
            <span>步态问题</span>
            <input
              placeholder="如：右前蹄落地略重；无异常可留空"
              value={gaitNote}
              onChange={(e) => setGaitNote(e.target.value)}
            />
          </label>
        </div>

        <h3 className="section-title">四蹄评估（逐蹄记录蹄位、蹄形与磨耗）</h3>
        <div className="hoof-grid">
          {hooves.map((h) => {
            const label = HOOF_POSITIONS.find(
              (p) => p.key === h.position
            )!.label;
            return (
              <fieldset
                key={h.position}
                className={h.abnormal ? "hoof-card abnormal" : "hoof-card"}
              >
                <legend>
                  {label}
                  {h.abnormal && <em className="tag danger">异常</em>}
                </legend>
                <label>
                  <span>蹄形评估 *</span>
                  <input
                    list="shape-options"
                    value={h.shape}
                    onChange={(e) =>
                      updateHoof(h.position, { shape: e.target.value })
                    }
                  />
                </label>
                <label>
                  <span>磨耗情况 *</span>
                  <input
                    list="wear-options"
                    value={h.wear}
                    onChange={(e) =>
                      updateHoof(h.position, { wear: e.target.value })
                    }
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={h.abnormal}
                    onChange={(e) =>
                      updateHoof(h.position, { abnormal: e.target.checked })
                    }
                  />
                  <span>标记为异常</span>
                </label>
                {h.abnormal && (
                  <label>
                    <span>异常问题 *（必须写清）</span>
                    <textarea
                      rows={2}
                      placeholder={`描述${label}的具体问题`}
                      value={h.problem}
                      onChange={(e) =>
                        updateHoof(h.position, { problem: e.target.value })
                      }
                    />
                  </label>
                )}
              </fieldset>
            );
          })}
        </div>
        <datalist id="shape-options">
          {SHAPE_OPTIONS.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <datalist id="wear-options">
          {WEAR_OPTIONS.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>

        {errors.length > 0 && (
          <div className="error-box">
            {errors.map((err) => (
              <p key={err}>· {err}</p>
            ))}
          </div>
        )}

        <div className="actions">
          <button onClick={onClose}>取消</button>
          <button className="primary" onClick={handleSubmit}>
            保存记录（自动生成复查提醒）
          </button>
        </div>
      </div>
    </div>
  );
}
