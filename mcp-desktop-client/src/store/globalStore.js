import { create } from "zustand";
import { persist } from "zustand/middleware";
import customStorage from "./customStorage";

const useGlobalStore = create(
	persist(
		(set, get) => ({
			theme: "light",
			hydrated: false,
			toggleTheme: () =>
				set((state) => ({
					theme: state.theme === "light" ? "dark" : "light",
				})),
		}),
		{
			name: "globalStore",
			storage: customStorage,
			partialize: (state) => ({ theme: state.theme }),
			onRehydrateStorage: () => (state) => {
				state.hydrated = true;
			},
		},
	),
);

export default useGlobalStore;
