import { create } from "zustand";

interface Session {
  userId?: string;
  isGuest?: boolean;
  email?: string;
  firstName?: string;
}

interface SessionStore {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  fetchSession: () => Promise<void>;
  logout: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  isLoading: true,

  setSession: (session) => set({ session }),

  setIsLoading: (isLoading) => set({ isLoading }),

  fetchSession: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        set({ session: data.session, isLoading: false });
      } else {
        set({ session: null, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      set({ session: null, isLoading: false });
    }
  },

  logout: () => set({ session: null }),
}));
