import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAiStore } from "@/store/aiStore";

export default function Settings() {
	const { envStore, providers, setEnvStore, initialize, listenForUpdates } =
		useAiStore();
	const [values, setValues] = useState({});
	const [keyToProvider, setKeyToProvider] = useState({});
	const [visibility, setVisibility] = useState({});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		initialize();
		const cleanup = listenForUpdates();
		return cleanup;
	}, [initialize, listenForUpdates]);

	useEffect(() => {
		if (envStore && providers) {
			// Flatten envStore for UI
			const flattened = {};
			const keyProviderMap = {};
			for (const [providerName, providerKeys] of Object.entries(
				envStore,
			)) {
				if (providerKeys && typeof providerKeys === "object") {
					for (const [key, value] of Object.entries(providerKeys)) {
						flattened[key] = value;
						keyProviderMap[key] = providerName;
					}
				}
			}
			setValues(flattened);
			setKeyToProvider(keyProviderMap);
			// Initialize visibility to false (password mode) for all keys
			const initialVisibility = Object.keys(flattened).reduce(
				(acc, key) => {
					acc[key] = false;
					return acc;
				},
				{},
			);
			setVisibility(initialVisibility);
		}
	}, [envStore, providers]);

	const handleValueChange = (key, value) => {
		setValues((prev) => ({ ...prev, [key]: value }));
	};

	const toggleVisibility = (key) => {
		setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			// Group changed values by provider
			const changedByProvider = {};
			Object.entries(values).forEach(([key, value]) => {
				const originalValue = getOriginalValue(key);
				if (value !== originalValue) {
					const provider = keyToProvider[key];
					if (!changedByProvider[provider]) {
						changedByProvider[provider] = {};
					}
					changedByProvider[provider][key] = value;
				}
			});

			// If there are changes, save them in bulk
			if (Object.keys(changedByProvider).length > 0) {
				await setEnvStore(changedByProvider);
			}

			toast.success("API keys saved successfully!");
		} catch (error) {
			toast.error("Failed to save API keys");
		} finally {
			setSaving(false);
		}
	};

	const getOriginalValue = (key) => {
		if (!envStore || !keyToProvider[key]) return undefined;
		const provider = keyToProvider[key];
		return envStore[provider] ? envStore[provider][key] : undefined;
	};

	if (!envStore) {
		return (
			<div className="container mx-auto p-6">
				<Card className="max-w-2xl mx-auto">
					<CardContent className="p-6">
						<div className="text-center">Loading...</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Bring Your Own Keys (BYOK)</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{Object.entries(values).map(([key, value]) => (
						<div key={key} className="space-y-2">
							<Label
								htmlFor={key}
								className="text-muted-foreground"
							>
								{key.replace(/_/g, " ").toUpperCase()}
							</Label>
							<div className="relative">
								<Input
									id={key}
									type={visibility[key] ? "text" : "password"}
									value={value || ""}
									onChange={(e) =>
										handleValueChange(key, e.target.value)
									}
									placeholder={`Enter ${key.replace(/_/g, " ").toLowerCase()}`}
									className="pr-10"
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => toggleVisibility(key)}
								>
									{visibility[key] ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
					))}
					<Button
						onClick={handleSave}
						disabled={saving}
						className="w-full"
					>
						{saving ? "Saving..." : "Save API Keys"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
