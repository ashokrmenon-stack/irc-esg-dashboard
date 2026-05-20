"use client";
import { useState, useRef, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";

type Source = { document_title: string; doc_type: string; chunk_index: number; similarity: number };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };

const SUGGESTIONS = [
  "What were our 2024 Scope 1+2 emissions?",
  "Summarise our TCFD climate risk approach.",
  "Which plants have the highest water intensity?",
  "How did renewable energy use change 2021–2024?",
];

export function AskClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(q: string) {
    if (!q.trim() || loading) return;
    setErr(null);
    setLoading(true);
    const nextMessages = [...messages, { role: "user" as const, content: q }];
    setMessages(nextMessages);
    setInput("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: messages.slice(-6) })
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.answer, sources: data.sources }]);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-600 mb-3">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-gray-700">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`rounded-lg p-4 max-w-[85%] ${
              m.role === "user" ? "bg-brand text-white" : "bg-white border border-gray-200"
            }`}>
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  <div className="text-xs font-medium text-gray-500 mb-1.5">Sources</div>
                  <div className="space-y-1">
                    {m.sources.map((s, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <FileText size={11} />
                        <span className="truncate">{s.document_title}</span>
                        <span className="text-gray-400">· chunk {s.chunk_index} · {Math.round(s.similarity * 100)}% match</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[85%]">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Searching documents and composing answer…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{err}</div>}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 sticky bottom-0 bg-gray-50 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about IRC's ESG data, sustainability report, or climate risks…"
          className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded font-medium">
          Send
        </button>
      </form>
    </div>
  );
}
