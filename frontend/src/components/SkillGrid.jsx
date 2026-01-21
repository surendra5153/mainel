import { useEffect, useState } from "react";
import { fetchSkills } from "../api/skills";
import { useSkillsStore } from "../store/skillsStore";
import SkillCard from "./SkillCard";

export default function SkillGrid() {
  const { skills, total, page, limit, q, categoryFilter, setSkills, setLoading, setPage, setQuery, loading } = useSkillsStore();
  const [localQ, setLocalQ] = useState(q || "");

  useEffect(() => { loadSkills(); }, [page, limit, q, categoryFilter]);

  async function loadSkills() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (q) params.q = q;
      if (categoryFilter) params.category = categoryFilter;
      const data = await fetchSkills(params);
      setSkills(data.items || [], data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function handleSearch(e) { e.preventDefault(); setQuery(localQ); setPage(1); }

  return (
    <div className="flex-1 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg">
            <input value={localQ} onChange={(e)=>setLocalQ(e.target.value)} placeholder="Search skills (e.g., React, Guitar)" className="flex-1 border px-3 py-2 rounded" />
            <button type="submit" className="bg-gray-800 text-white px-3 py-2 rounded">Search</button>
          </form>
          <div className="ml-4 text-sm text-gray-600">{total} results</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({length: Math.min(6, limit)}).map((_,i) => (
              <div key={i} className="animate-pulse p-4 bg-white rounded shadow-sm border h-40" />
            ))
          ) : (
            skills.map(s => <SkillCard key={s._id} skill={s} />)
          )}
        </div>
      </div>
    </div>
  );
}
