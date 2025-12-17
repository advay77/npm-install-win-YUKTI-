"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Stars } from "lucide-react";
import { LuAlignRight, LuSend, LuStar } from "react-icons/lu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { runAgent } from "@/lib/AI_Provider/agent";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData } from "@/context/UserDetailContext";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "ai";
  text: string;
};

export function SheetDemo() {
  const { users } = useUserData();
  const { darkTheme } = useTheme();
  // ----ai states
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) {
      toast.error("Please enter a message to send.");
      return;
    }
    if (aiLoading || !users) return;

    setAiLoading(true);
    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");

    try {
      const aiReply = await runAgent(userInput, users[0].id);
      // console.log("AI Reply:", aiReply);
      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong." },
      ]);
      setAiLoading(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-106 transition-all fixed bottom-7 right-12 group shadow-1xl ${darkTheme
          ? "bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 shadow-xl shadow-blue-600/40 hover:shadow-blue-600/50"
          : "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/50"
          }`}>
          <Stars className="text-3xl text-white animate-pulse group-hover:animate-bounce" />
        </div>
      </SheetTrigger>
      <SheetContent className={`${darkTheme ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" : "bg-gradient-to-b from-white via-blue-50/30 to-white"} py-8 px-5 border-l ${darkTheme ? "border-slate-700/50 shadow-2xl shadow-slate-900/50" : "border-blue-100/50 shadow-xl"}`}>
        <SheetHeader>
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700`} />
          <SheetTitle className={`font-extrabold text-2xl font-sora tracking-tight flex gap-3 items-center ${darkTheme ? "text-white" : "text-slate-900"}`}>
            <span>INTERVIEWX AI</span>
            <Stars className={`text-2xl ${darkTheme ? "text-blue-400 animate-spin" : "text-blue-600 animate-bounce"}`} />
          </SheetTitle>
          <SheetDescription className={`text-sm font-inter tracking-wide mt-4 px-0 leading-relaxed ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
            Your intelligent assistant for interview management, candidate communication, and workflow optimization.
          </SheetDescription>
        </SheetHeader>
        {/*---------------- AI MESSAGES DIPLAY--------------------- */}
        <div className="h-full flex flex-col mt-8">
          {messages.length == 0 ? (
            <div className="space-y-2">
              <h3 className={`text-sm font-semibold tracking-tight mb-4 ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className={`p-4 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                  ? "bg-gradient-to-br from-blue-600/30 to-blue-600/10 border-blue-500/50 text-blue-200 hover:from-blue-600/40 hover:to-blue-600/20 hover:border-blue-400"
                  : "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 text-blue-700 hover:from-blue-200 hover:to-blue-100 hover:border-blue-500"
                  }`}>
                  <div className="flex items-center justify-center gap-1 h-full flex-col">
                    <span>📹</span>
                    <p>Create Interviews</p>
                  </div>
                </button>
                <button className={`p-4 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                  ? "bg-gradient-to-br from-purple-600/30 to-purple-600/10 border-purple-500/50 text-purple-200 hover:from-purple-600/40 hover:to-purple-600/20 hover:border-purple-400"
                  : "bg-gradient-to-br from-purple-100 to-purple-50 border-purple-400 text-purple-700 hover:from-purple-200 hover:to-purple-100 hover:border-purple-500"
                  }`}>
                  <div className="flex items-center justify-center gap-1 h-full flex-col">
                    <span>📚</span>
                    <p>About INTERVIEWX</p>
                  </div>
                </button>
                <button className={`p-4 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                  ? "bg-gradient-to-br from-pink-600/30 to-pink-600/10 border-pink-500/50 text-pink-200 hover:from-pink-600/40 hover:to-pink-600/20 hover:border-pink-400"
                  : "bg-gradient-to-br from-pink-100 to-pink-50 border-pink-400 text-pink-700 hover:from-pink-200 hover:to-pink-100 hover:border-pink-500"
                  }`}>
                  <div className="flex items-center justify-center gap-1 h-full flex-col">
                    <span>🎫</span>
                    <p>Create Tickets</p>
                  </div>
                </button>
                <button className={`p-4 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                  ? "bg-gradient-to-br from-emerald-600/30 to-emerald-600/10 border-emerald-500/50 text-emerald-200 hover:from-emerald-600/40 hover:to-emerald-600/20 hover:border-emerald-400"
                  : "bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-400 text-emerald-700 hover:from-emerald-200 hover:to-emerald-100 hover:border-emerald-500"
                  }`}>
                  <div className="flex items-center justify-center gap-1 h-full flex-col">
                    <span>✉️</span>
                    <p>Send Mails</p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <ScrollArea className={`h-[52vh] px-3 py-4 rounded-xl border ${darkTheme
              ? "bg-slate-800/30 border-slate-700/50"
              : "bg-blue-50/40 border-blue-100/50"}`}>
              <div className="flex flex-col gap-4 pr-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[75%] px-4 py-3 rounded-xl text-sm font-inter font-medium shadow-md backdrop-blur-sm ${msg.role === "user"
                      ? darkTheme
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white self-end shadow-lg"
                        : "bg-gradient-to-br from-blue-600 to-blue-700 text-white self-end shadow-lg"
                      : darkTheme
                        ? "bg-slate-700/80 text-slate-50 self-start border border-slate-600/50"
                        : "bg-slate-200/80 text-slate-900 self-start border border-slate-300/50"
                      }`}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ))}

                {aiLoading && (
                  <div className={`flex items-center gap-2 self-start px-4 py-3 rounded-xl ${darkTheme ? "bg-slate-700/50 text-slate-300" : "bg-slate-200/50 text-slate-700"}`}>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs font-semibold">AI is thinking…</span>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* TEXTAREA TO SEND ------------ */}
        <SheetFooter className="shrink-0 mt-8 pt-4 border-t" style={{ borderTopColor: darkTheme ? "rgba(51, 65, 85, 0.3)" : "rgba(191, 219, 254, 0.3)" }}>
          <div className="w-full">
            <Label className={`font-inter text-sm tracking-tight font-semibold mb-3 block ${darkTheme ? "text-slate-200" : "text-slate-800"}`}>
              Send a Message
            </Label>
            <div className="relative">
              <Textarea
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`font-inter text-sm tracking-tight font-medium h-24 resize-none rounded-xl border-2 transition-all focus:outline-none ${darkTheme
                  ? "bg-slate-800/60 text-white placeholder-slate-500 border-slate-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  : "bg-white/60 text-slate-900 placeholder-slate-400 border-blue-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 backdrop-blur-sm"
                  }`}
              />
              <Button
                className={`absolute right-3 bottom-3 rounded-lg transition-all active:scale-95 flex items-center justify-center w-10 h-10 p-0 ${darkTheme
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                  }`}
                onClick={sendMessage}
              >
                <LuSend className="text-white" size={20} />
              </Button>
            </div>
            <p className={`text-xs mt-2 ${darkTheme ? "text-slate-500" : "text-slate-500"}`}>Press Enter + Shift for new line</p>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
