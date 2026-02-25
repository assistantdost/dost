import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	base: "./",
	envDir: path.resolve(__dirname, ".."), // ← reads from mcp-desktop-client/
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@repo/shadcn-ui": path.resolve(__dirname, "./src"),
		},
	},
});
