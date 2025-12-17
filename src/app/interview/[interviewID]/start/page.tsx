"use client";
import { useInterview } from "@/context/interviewContext";
import {
  InfoIcon,
  Loader2,
  LucideCheckCircle,
  Mic,
  PhoneMissed,
  SearchCheck,
  Timer,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LuChevronLeft,
  LuDownload,
  LuGhost,
  LuMessagesSquare,
  LuMic,
  LuMicOff,
  LuVideo,
  LuVideoOff,
  LuX,
} from "react-icons/lu";
import { toast } from "sonner";
import { json, set } from "zod";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/services/supabaseClient";
import { fi } from "zod/v4/locales";
import { SidebarTrigger } from "@/components/ui/SideBar";
import { Separator } from "@/components/ui/separator";
import AI_Voice from "@/components/kokonutui/AiVoice";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

if (!VAPI_PUBLIC_KEY) {
  throw new Error(
    "NEXT_PUBLIC_VAPI_PUBLIC_KEY is required. Please set it in your .env.local file."
  );
}

interface Message {
  type: "user" | "assistant";
  content: string;
}

const StartInterview = () => {
  const { interviewInfo, setInterviewInfo } = useInterview();
  const [vapiError, setVapiError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>("");
  const [activeUser, setActiveUser] = useState<boolean>(false);
  const [callFinished, setCallFinished] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<string>("");
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);

  const [vapi] = useState(() => new Vapi(VAPI_PUBLIC_KEY));

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // useEffect(() => {
  //   interviewInfo && startCall();
  // }, [interviewInfo]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      toast.success("Camera turned on");
      setStream(mediaStream);
      setIsCameraOn(true);
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    toast.success("Camera turned off");
    setIsCameraOn(false);
  };

  const toggleCamera = () => {
    if (isCameraOn) stopCamera();
    else startCamera();
  };

  const toggleMic = async () => {
    if (isMicOn) {
      setIsMicOn(false);
      toast.success("Mic turned off");
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicOn(true);
        toast.success("Mic turned on");
      } catch (err) {
        console.error("Mic access error:", err);
      }
    }
  };

  const startCall = async () => {
    let questionList = "";
    interviewInfo?.interviewData?.forEach((item: any, index: number) => {
      questionList +=
        item.question +
        (index < interviewInfo.interviewData.length - 1 ? "," : "");
    });
    try {
      await vapi.start({
        model: {
          provider: "openai",
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.

Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your ` +
                interviewInfo?.jobPosition +
                ` interview, Let's get started with a few questions!"

Ask one question at a time and wait for the candidate's response before proceeding. 
Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: ` +
                questionList +
                `

If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"

Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"

Keep the conversation natural and engaging—use casual phrases like 
"Alright, next up..." or "Let's tackle a tricky one!"

Key Guidelines:
Be friendly, engaging, and witty ✏️
Keep responses short and natural, like a real conversation
Adapt based on the candidate's confidence level
Ensure the interview remains focused on React
`.trim(),
            },
          ],
        },

        voice: {
          provider: "vapi",
          voiceId: "Hana",
        },

        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        firstMessage:
          "Hi " +
          interviewInfo?.userName +
          ", how are you? Ready for your interview on " +
          interviewInfo?.jobPosition +
          "?",
        endCallMessage:
          "Thanks for chatting! Hope to see you crushing projects soon!",
        endCallPhrases: ["goodbye", "bye", "end call", "hang up"],
      });
    } catch (error) {
      console.error("Error starting call:", error);
      setVapiError(error);
      setLoading(false);
    }
  };

  vapi.on("speech-start", () => {
    setActiveUser(true);
  });

  vapi.on("speech-end", () => {
    setActiveUser(false);
  });

  vapi.on("call-start", () => {
    console.log("Call has started");
    setIsCallActive(true);
    setLoading(false);
    toast.info("Interview Has been started", {
      description: (
        <span className="text-sm text-gray-500 font-medium">
          Your Interview Has Been started!{" "}
          <span className="text-blue-600">All the best</span>
        </span>
      ),
    });
  });

  vapi.on("call-end", () => {
    console.log("Call has stopped");
    setIsCallActive(false);
    setCallFinished(true);
  });

  useEffect(() => {
    if (callFinished) {
      GenerateFeedback();
      setIsDialogOpen(true);
      toast.success("Interview Has been Ended", {
        description: (
          <span className="text-sm text-gray-500 font-medium">
            Your Interview Has Been Ended!{" "}
          </span>
        ),
      });
    }
  }, [callFinished]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isCallActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    vapi.on("message", (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const role = message.role === "user" ? "user" : "assistant";
        const content = message.transcript;

        setMessages((prev) => {
          if (prev.length > 0) {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.type === role && lastMsg.content === content) {
              return prev;
            }
          }
          return [...prev, { type: role, content }];
        });
      }
    });
  }, [vapi]);

  vapi.on("error", (e) => {
    console.error(e);
    setVapiError(e);
  });

  const stopCall = () => {
    stopCamera();
    vapi.stop();
    setIsMicOn(false);
    toast.success("Call ended");
  };

  const GenerateFeedback = async () => {
    setGenerateLoading(true);
    try {
      const res = await axios.post("/api/ai-feedback", {
        conversation: messages,
      });
      console.log("Feedback Result From GROQ LLM:", res.data);
      const { data, error } = await supabase
        .from("interview-details")
        .insert([
          {
            userName: interviewInfo?.userName,
            userEmail: interviewInfo?.userEmail,
            interview_id: interviewInfo?.interviewID,
            feedback: res.data,
            recomended: "No",
            acceptResume: interviewInfo?.acceptResume,
            organization: interviewInfo?.organization,
            resumeURL: interviewInfo?.resumeURL,
          },
        ])
        .select();
      console.log("✅ Interview Details:", data);
      toast.success("Feedback Generated Successfully", {
        description: (
          <span className="text-sm text-gray-500 font-medium">
            Feedback Generated Successfully!{" "}
          </span>
        ),
      });
    } catch (err) {
      console.error("❌ Test Feedback Error:", err);
    } finally {
      setGenerateLoading(false);
    }
  };

  const addMessage = (type: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      type,
      content,
    };
    setMessages((prev) => [...prev, newMessage]);
    setConversation(
      (prev) => `${prev}\n${type === "user" ? "User" : "Assistant"}: ${content}`
    );
  };

  const demoConversation = [
    { type: "assistant", content: "Hi, Renit. How are you?" },
    {
      type: "assistant",
      content: "Ready for your interview on React and Next.js vs Vue?",
    },
    { type: "assistant", content: "Able to work with MongoDB, PostgreSQL..." },
    {
      type: "user",
      content: "Uh, yes. I'm ready for that. I'm pretty excited.",
    },
    {
      type: "assistant",
      content:
        "Awesome. Let's kick things off, tell me among React, Next.js, Vue.js",
    },
    { type: "assistant", content: "Which one will you use and why?" },
    {
      type: "user",
      content: "Well, I will use Next.js for sure, because of its SSR and SSG",
    },
    { type: "assistant", content: "Thats great renit" },
    {
      type: "assistant",
      content: "Now tell me about your experience with react",
    },
    {
      type: "user",
      content:
        "I have worked with React for 2 years, where i learned lazy loading, hooks, context api",
    },
    {
      type: "assistant",
      content: "okay so tell me with your backend experience",
    },
    {
      type: "user",
      content: "Yes i worked with node , express , flask and even supabase.",
    },
    {
      type: "assistant",
      content: "Great, tell me something bout your projects?",
    },
    {
      type: "assistant",
      content:
        "Tell me any third party packages you have worked with in your project",
    },
    {
      type: "user",
      content:
        "yes, i created a neuratwin web app,  that uses openai api to generate text, langchain , mongodb , vapi ai for voice assistants, and sync with googpe calenders.",
    },
  ];


  //   -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Live interview
            </p>
            <h1 className="flex items-center gap-3 text-2xl font-semibold font-sora tracking-tight">
              <span className="font-extrabold">INTERVIEWX</span> AI Interview
              <LuVideo className="h-6 w-6 text-sky-300" />
            </h1>
            <p className="text-sm text-slate-400">
              Stay relaxed - we will guide you through every question.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-sky-900/40">
            <div
              className={`h-2.5 w-2.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
            />
            <span className="text-sm font-medium">
              {loading ? "Connecting" : "Connected"}
            </span>
            <Separator orientation="vertical" className="mx-2 h-6 bg-white/10" />
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Timer className="h-4 w-4" /> {formatTime(seconds)}
            </div>
            <Separator orientation="vertical" className="mx-2 h-6 bg-white/10" />
            <Image
              src={"/profile.png"}
              alt="User Avatar"
              width={56}
              height={56}
              className="h-12 w-12 rounded-full border border-white/10 object-cover"
              priority
            />
          </div>
        </div>

        <div className="grid grid-cols-[1.65fr_0.6fr] gap-5 max-lg:grid-cols-1">
          {/* LEFT */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-800/80 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="font-medium">Voice interview in progress</span>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                {interviewInfo?.jobPosition || "Interview"}
              </span>
            </div>

            <div className="relative isolate mt-4 flex h-[520px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.15),transparent_30%)]" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="relative z-[1] h-full w-full rounded-2xl object-cover"
              />
              {!isCameraOn && (
                <div className="relative z-[2] flex flex-col items-center gap-4 text-center">
                  <Image
                    src={"/profile.png"}
                    alt="User Avatar"
                    width={180}
                    height={180}
                    className="h-[180px] w-[180px] rounded-full border border-white/20 object-cover"
                    priority
                  />
                  <p className="text-lg font-semibold capitalize text-slate-100">
                    {interviewInfo?.userName}
                  </p>
                </div>
              )}

              <div className="absolute right-4 top-4 flex h-[180px] w-[180px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-3 text-center shadow-lg shadow-sky-900/40">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <h1 className="text-2xl font-extrabold text-white">AI</h1>
                </div>
                {!loading && (
                  <div className="flex flex-col items-center space-y-2 text-xs font-medium text-slate-200">
                    <AI_Voice />
                    <p>{activeUser ? "Speaking" : "Listening"}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button
                variant={isCameraOn ? "default" : "outline"}
                onClick={toggleCamera}
                className={`font-inter text-sm font-semibold shadow-lg transition-all duration-150 ${isCameraOn
                  ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400"
                  : "border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
              >
                {isCameraOn ? (
                  <LuVideo className="mr-2 h-4 w-4" />
                ) : (
                  <LuVideoOff className="mr-2 h-4 w-4" />
                )}
                Video
              </Button>

              <Button
                variant={isMicOn ? "default" : "outline"}
                onClick={toggleMic}
                className={`font-inter text-sm font-semibold shadow-lg transition-all duration-150 ${isMicOn
                  ? "bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-400 hover:to-sky-400"
                  : "border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
              >
                {isMicOn ? (
                  <LuMic className="mr-2 h-4 w-4" />
                ) : (
                  <LuMicOff className="mr-2 h-4 w-4" />
                )}
                Mic
              </Button>

              <Button
                variant="destructive"
                onClick={stopCall}
                className="font-inter text-sm font-semibold shadow-lg bg-gradient-to-r from-rose-600 to-orange-500 text-white hover:from-rose-500 hover:to-orange-400"
              >
                <X className="mr-2 h-4 w-4" />
                End
              </Button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex h-[650px] flex-col rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sky-600/30 via-indigo-500/30 to-fuchsia-500/30 px-4 py-3 text-sm font-semibold text-white shadow-inner">
              <div className="flex items-center gap-2">
                <LuMessagesSquare className="h-5 w-5" />
                <span>Live Transcription</span>
              </div>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-slate-100">
                Clarity matters
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-sm text-slate-200">
              All transcriptions appear here. Keep answers concise and relevant.
            </div>

            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
                <LuGhost className="mb-2 h-6 w-6" />
                <p className="text-sm font-medium">No transcriptions yet</p>
                <p className="text-xs text-slate-500">Your conversation will appear here once the call begins.</p>
              </div>
            ) : (
              <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.type === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs tracking-tight font-inter shadow-sm shadow-black/20 ${msg.type === "assistant"
                        ? "rounded-bl-none border border-white/10 bg-white/10 text-slate-50"
                        : "rounded-br-none bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                        }`}
                    >
                      {msg.content}
                    </div>
                    <div ref={scrollRef} />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 w-full">
              <Separator className="my-3 bg-white/10" />
              <Button className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg hover:from-sky-400 hover:via-indigo-400 hover:to-fuchsia-400">
                Download Transcription <LuDownload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
            <DialogHeader className="bg-gradient-to-br from-sky-600 via-indigo-500 to-fuchsia-400 p-5 text-white">
              <DialogTitle className="flex items-center justify-center gap-3 text-center text-2xl font-semibold font-sora">
                Congratulations! <LucideCheckCircle className="h-7 w-7 text-white" />
              </DialogTitle>
              <DialogDescription className="text-center text-base text-slate-100">
                {interviewInfo?.userName}, your interview has ended successfully
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-6 text-center">
              <p className="text-base text-slate-200">
                You have just completed your interview for <br />
                <span className="font-semibold">{interviewInfo?.jobTitle}</span>.
              </p>

              <p className="text-sm text-slate-400">You can now safely leave this meeting.</p>

              <div className="mt-6 flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-slate-200">
                <InfoIcon className="h-6 w-6 text-sky-300" />
                <p className="leading-relaxed">
                  You can close this tab or explore other interviews. Your feedback will be ready shortly.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full bg-white/10 text-white hover:bg-white/20"
                >
                  Close
                </Button>
                <Button className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400">
                  Explore <SearchCheck />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StartInterview;

// <Timer /> {formatTime(seconds)}
// onClick={stopCall}
//  {interviewInfo?.userName}
// onClick={() => setIsDialogOpen(false)}
// {interviewInfo?.jobTitle}
