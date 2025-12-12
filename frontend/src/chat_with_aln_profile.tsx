import React, { useState } from "react";
import { enrichPromptWithALNProfile } from "./ai_strategyforge_aln_profile";

export const ChatWithAlnProfile: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);

  async function send() {
    if (!input.trim()) return;
    const userText = input.trim();
    const prompt = enrichPromptWithALNProfile(userText, { includeOps: true });

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");

    const res = await fetch("/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const json = await res.json();
    const reply = json.reply || "[no reply]";

    setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-slate-800 px-3 py-2 text-xs">
        <span className="font-semibold text-cyan-300">StrategyForge ALN-Aware Chat</span>
      </header>
      <main className="flex-1 overflow-auto p-3 space-y-2 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={
                "inline-block px-2 py-1 rounded " +
                (m.role === "user" ? "bg-sky-700 text-white" : "bg-slate-800 text-slate-100")
              }
            >
              {m.text}
            </span>
          </div>
        ))}
      </main>
      <footer className="border-t border-slate-800 px-3 py-2 flex gap-2 items-center">
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about assets, trades, CI/CD, secure boot..."
        />
        <button
          onClick={send}
          className="px-3 py-1 text-sm rounded bg-emerald-700 hover:bg-emerald-600 text-white"
        >
          Send
        </button>
      </footer>
    </div>
  );
};
