import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QueryProvider } from "./lib/queryClient";

createRoot(document.getElementById("root")).render(
	<QueryProvider>
		<App />
	</QueryProvider>,
);
