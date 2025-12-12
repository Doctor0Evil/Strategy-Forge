import React, { useEffect, useRef, useState } from "react";
import { BioStateChatEnricher } from "./ai_biostate_chat_enricher";

const enricher = new BioStateChatEnricher({ alpha: 0.2, windowSize: 60 });

export const ChatWithBiostate: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [uiHints, setUiHints] = useState(enricher.getUiRecommendations());
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = (window as any).STRATEGYFORGE_BIOSTATE_WS || "wss://strategyforge.example/ws/biostate";
    const s = new WebSocket(url);
    socketRef.current = s;

    s.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "biostate" && data.payload) {
          enricher.ingest(data.payload);
          setUiHints(enricher.getUiRecommendations());
        }
      } catch {
        // ignore malformed packets
      }
    };

    s.onclose = () => {
      socketRef.current = null;
    };

    return () => {
      s.close();
    };
  }, []);

  async function send() {
    if (!input.trim()) return;
    const prompt = enricher.buildAugmentedPrompt(input.trim());
    const hints = enricher.getUiRecommendations();
    const body = {
      prompt,
      max_tokens: hints.maxTokens
    };

    setMessages((prev) => [...prev, { role: "user", text: input.trim() }]);
    setInput("");

    const res = await fetch("/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    const reply = json.reply || "[no reply]";

    setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-slate-800 px-3 py-2 flex justify-between items-center text-xs">
        <div className="flex flex-col">
          <span className="font-semibold text-cyan-300">Bio-augmented Chat</span>
          <span className="text-slate-500">
            Mode: <span className="text-emerald-300">{uiHints.slowMode ? "Calm / Slow" : "Normal"}</span>
          </span>
        </div>
        {uiHints.showBreathingHint && (
          <span className="text-amber-300">
            Hint: take a short break before sending complex commands.
          </span>
        )}
      </header>
      <main className="flex-1 overflow-auto p-3 space-y-2 text-sm">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
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
          placeholder="Type your command..."
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
