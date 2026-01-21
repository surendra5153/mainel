import React, { useEffect, useState } from "react";
import { fetchSkills } from "../api/skills";
import { useSkillsStore } from "../store/skillsStore";
import { useAuthStore } from "../store/authStore";
import CategorySidebar from "../components/CategorySidebar";
import SkillCard from "../components/SkillCard";
import SkillRecommendations from "../components/SkillRecommendations";

const SkillsBrowse = () => {
  const user = useAuthStore((s) => s.user);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const categoryFilter = useSkillsStore((s) => s.categoryFilter);

  useEffect(() => {
    load();
  }, [categoryFilter]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSkills({ category: categoryFilter || undefined, limit: 100 });
      setSkills(data.items || data.skills || data || []);
    } catch (err) {
      console.error('Skills load error', err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          <CategorySidebar />
          
          {/* ML Skill Recommendations */}
          {user && <SkillRecommendations limit={5} />}
        </div>
      </div>
      
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-2">
            Browse Skills
          </h1>
          <p className="text-lg text-gray-500">
            Discover new skills to learn or find opportunities to teach.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <SkillCard key={skill._id || skill.id} skill={skill} />
            ))}
          </div>
        )}
        
        {!loading && skills.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No skills found</h3>
            <p className="text-gray-500 mt-1">Try selecting a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsBrowse;
