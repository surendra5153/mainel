import { create } from "zustand";

export const useSkillsStore = create((set) => ({
  categories: [],
  skills: [],
  total: 0,
  loading: false,
  page: 1,
  limit: 12,
  q: "",
  categoryFilter: "",
  setCategories: (items) => set({ categories: items }),
  setSkills: (items, total) => set({ skills: items, total }),
  setLoading: (v) => set({ loading: v }),
  setPage: (p) => set({ page: p }),
  setQuery: (q) => set({ q }),
  setCategoryFilter: (c) => set({ categoryFilter: c }),
}));
