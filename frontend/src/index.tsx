import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const App: React.FC = () => {
  const widgetUrl = "/game_widget.html";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-cyan-300">StrategyForge Chat Host</h1>
          <p className="text-xs text-slate-400">
            Hosts chat, orchestration, and can embed the Command Center widget.
          </p>
        </div>
        <a
          href={widgetUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-600"
        >
          Open Command Center
        </a>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-xl w-full bg-slate-900/80 border border-slate-700 rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-2">Chat Host Placeholder</h2>
          <p className="text-xs text-slate-400 mb-3">
            This surface will host the primary chat and control interface. The RTS widget lives
            at <code className="text-emerald-300">{widgetUrl}</code> and can be embedded via an
            iframe or a dedicated route when required.
          </p>
          <div className="border border-slate-700 rounded-lg h-40 flex items-center justify-center text-xs text-slate-500">
            Chat UI not implemented yet.
          </div>
        </div>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
