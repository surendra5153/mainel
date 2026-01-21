import { useState } from "react";
import { addTeachSkill, addLearnSkill } from "../api/skills";
import { useAuthStore } from "../store/authStore";
import { notifySuccess, notifyError, notifyInfo } from "../utils/toast";
import { Code, Palette, Briefcase, Database, Music, Languages, Camera, Plus, Zap, Star, BookOpen } from "lucide-react";

const CATEGORY_CONFIG = {
  development: { icon: Code, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", gradient: "from-blue-500 to-cyan-500" },
  design: { icon: Palette, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", gradient: "from-purple-500 to-pink-500" },
  business: { icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500 to-teal-500" },
  data: { icon: Database, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", gradient: "from-indigo-500 to-violet-500" },
  music: { icon: Music, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", gradient: "from-rose-500 to-red-500" },
  language: { icon: Languages, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", gradient: "from-orange-500 to-amber-500" },
  photography: { icon: Camera, color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500 to-blue-500" },
  default: { icon: Zap, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", gradient: "from-slate-500 to-gray-500" }
};

export default function SkillCard({ skill, onAdded }) {
  const [loadingTeach, setLoadingTeach] = useState(false);
  const [loadingLearn, setLoadingLearn] = useState(false);
  const user = useAuthStore((s) => s.user);

  const config = CATEGORY_CONFIG[skill.category] || CATEGORY_CONFIG.default;
  const Icon = config.icon;

  async function handleAddTeach() {
    if (!user) { notifyError('Please login'); return; }
    setLoadingTeach(true);

    // optimistic UI
    const origUser = user;
    const tempTeach = {
      _id: `temp-${Date.now()}`,
      skillRef: skill._id,
      name: skill.name,
      level: 'beginner',
      description: skill.description || ''
    };

    try {
      useAuthStore.getState().setUser({ ...user, teaches: [tempTeach, ...(user.teaches || [])] });

      const payload = { skillId: skill._id, level: 'beginner' };
      const data = await addTeachSkill(payload);

      if (data && data.teaches) {
        useAuthStore.getState().setUser({ ...user, teaches: data.teaches });
        notifySuccess('Added to "Can Teach"');
        onAdded && onAdded(data.teaches);
      }
    } catch (err) {
      console.error(err);
      try { useAuthStore.getState().setUser(origUser); } catch (e) { /* ignore */ }
      if (err.message && err.message.includes('already')) notifyInfo('Already in your Teach list');
      else notifyError(err.message || 'Failed to add');
    } finally { setLoadingTeach(false); }
  }

  async function handleAddLearn() {
    if (!user) { notifyError('Please login'); return; }
    setLoadingLearn(true);

    // optimistic UI
    const origUser = user;
    const tempLearn = {
      _id: `temp-${Date.now()}`,
      skillRef: skill._id,
      name: skill.name,
      level: 'beginner',
      description: skill.description || ''
    };

    try {
      useAuthStore.getState().setUser({ ...user, learns: [tempLearn, ...(user.learns || [])] });

      const payload = { skillId: skill._id, level: 'beginner' };
      const data = await addLearnSkill(payload);

      if (data && data.learns) {
        useAuthStore.getState().setUser({ ...user, learns: data.learns });
        notifySuccess('Added to "Want to Learn"');
        onAdded && onAdded(data.learns);
      }
    } catch (err) {
      console.error(err);
      try { useAuthStore.getState().setUser(origUser); } catch (e) { /* ignore */ }
      if (err.message && err.message.includes('already')) notifyInfo('Already in your Learn list');
      else notifyError(err.message || 'Failed to add');
    } finally { setLoadingLearn(false); }
  }

  return (
    <div className="group relative flex flex-col h-full bg-white/40 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Decorative gradient blob */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${config.gradient} opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition-opacity duration-500`} />

      <div className="p-5 flex-1 z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} border ${config.border} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
            <Icon size={24} strokeWidth={2} />
          </div>
          {skill.popularity > 0 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 border border-orange-500/20 shadow-sm">
              <span className="text-xs font-bold">🔥 {skill.popularity}</span>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {skill.name}
        </h2>

        <p className="text-slate-600 text-sm mb-5 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {skill.description || 'No description available for this skill.'}
        </p>

        <div className="flex flex-wrap gap-2">
          {skill.tags?.slice(0, 3).map(t => (
            <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100/50 text-slate-600 border border-slate-200/50 backdrop-blur-sm">
              {t}
            </span>
          ))}
          {(!skill.tags || skill.tags.length === 0) && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100/50 text-slate-400 border border-slate-200/50">
              General
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-slate-100/50 bg-white/30 backdrop-blur-md flex items-center justify-between z-10">
        <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>
          {skill.category || 'General'}
        </span>
        <div className="flex gap-2">
          {/* Learn Button */}
          <button
            onClick={handleAddLearn}
            disabled={loadingLearn || loadingTeach}
            className={`
              relative overflow-hidden px-3 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all duration-300 flex items-center gap-1.5
              ${loadingLearn
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : `bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200`
              }
            `}
            title="I want to learn this"
          >
            <BookOpen size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Learn</span>
          </button>

          {/* Teach Button */}
          <button
            onClick={handleAddTeach}
            disabled={loadingTeach || loadingLearn}
            className={`
              relative overflow-hidden px-3 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all duration-300 flex items-center gap-1.5
              ${loadingTeach
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : `bg-white text-slate-700 hover:text-white group/btn border border-slate-200 hover:border-transparent`
              }
            `}
            title="I can teach this"
          >
            {!loadingTeach && (
              <span className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 ease-out`} />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Teach</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
