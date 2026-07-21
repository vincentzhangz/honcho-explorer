import "./polyfill-process";
import React from "react";
import ReactDOM from "react-dom/client";
import { installTauriFetch } from "@/lib/tauri-fetch";
import App from "./App";
import "./index.css";

async function bootstrap() {
  await installTauriFetch();

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
