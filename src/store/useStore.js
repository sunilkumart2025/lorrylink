import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      session: null,
      user: null,
      language: 'en',
      activePost: null,
      theme: 'dark', // 'dark' | 'light'

      setSession: (session) => set({ session, user: session?.user ?? null }),
      setUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : user })),
      setLanguage: (lang) => set({ language: lang }),
      setActivePost: (post) => set({ activePost: post }),
      clearActivePost: () => set({ activePost: null }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'loadlink-storage', 
    }
  )
);
