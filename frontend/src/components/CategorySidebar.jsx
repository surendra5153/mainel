import { useEffect } from "react";
import { fetchCategories } from "../api/skills";
import { useSkillsStore } from "../store/skillsStore";

export default function CategorySidebar() {
  const categories = useSkillsStore((s) => s.categories);
  const setCategories = useSkillsStore((s) => s.setCategories);
  const setCategoryFilter = useSkillsStore((s) => s.setCategoryFilter);
  const categoryFilter = useSkillsStore((s) => s.categoryFilter);

  useEffect(() => {
    let mounted = true;
    fetchCategories().then(data => {
      if (mounted) setCategories(data.items || []);
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  return (
    <>
      {/* Mobile chips */}
      <div className="md:hidden py-3">
        <div className="overflow-x-auto px-4">
          <div className="flex gap-2 items-center">
            <button onClick={() => setCategoryFilter('')} className={`px-3 py-1 rounded whitespace-nowrap text-sm ${categoryFilter === '' ? 'bg-blue-50 font-semibold' : 'bg-white hover:bg-gray-100'}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat.key} onClick={() => setCategoryFilter(cat.key)} className={`px-3 py-1 rounded whitespace-nowrap text-sm ${(categoryFilter === cat.key) ? 'bg-blue-50 font-semibold' : 'bg-white hover:bg-gray-100'}`}>
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="w-64 p-4 border-r hidden md:block">
        <div className="sticky top-20">
          <h3 className="text-lg font-semibold mb-3">Categories</h3>
          <ul className="space-y-2">
            <li>
              <button onClick={() => setCategoryFilter('')} className={`text-left w-full px-2 py-1 rounded ${categoryFilter === '' ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-100'}`}>
                All
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat.key}>
                <button onClick={() => setCategoryFilter(cat.key)} className={`text-left w-full px-2 py-1 rounded ${(categoryFilter === cat.key) ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-100'}`}>
                  {cat.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
