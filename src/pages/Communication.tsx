import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    sender: "ai",
    text: "Welcome to the Communication Lab! I'm your AI Mentor. Share a draft email or message you'd like feedback on, or describe a workplace situation you're navigating.",
  },
];

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildAiReply(userText: string): string {
  if (countWords(userText) < 10) {
    return "Your message is a bit too short for a professional setting. Try adding a clear context and a specific call to action.";
  }
  return "That's a good start! Try making your opening more direct. Instead of \"I was wondering if...\", try \"I am writing to request...\". Pair that with one sentence of context and a concrete next step so the reader knows exactly what you need.";
}

const Communication = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return `m-${Date.now()}-${idRef.current}`;
  };

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, scrollToBottom]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isAiTyping) return;

    const userMsg: ChatMessage = { id: nextId(), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsAiTyping(true);

    window.setTimeout(() => {
      const reply = buildAiReply(text);
      setMessages((prev) => [...prev, { id: nextId(), sender: "ai", text: reply }]);
      setIsAiTyping(false);
    }, 1000);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <DashboardLayout title="Communication Lab" subtitle="Practice and refine your communication skills">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
        <Card className="glass-card flex-1 flex flex-col overflow-hidden min-h-0">
          <CardContent ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}
              >
                {msg.sender === "ai" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User className="h-4 w-4 text-accent-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
            {isAiTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-center"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <span>AI is typing</span>
                  <span className="flex items-center gap-1.5 pl-0.5" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                        animate={{ opacity: [0.25, 1, 0.25], scale: [1, 1.15, 1] }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.18,
                        }}
                      />
                    ))}
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
          <div className="border-t p-4 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type your response..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={isAiTyping}
                className="flex-1"
              />
              <Button size="icon" onClick={sendMessage} disabled={isAiTyping || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              AI will evaluate your tone, clarity, and empathy
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Communication;
