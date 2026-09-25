import { useState } from "react";
import type { Photo } from "../types";
import { fileToPhotoDataUrl, uid } from "../utils";

interface Props {
  photos: Photo[];
  onAdd?: (photo: Photo) => void;
  onRemove?: (id: string) => void;
  onCaptionChange?: (id: string, caption: string) => void;
  readOnly?: boolean;
}

export function PhotoField({ photos, onAdd, onRemove, onCaptionChange, readOnly }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !onAdd) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await fileToPhotoDataUrl(file);
        onAdd({ id: uid("photo"), dataUrl, caption: "", createdAt: new Date().toISOString() });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "照片处理失败");
    } finally {
      setBusy(false);
    }
  }

  if (photos.length === 0 && readOnly) {
    return <p className="muted">暂无照片</p>;
  }

  return (
    <div className="photo-field">
      <div className="photo-thumbs">
        {photos.map((p) => (
          <figure key={p.id} className="photo-thumb">
            <img src={p.dataUrl} alt={p.caption || "修整照片"} />
            {!readOnly && onCaptionChange ? (
              <input
                value={p.caption}
                placeholder="照片备注"
                onChange={(e) => onCaptionChange(p.id, e.target.value)}
              />
            ) : (
              p.caption && <figcaption>{p.caption}</figcaption>
            )}
            {!readOnly && onRemove && (
              <button type="button" className="photo-del" onClick={() => onRemove(p.id)}>
                ×
              </button>
            )}
          </figure>
        ))}
        {!readOnly && (
          <label className="photo-add">
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {busy ? "处理中…" : "＋ 拍照 / 选图"}
          </label>
        )}
      </div>
    </div>
  );
}
