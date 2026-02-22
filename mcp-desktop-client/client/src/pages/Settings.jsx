import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
	const [notifications, setNotifications] = useState(true);
	const [darkMode, setDarkMode] = useState(false);
	const [autoSave, setAutoSave] = useState(true);

	const handleSave = () => {
		toast.success("Settings saved successfully!");
	};

	return (
		<div className="container mx-auto p-6">
			<Card className="max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Notifications</Label>
							<p className="text-sm text-muted-foreground">
								Receive notifications for new messages
							</p>
						</div>
						<Switch
							checked={notifications}
							onCheckedChange={setNotifications}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Dark Mode</Label>
							<p className="text-sm text-muted-foreground">
								Toggle dark mode theme
							</p>
						</div>
						<Switch
							checked={darkMode}
							onCheckedChange={setDarkMode}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label className="text-base">Auto Save</Label>
							<p className="text-sm text-muted-foreground">
								Automatically save your work
							</p>
						</div>
						<Switch
							checked={autoSave}
							onCheckedChange={setAutoSave}
						/>
					</div>
					<Button onClick={handleSave} className="w-full">
						Save Settings
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
