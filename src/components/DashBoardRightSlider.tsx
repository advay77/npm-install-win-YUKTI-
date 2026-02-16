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
import { Loader2, Stars, Video, BookOpen, Ticket, Mail } from "lucide-react";
import { LuAlignRight, LuSend, LuStar } from "react-icons/lu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { runAgent } from "@/lib/AI_Provider/agent";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData } from "@/context/UserDetailContext";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/services/supabaseClient";
import ReactMarkdown from "react-markdown";
import dynamic from "next/dynamic";

type Message = {
  role: "user" | "ai";
  text: string;
};

function SheetDemoInner() {
  const { users } = useUserData();
  const { darkTheme } = useTheme();
  const router = useRouter();
  // ----ai states
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [ticketMode, setTicketMode] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateTicket = () => {
    setTicketMode(true);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Please describe your issue in a message. I’ll create a ticket right away.",
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

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
      if (ticketMode) {
        try {
          const { data, error } = await supabase
            .from("tickets")
            .insert({ userId: users[0].id, description: userInput, status: "pending" })
            .select()
            .single();
          if (error) throw error;
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: `✅ Ticket created. Status: ${data.status}. We'll get back to you soon.` },
          ]);
        } catch (e: unknown) {
          console.error(e);
          const errorMessage = e instanceof Error ? e.message : 'Unknown error';
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: `❌ Failed to create ticket: ${errorMessage}` },
          ]);
        } finally {
          setTicketMode(false);
        }
      } else {
        const aiReply = await runAgent(userInput, users[0].id);
        setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong." },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAboutInterviewX = () => {
    const aboutMessage = `
# 🚀 INTERVIEWX

**Your AI-Powered Recruitment Platform**

Transform your hiring process with intelligent automation and data-driven insights.

---

## 🎯 Key Features

**🔄 AI Interview Management**
Automated scheduling, reminders, and follow-ups

**💬 Smart Candidate Communication**
AI-powered emails and personalized messages

**⚙️ Workflow Optimization**
Streamline your entire recruitment pipeline

**🧠 Intelligent Feedback**
AI-generated interview insights and assessments

**📊 Resume Scoring**
Automated evaluation and candidate ranking

---

## ✨ Why Choose INTERVIEWX?

✓ **Save 70% time** on administrative tasks
✓ **Improve hiring quality** with AI insights
✓ **Better candidate experience** with instant communication
✓ **Reduce hiring bias** with data-driven decisions
✓ **Scale without limits** without scaling your team

---

Start your free trial today and unlock the future of recruitment! 🎯`;

    setMessages([{ role: "ai", text: aboutMessage }]);
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
      <SheetContent className={`${darkTheme
        ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"
        : "bg-white"} py-8 px-5 border-l ${darkTheme
          ? "border-slate-700/50 shadow-2xl shadow-slate-900/50"
          : "border-transparent shadow-none"} ${darkTheme
            ? "[&>button]:text-slate-200 [&>button]:hover:text-white"
            : "[&>button]:text-slate-500 [&>button]:hover:text-slate-700"}`}>
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
                <SheetClose asChild>
                  <button onClick={() => router.push("/dashboard/create-interview")} className={`p-3 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                    ? "bg-gradient-to-br from-blue-600/30 to-blue-600/10 border-blue-500/50 text-blue-200 hover:from-blue-600/40 hover:to-blue-600/20 hover:border-blue-400 min-h-[96px]"
                    : "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 text-blue-700 hover:from-blue-200 hover:to-blue-100 hover:border-blue-500 min-h-[96px]"
                    }`}>
                    <div className="flex items-center justify-center gap-2 h-full flex-col">
                      <Video size={32} className="text-current" />
                      <p>Create Interviews</p>
                    </div>
                  </button>
                </SheetClose>
                <button onClick={handleAboutInterviewX} className={`p-3 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                  ? "bg-gradient-to-br from-purple-600/30 to-purple-600/10 border-purple-500/50 text-purple-200 hover:from-purple-600/40 hover:to-purple-600/20 hover:border-purple-400 min-h-[96px]"
                  : "bg-gradient-to-br from-purple-100 to-purple-50 border-purple-400 text-purple-700 hover:from-purple-200 hover:to-purple-100 hover:border-purple-500 min-h-[96px]"
                  }`}>
                  <div className="flex items-center justify-center gap-2 h-full flex-col">
                    <BookOpen size={32} className="text-current" />
                    <p>About INTERVIEWX</p>
                  </div>
                </button>
                <button onClick={handleCreateTicket} className={`p-3 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                  ? "bg-gradient-to-br from-pink-600/30 to-pink-600/10 border-pink-500/50 text-pink-200 hover:from-pink-600/40 hover:to-pink-600/20 hover:border-pink-400 min-h-[96px]"
                  : "bg-gradient-to-br from-pink-100 to-pink-50 border-pink-400 text-pink-700 hover:from-pink-200 hover:to-pink-100 hover:border-pink-500 min-h-[96px]"
                  }`}>
                  <div className="flex items-center justify-center gap-2 h-full flex-col">
                    <Ticket size={32} className="text-current" />
                    <p>Create Tickets</p>
                  </div>
                </button>
                <SheetClose asChild>
                  <button onClick={() => router.push("/dashboard/send-mail")} className={`p-3 rounded-xl border-2 font-sora text-xs tracking-tight text-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-semibold group ${darkTheme
                    ? "bg-gradient-to-br from-emerald-600/30 to-emerald-600/10 border-emerald-500/50 text-emerald-200 hover:from-emerald-600/40 hover:to-emerald-600/20 hover:border-emerald-400 min-h-[96px]"
                    : "bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-400 text-emerald-700 hover:from-emerald-200 hover:to-emerald-100 hover:border-emerald-500 min-h-[96px]"
                    }`}>
                    <div className="flex items-center justify-center gap-2 h-full flex-col">
                      <Mail size={32} className="text-current" />
                      <p>Send Mails</p>
                    </div>
                  </button>
                </SheetClose>
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
        <SheetFooter className="shrink-0 mt-4 pt-3 border-t" style={{ borderTopColor: darkTheme ? "rgba(51, 65, 85, 0.3)" : "rgba(191, 219, 254, 0.3)" }}>
          <div className="w-full flex flex-col gap-2">
            <Label className={`font-inter text-xs tracking-tight font-semibold ${darkTheme ? "text-slate-200" : "text-slate-800"}`}>
              Message
            </Label>
            <div className="relative">
              <Textarea
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                className={`font-inter text-xs tracking-tight font-medium h-14 resize-none rounded-lg border-2 transition-all focus:outline-none p-2 ${darkTheme
                  ? "bg-slate-800/60 text-white placeholder-slate-500 border-slate-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  : "bg-white/60 text-slate-900 placeholder-slate-400 border-blue-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 backdrop-blur-sm"
                  }`}
              />
              <Button
                className={`absolute right-2 bottom-2 rounded-md transition-all active:scale-95 flex items-center justify-center w-8 h-8 p-0 ${darkTheme
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                  }`}
                onClick={sendMessage}
              >
                <LuSend className="text-white" size={16} />
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet >
  );
}

export const SheetDemo = dynamic(() => Promise.resolve(SheetDemoInner), {
  ssr: false,
});
