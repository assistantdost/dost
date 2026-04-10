import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	DEFAULT_SUMMARY_MAX_TOKENS,
	DEFAULT_SUMMARY_TRIGGER_TOKENS,
	useSettingsStore,
} from "@/store/settingsStore";

function SliderScale({ marks }) {
	return (
		<div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
			{marks.map((mark) => (
				<span key={mark}>{mark.toLocaleString()}</span>
			))}
		</div>
	);
}

export function SummarySettingsSliders() {
	const summaryTriggerTokens = useSettingsStore(
		(state) => state.summaryTriggerTokens,
	);
	const summaryMaxTokens = useSettingsStore(
		(state) => state.summaryMaxTokens,
	);
	const setSummaryTriggerTokens = useSettingsStore(
		(state) => state.setSummaryTriggerTokens,
	);
	const setSummaryMaxTokens = useSettingsStore(
		(state) => state.setSummaryMaxTokens,
	);
	const resetSummarySettings = useSettingsStore(
		(state) => state.resetSummarySettings,
	);

	return (
		<Accordion type="single" collapsible className="w-full">
			<AccordionItem value="summary-settings">
				<AccordionTrigger className="py-2 hover:no-underline">
					<div className="flex w-full items-center justify-between gap-3 pr-2">
						<span className="text-sm font-medium">
							Summary Settings
						</span>
						<span className="text-xs text-muted-foreground tabular-nums">
							Trigger: {summaryTriggerTokens.toLocaleString()} |
							Max: {summaryMaxTokens.toLocaleString()}
						</span>
					</div>
				</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-6">
						<div className="space-y-3">
							<div className="flex items-center justify-between gap-2">
								<Label htmlFor="summary-trigger-tokens">
									Summary Trigger Tokens
								</Label>
								<span className="text-sm font-medium tabular-nums">
									{summaryTriggerTokens.toLocaleString()}
								</span>
							</div>
							<Slider
								id="summary-trigger-tokens"
								min={1000}
								max={10000}
								step={500}
								value={[summaryTriggerTokens]}
								onValueChange={(value) =>
									setSummaryTriggerTokens(value[0])
								}
							/>
							<SliderScale
								marks={[1000, 3250, 5500, 7750, 10000]}
							/>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between gap-2">
								<Label htmlFor="summary-max-tokens">
									Summary Max Tokens
								</Label>
								<span className="text-sm font-medium tabular-nums">
									{summaryMaxTokens.toLocaleString()}
								</span>
							</div>
							<Slider
								id="summary-max-tokens"
								min={200}
								max={2000}
								step={50}
								value={[summaryMaxTokens]}
								onValueChange={(value) =>
									setSummaryMaxTokens(value[0])
								}
							/>
							<SliderScale marks={[200, 650, 1100, 1550, 2000]} />
						</div>

						<p className="text-xs text-muted-foreground">
							These values are saved automatically per user
							profile.
						</p>

						<Button
							type="button"
							variant="outline"
							onClick={resetSummarySettings}
							className="w-full"
						>
							Reset to defaults ({DEFAULT_SUMMARY_MAX_TOKENS} /{" "}
							{DEFAULT_SUMMARY_TRIGGER_TOKENS})
						</Button>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
