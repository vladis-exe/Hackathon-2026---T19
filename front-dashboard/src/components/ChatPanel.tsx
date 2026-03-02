import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const MOCK_RESPONSES: Record<string, string> = {
  bandwidth: "Total bandwidth across all cameras is currently within optimal range. Smart Focus is reducing consumption by ~35% on enabled cameras.",
  focus: "Smart Focus uses AI object detection to prioritize important regions in the frame. You can select a custom focus area by drawing a rectangle on the video preview.",
  cameras: "You currently have 6 cameras configured. 5 are online and 1 (Rooftop Cam) is offline since 11:20.",
  help: "I can help with:\n• Camera status & diagnostics\n• Bandwidth optimization tips\n• Smart Focus configuration\n• QoD (Quality on Demand) settings\n\nJust ask!",
  qod: "QoD (Quality on Demand) allows you to request prioritized network bandwidth from the carrier. It's currently active on Drone 1, Stage Cam 2, and Parking Lot.",
};

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("bandwidth") || lower.includes("saving")) return MOCK_RESPONSES.bandwidth;
  if (lower.includes("focus") || lower.includes("area")) return MOCK_RESPONSES.focus;
  if (lower.includes("camera") || lower.includes("status") || lower.includes("offline")) return MOCK_RESPONSES.cameras;
  if (lower.includes("qod") || lower.includes("quality")) return MOCK_RESPONSES.qod;
  if (lower.includes("help") || lower.includes("what")) return MOCK_RESPONSES.help;
  return "I'm the Smart Focus assistant. Try asking about bandwidth, cameras, focus areas, or QoD settings!";
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! I'm your Smart Focus assistant. Ask me about cameras, bandwidth, or AI focus settings.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getMockResponse(userMsg.content);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[340px] flex-col border-l border-border bg-card transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">SF Assistant</h3>
              <span className="text-[10px] text-success">Online</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                <span
                  className={cn(
                    "mt-1 block text-[9px] opacity-50",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                <span className="animate-pulse">Typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cameras, bandwidth..."
              className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!input.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
