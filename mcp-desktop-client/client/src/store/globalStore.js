import { create } from "zustand";
import { persist } from "zustand/middleware";
import customStorage from "./customStorage";

const useGlobalStore = create(
	persist(
		(set, get) => ({
			theme: "light",
			logged: false,
			hydrated: false,
			toggleTheme: () =>
				set((state) => ({
					theme: state.theme === "light" ? "dark" : "light",
				})),
			setLogged: (logged) => set({ logged }),
		}),
		{
			name: "globalStore",
			storage: customStorage,
			partialize: (state) => ({
				theme: state.theme,
				logged: state.logged,
			}),
			onRehydrateStorage: () => (state) => {
				state.hydrated = true;
			},
		},
	),
);

export default useGlobalStore;
