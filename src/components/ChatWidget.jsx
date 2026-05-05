import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const AEJACA_ORIGIN = "https://www.aejaca.com";
const LINK_CLS = "text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors";

function renderMessage(text) {
  const parts = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s<>"']+)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] != null) {
      // Markdown link [text](url)
      const url = m[2].trim();
      const isInternal = url.startsWith(AEJACA_ORIGIN) || url.startsWith("/");
      const to = url.startsWith(AEJACA_ORIGIN) ? (url.slice(AEJACA_ORIGIN.length) || "/") : url;
      parts.push(isInternal
        ? <Link key={m.index} to={to} className={LINK_CLS}>{m[1]}</Link>
        : /^https?:\/\//.test(url)
          ? <a key={m.index} href={url} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>{m[1]}</a>
          : m[1]);
    } else if (m[3] != null) {
      parts.push(<strong key={m.index} className="font-semibold text-white">{m[3]}</strong>);
    } else if (m[4] != null) {
      const url = m[4];
      const isInternal = url.startsWith(AEJACA_ORIGIN);
      const to = isInternal ? (url.slice(AEJACA_ORIGIN.length) || "/") : url;
      parts.push(isInternal
        ? <Link key={m.index} to={to} className={LINK_CLS}>{url}</Link>
        : <a key={m.index} href={url} target="_blank" rel="noopener noreferrer" className={`${LINK_CLS} break-all`}>{url}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const API_URL = import.meta.env.VITE_CHAT_API_URL;

const LABELS = {
  pl: {
    title: "Asystent AEJaCA",
    subtitle: "Zapytaj o biżuterię, studio lub wycenę",
    placeholder: "Napisz wiadomość…",
    greeting: "Cześć! Jestem asystentem AEJaCA. Mogę pomóc z wyceną biżuterii, usługami studia, lub doradzić przy Twoim projekcie. W czym mogę pomóc?",
    chips: [
      "Ile kosztuje pierścionek na zamówienie?",
      "Jakie usługi oferuje sTuDiO?",
      "Chcę zamówić indywidualny projekt",
      "Jak działa kalkulator cen?",
    ],
    error: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
  },
  en: {
    title: "AEJaCA Assistant",
    subtitle: "Ask about jewelry, studio, or pricing",
    placeholder: "Type a message…",
    greeting: "Hi! I'm AEJaCA's assistant. I can help with jewelry pricing, studio services, or advise on your custom project. How can I help?",
    chips: [
      "How much is a custom ring?",
      "What services does sTuDiO offer?",
      "I want a custom project",
      "How does the price calculator work?",
    ],
    error: "Sorry, something went wrong. Please try again.",
  },
  de: {
    title: "AEJaCA Assistent",
    subtitle: "Fragen zu Schmuck, Studio oder Preisen",
    placeholder: "Nachricht schreiben…",
    greeting: "Hallo! Ich bin der AEJaCA-Assistent. Ich kann bei Schmuckpreisen, Studio-Diensten oder Ihrem individuellen Projekt helfen. Wie kann ich helfen?",
    chips: [
      "Was kostet ein individueller Ring?",
      "Welche Dienste bietet das sTuDiO?",
      "Ich möchte ein individuelles Projekt",
      "Wie funktioniert der Preisrechner?",
    ],
    error: "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
  },
};

function genSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatWidget() {
  const { lang } = useLanguage();
  const l = LABELS[lang] || LABELS.en;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const sessionRef = useRef(genSessionId());
  const abortRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!API_URL) return null;

  const displayMessages = [{ role: "assistant", content: l.greeting }, ...messages];

  const sendMessage = useCallback(async (text) => {
    const userMsg = { role: "user", content: text.trim() };
    if (!userMsg.content) return;

    const updated = [...messages, userMsg];
    setMessages([...updated, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const apiMessages = updated
      .filter(m => m.role !== "system")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, lang, sessionId: sessionRef.current }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: accumulated };
                return copy;
              });
            }
          } catch {}
        }
      }

      if (!accumulated) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: l.error };
          return copy;
        });
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: l.error };
        return copy;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, lang, l.error]);

  function handleSubmit(e) {
    e.preventDefault();
    if (streaming || !input.trim()) return;
    sendMessage(input);
  }

  function handleChip(text) {
    if (streaming) return;
    sendMessage(text);
  }

  const showChips = messages.length === 0;

  return (
    <>
      {/* Chat bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-900 shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label={l.title}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[520px] sm:max-h-[80vh] flex flex-col bg-neutral-950 sm:rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
          role="dialog"
          aria-label={l.title}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-900/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{l.title}</h3>
                <p className="text-[11px] text-neutral-500 truncate">{l.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {displayMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-amber-400/20 text-amber-50 rounded-br-md"
                      : "bg-white/5 text-neutral-200 rounded-bl-md"
                  }`}
                >
                  {msg.content
                    ? renderMessage(msg.content)
                    : <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                  }
                </div>
              </div>
            ))}

            {/* Quick action chips */}
            {showChips && (
              <div className="flex flex-wrap gap-2 pt-2">
                {l.chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChip(chip)}
                    className="px-3 py-1.5 text-xs text-amber-300 border border-amber-400/30 rounded-full hover:bg-amber-400/10 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-neutral-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={l.placeholder}
                disabled={streaming}
                maxLength={500}
                className="flex-1 px-4 py-2.5 rounded-full bg-neutral-800/60 border border-white/10 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-900 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="Send"
              >
                {streaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
