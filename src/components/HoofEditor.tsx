import type { HoofId, HoofState } from "../types";
import { HOOF_META, SHAPE_OPTIONS, WEAR_OPTIONS, SHOE_OPTIONS } from "../constants";

interface Props {
  hoofId: HoofId;
  value: HoofState;
  /** 上一次同蹄状态，传入时在卡片顶部显示对比摘要 */
  previous?: HoofState;
  onChange: (next: HoofState) => void;
}

export function HoofEditor({ hoofId, value, previous, onChange }: Props) {
  const meta = HOOF_META[hoofId];
  const set = <K extends keyof HoofState>(key: K, v: HoofState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <article className={`hoof-card${value.abnormal ? " is-abnormal" : ""}`}>
      <header className="hoof-head">
        <div>
          <span className="hoof-pos-tag">{meta.group}</span>
          <h4>{meta.label}</h4>
        </div>
        <label className="abnormal-toggle">
          <input
            type="checkbox"
            checked={value.abnormal}
            onChange={(e) => set("abnormal", e.target.checked)}
          />
          异常
        </label>
      </header>

      {previous && (
        <p className="hoof-prev">
          上次：{previous.shape || "—"} · {previous.wear || "—"}
          {previous.abnormal ? " · 上次标记异常" : ""}
        </p>
      )}

      <div className="hoof-fields">
        <label>
          <span>蹄形评估 *</span>
          <select value={value.shape} onChange={(e) => set("shape", e.target.value)}>
            <option value="">请选择蹄形</option>
            {SHAPE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>磨耗情况 *</span>
          <select value={value.wear} onChange={(e) => set("wear", e.target.value)}>
            <option value="">请选择磨耗</option>
            {WEAR_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>蹄铁类型 *</span>
          <select value={value.shoeType} onChange={(e) => set("shoeType", e.target.value)}>
            <option value="">请选择蹄铁</option>
            {SHOE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>钉位</span>
          <input
            value={value.nailPositions}
            placeholder="如：标准7钉位 / 外侧第3钉略浅"
            onChange={(e) => set("nailPositions", e.target.value)}
          />
        </label>
      </div>

      {value.abnormal ? (
        <label className="problem-field">
          <span>异常问题描述 *（蹄位：{meta.label}）</span>
          <textarea
            value={value.problem}
            rows={2}
            placeholder={`写清${meta.label}的具体问题，如裂纹长度、磨耗部位、跛行表现`}
            onChange={(e) => set("problem", e.target.value)}
          />
        </label>
      ) : (
        <p className="normal-hint">正常 —— 本次按蹄位「{meta.label}」归档，无需填写异常说明</p>
      )}
    </article>
  );
}
