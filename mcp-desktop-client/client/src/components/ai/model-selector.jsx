import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAiStore } from "@/store/aiStore";

export const ModelSelector = (props) => <Dialog {...props} />;

export const ModelSelectorTrigger = (props) => <DialogTrigger {...props} />;

export const ModelSelectorContent = ({
	className,
	children,
	title = "Model Selector",
	...props
}) => (
	<DialogContent className={cn("p-0", className)} {...props}>
		<DialogTitle className="sr-only">{title}</DialogTitle>
		<Command className="**:data-[slot=command-input-wrapper]:h-auto">
			{children}
		</Command>
	</DialogContent>
);

export const ModelSelectorDialog = (props) => <CommandDialog {...props} />;

export const ModelSelectorInput = ({ className, ...props }) => (
	<CommandInput className={cn("h-auto py-3.5", className)} {...props} />
);

export const ModelSelectorList = (props) => <CommandList {...props} />;

export const ModelSelectorEmpty = (props) => <CommandEmpty {...props} />;

export const ModelSelectorGroup = (props) => <CommandGroup {...props} />;

export const ModelSelectorItem = (props) => <CommandItem {...props} />;

export const ModelSelectorShortcut = (props) => <CommandShortcut {...props} />;

export const ModelSelectorSeparator = (props) => (
	<CommandSeparator {...props} />
);

export const ModelSelectorLogo = ({ provider, className, ...props }) => (
	<img
		{...props}
		alt={`${provider} logo`}
		className={cn("size-3 dark:invert", className)}
		height={12}
		src={`https://models.dev/logos/${provider}.svg`}
		width={12}
	/>
);

export const ModelSelectorLogoGroup = ({ className, ...props }) => (
	<div
		className={cn(
			"-space-x-1 flex shrink-0 items-center [&>img]:rounded-full [&>img]:bg-background [&>img]:p-px [&>img]:ring-1 dark:[&>img]:bg-foreground",
			className,
		)}
		{...props}
	/>
);

export const ModelSelectorName = ({ className, ...props }) => (
	<span className={cn("flex-1 truncate text-left", className)} {...props} />
);

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** AI Model Selector component using dynamic providers from aiStore */
export default function AiModelSelector() {
	const [open, setOpen] = useState(false);
	const { providers, chatModel, selectChatModel, envStore } = useAiStore();

	// Wait for providers to load
	if (!providers) {
		return (
			<Button variant="outline" disabled>
				Loading models...
			</Button>
		);
	}

	// Flatten models from all providers
	const models = Object.entries(providers).flatMap(
		([providerKey, provider]) =>
			Object.values(provider.models).map((model) => ({
				id: model.id,
				name: model.name,
				capabilities: model.capabilities,
				chef: providerKey,
				chefSlug: providerKey,
				providers: [providerKey],
			})),
	);

	const selectedModelData = models.find(
		(model) => model.id === chatModel?.id,
	);
	const chefs = Array.from(new Set(models.map((model) => model.chef)));

	const hasApiKey = (chef) => {
		return (
			envStore &&
			envStore[chef] &&
			envStore[chef][providers[chef].env_var]
		);
	};

	return (
		<div className="">
			<ModelSelector onOpenChange={setOpen} open={open}>
				<ModelSelectorTrigger asChild>
					<Button
						className="min-w-20 justify-between"
						variant="outline"
					>
						{selectedModelData?.chefSlug && (
							<ModelSelectorLogo
								provider={selectedModelData.chefSlug}
							/>
						)}
						{selectedModelData?.name && (
							<ModelSelectorName>
								{selectedModelData.name}
							</ModelSelectorName>
						)}
						{!selectedModelData && "Select Model"}
					</Button>
				</ModelSelectorTrigger>
				<ModelSelectorContent>
					<ModelSelectorInput placeholder="Search models..." />
					<ModelSelectorList>
						<ModelSelectorEmpty>
							No models found.
						</ModelSelectorEmpty>
						{chefs.map((chef) => (
							<ModelSelectorGroup heading={chef} key={chef}>
								{!hasApiKey(chef) && (
									<div className="px-2 py-1 text-xs text-muted-foreground">
										Add API key to use these models
									</div>
								)}
								{models
									.filter((model) => model.chef === chef)
									.map((model) => (
										<ModelSelectorItem
											key={model.id}
											disabled={!hasApiKey(chef)}
											className={
												!hasApiKey(chef)
													? "opacity-50"
													: ""
											}
											onSelect={() => {
												if (hasApiKey(chef)) {
													selectChatModel(
														model.providers[0],
														model.id,
													);
													setOpen(false);
												}
											}}
											value={model.id}
										>
											<ModelSelectorLogo
												provider={model.chefSlug}
											/>
											<ModelSelectorName>
												{model.name}
											</ModelSelectorName>
											{/* <ModelSelectorLogoGroup>
												{model.providers.map(
													(provider) => (
														<ModelSelectorLogo
															key={provider}
															provider={provider}
														/>
													),
												)}
											</ModelSelectorLogoGroup> */}
											<div className="flex space-x-1">
												{Object.entries(
													model.capabilities,
												)
													.filter(
														([key, value]) =>
															value &&
															[
																"tool_use",
																"reasoning",
																"browser_search",
															].includes(key),
													)
													.map(([key]) => (
														<Badge
															variant="outline"
															className=""
															key={key}
														>
															{key}
														</Badge>
													))}
											</div>
											{/* <p>{model.capabilities}</p> */}

											{chatModel?.id === model.id ? (
												<CheckIcon className="ml-auto size-4" />
											) : (
												<div className="ml-auto size-4" />
											)}
										</ModelSelectorItem>
									))}
							</ModelSelectorGroup>
						))}
					</ModelSelectorList>
				</ModelSelectorContent>
			</ModelSelector>
		</div>
	);
}

export function ChatLockedModel({ model }) {
	const { id, name, provider } = model || {};

	if (!model) {
		return (
			<Button className="min-w-20 justify-between" variant="ghost">
				Unknown Model
			</Button>
		);
	}

	const data = {
		name: name || "Unknown Model",
		chefSlug: provider,
	};

	return (
		<Button className="min-w-20 justify-between" variant="ghost">
			{data?.chefSlug && <ModelSelectorLogo provider={data.chefSlug} />}
			{data?.name && <ModelSelectorName>{data.name}</ModelSelectorName>}
		</Button>
	);
}
