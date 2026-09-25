import { useState } from "react";
import type { HorseCategory } from "../types";

interface Props {
  existingCodes: string[];
  onSubmit: (data: { code: string; name: string; category: HorseCategory }) => void;
  onCancel: () => void;
}

export function HorseForm({ existingCodes, onSubmit, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HorseCategory>("运动马");
  const [error, setError] = useState("");

  function submit() {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("请填写马匹编号");
      return;
    }
    if (existingCodes.includes(trimmed)) {
      setError(`编号 ${trimmed} 已存在，请换一个`);
      return;
    }
    onSubmit({ code: trimmed, name: name.trim(), category });
  }

  return (
    <div className="horse-form">
      <h3>新增马匹档案</h3>
      {error && <div className="form-error">{error}</div>}
      <div className="form-row-3">
        <label>
          <span>马匹编号 *</span>
          <input
            autoFocus
            value={code}
            placeholder="如 HORSE-38"
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        <label>
          <span>马名 / 昵称</span>
          <input value={name} placeholder="如 追风" onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>用途分类</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as HorseCategory)}>
            <option>运动马</option>
            <option>休养马</option>
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button onClick={onCancel}>取消</button>
        <button className="primary" onClick={submit}>
          建立档案
        </button>
      </div>
    </div>
  );
}
