import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import McpToolsExample from "@/components/McpToolsExample";

function Test() {
	const [result, setResult] = useState("");

	const testGetVersion = async () => {
		if (!window.electronAPI) {
			setResult("electronAPI not available");
			return;
		}
		try {
			const version = await window.electronAPI.getAppVersion();
			setResult(`App Version: ${version}`);
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	const testGetPlatform = async () => {
		if (!window.electronAPI) {
			setResult("electronAPI not available");
			return;
		}
		try {
			const platform = await window.electronAPI.getPlatform();
			setResult(`Platform: ${platform}`);
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	const testAppStoreGet = async () => {
		if (!window.electron || !window.electron.store) {
			setResult("electron.store not available");
			return;
		}
		try {
			const value = window.electron.store.get("test");
			setResult(`electron.store.get("test"): ${value}`);
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	const testAppStoreSet = async () => {
		if (!window.electron || !window.electron.store) {
			setResult("electron.store not available");
			return;
		}
		try {
			window.electron.store.set("test", "Hello from renderer!");
			setResult(
				"electron.store.set('test', 'Hello from renderer!') - Done",
			);
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	const testAppStoreDelete = async () => {
		if (!window.electron || !window.electron.store) {
			setResult("electron.store not available");
			return;
		}
		try {
			window.electron.store.delete("test");
			setResult("electron.store.delete('test') - Done");
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	const testAppStoreGetAll = async () => {
		if (!window.electron || !window.electron.store) {
			setResult("electron.store not available");
			return;
		}
		try {
			const allData = window.electron.store.getAll();
			setResult(`electron.store.getAll(): ${JSON.stringify(allData)}`);
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	const testAppStoreDeleteAll = async () => {
		if (!window.electron || !window.electron.store) {
			setResult("electron.store not available");
			return;
		}
		try {
			window.electron.store.deleteAll();
			setResult("electron.store.deleteAll() - Done");
		} catch (error) {
			setResult(`Error: ${error.message}`);
		}
	};

	return (
		<div>
			<h1>Hi, this is Testing</h1>

			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-4">MCP Store Test</h2>
				<McpToolsExample />
			</div>

			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-4">IPC Tests</h2>
				<div className="flex flex-wrap gap-2">
					<Button onClick={testGetVersion}>
						Test IPC: Get App Version
					</Button>
					<Button onClick={testGetPlatform}>
						Test IPC: Get Platform
					</Button>
					<Button onClick={testAppStoreGet}>
						Test IPC: electron.store Get
					</Button>
					<Button onClick={testAppStoreSet}>
						Test IPC: electron.store Set
					</Button>
					<Button onClick={testAppStoreDelete}>
						Test IPC: electron.store Delete
					</Button>
					<Button onClick={testAppStoreGetAll}>
						Test IPC: electron.store Get All
					</Button>
					<Button onClick={testAppStoreDeleteAll}>
						Test IPC: electron.store Delete All
					</Button>
				</div>
				<p className="mt-4">{result}</p>
			</div>
		</div>
	);
}

export default Test;
