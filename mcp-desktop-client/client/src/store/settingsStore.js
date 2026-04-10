import { create } from "zustand";
import { persist } from "zustand/middleware";
import customStorage from "./customStorage";

export const DEFAULT_SUMMARY_MAX_TOKENS = 700;
export const DEFAULT_SUMMARY_TRIGGER_TOKENS = 6000;

const SUMMARY_MAX_MIN = 200;
const SUMMARY_MAX_MAX = 2000;
const SUMMARY_TRIGGER_MIN = 1000;
const SUMMARY_TRIGGER_MAX = 10000;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const useSettingsStore = create(
	persist(
		(set) => ({
			summaryMaxTokens: DEFAULT_SUMMARY_MAX_TOKENS,
			summaryTriggerTokens: DEFAULT_SUMMARY_TRIGGER_TOKENS,
			hydrated: false,
			setSummaryMaxTokens: (value) => {
				const numericValue = Number(value);
				if (!Number.isFinite(numericValue)) return;

				set({
					summaryMaxTokens: clamp(
						Math.round(numericValue),
						SUMMARY_MAX_MIN,
						SUMMARY_MAX_MAX,
					),
				});
			},
			setSummaryTriggerTokens: (value) => {
				const numericValue = Number(value);
				if (!Number.isFinite(numericValue)) return;

				set({
					summaryTriggerTokens: clamp(
						Math.round(numericValue),
						SUMMARY_TRIGGER_MIN,
						SUMMARY_TRIGGER_MAX,
					),
				});
			},
			resetSummarySettings: () => {
				set({
					summaryMaxTokens: DEFAULT_SUMMARY_MAX_TOKENS,
					summaryTriggerTokens: DEFAULT_SUMMARY_TRIGGER_TOKENS,
				});
			},
		}),
		{
			name: "settingsStore",
			storage: customStorage,
			partialize: (state) => ({
				summaryMaxTokens: state.summaryMaxTokens,
				summaryTriggerTokens: state.summaryTriggerTokens,
			}),
			onRehydrateStorage: () => (state) => {
				if (state) {
					state.summaryMaxTokens = clamp(
						Number(state.summaryMaxTokens),
						SUMMARY_MAX_MIN,
						SUMMARY_MAX_MAX,
					);
					state.summaryTriggerTokens = clamp(
						Number(state.summaryTriggerTokens),
						SUMMARY_TRIGGER_MIN,
						SUMMARY_TRIGGER_MAX,
					);
					state.hydrated = true;
				}
			},
		},
	),
);
