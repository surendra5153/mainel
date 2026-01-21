import { useState, useEffect } from "react";
import { notifySuccess, notifyError } from "../utils/toast";

export default function EditSkillModal({ isOpen, onClose, item, onSave }) {
  const [level, setLevel] = useState(item?.level || "beginner");
  const [description, setDescription] = useState(item?.description || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLevel(item?.level || "beginner");
    setDescription(item?.description || "");
  }, [item]);

  if (!isOpen) return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ level, description });
      notifySuccess("Saved");
      onClose();
    } catch (err) {
      console.error(err);
      notifyError("Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit {item?.name}</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <label className="block">
            <div className="text-sm mb-1">Level</div>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full border px-3 py-2 rounded">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm mb-1">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border px-3 py-2 rounded" />
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
