import { useState } from "react";
import EditSkillModal from "./EditSkillModal";
import { updateTeachSkill, removeTeachSkillApi } from "../api/skills";
import { fetchMe } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useConfirm } from "./ConfirmProvider";
import { notifySuccess, notifyError } from "../utils/toast";

export default function TeachItem({ item }) {
  const [open, setOpen] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const confirm = useConfirm();
  const [removing, setRemoving] = useState(false);

  async function handleSave(changes) {
    await updateTeachSkill(item._id, changes);
    const res = await fetchMe();
    if (res.user) setUser(res.user);
    notifySuccess("Saved");
  }

  async function handleRemove() {
    const ok = await confirm({ title: "Remove skill?", description: `Remove ${item.name} from your teaches list?` });
    if (!ok) return;
    setRemoving(true);
    try {
      await removeTeachSkillApi(item._id);
      const res = await fetchMe();
      if (res.user) setUser(res.user);
      notifySuccess("Removed");
    } catch (err) {
      console.error(err);
      notifyError("Failed to remove");
    } finally { setRemoving(false); }
  }

  return (
    <div className="border rounded p-3 flex justify-between items-start">
      <div>
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm text-gray-600">Level: {item.level}</div>
        <div className="text-sm mt-2">{item.description}</div>
        <div className="text-xs text-gray-500 mt-2">Endorsements: {item.endorsementsCount || 0}</div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button onClick={() => setOpen(true)} className="px-3 py-1 border rounded">Edit</button>
        <button onClick={handleRemove} disabled={removing} className="px-3 py-1 bg-red-600 text-white rounded">{removing ? "Removing..." : "Remove"}</button>
      </div>

      <EditSkillModal isOpen={open} onClose={() => setOpen(false)} item={item} onSave={handleSave} />
    </div>
  );
}
