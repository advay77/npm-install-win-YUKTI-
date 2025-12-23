"use client";
import { useInterview } from "@/context/interviewContext";
import { useParams, useRouter } from "next/navigation";
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
  DialogClose,
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
  const router = useRouter();
  const params = useParams<{ interviewID: string }>();
  const [vapiError, setVapiError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>("");
  const [activeUser, setActiveUser] = useState<boolean>(false);
  const [callFinished, setCallFinished] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [hasCallStartToast, setHasCallStartToast] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<string>("");
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const [vapi] = useState(() => new Vapi(VAPI_PUBLIC_KEY));

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const micInitRef = useRef(false);
  const cameraInitRef = useRef(false);

  const transcriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const missingRequired = !interviewInfo?.userName || !interviewInfo?.userEmail;
    if (missingRequired) {
      const id = (interviewInfo?.interviewID || (params?.interviewID as string)) || "";
      if (id) router.replace(`/interview/${id}`);
    }
  }, [interviewInfo?.userName, interviewInfo?.userEmail, interviewInfo?.interviewID, router, params]);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Start the interview only after explicit user interaction
  // to satisfy browser audio/mic permission requirements.
  const handleStart = async () => {
    if (hasStarted) return;
    try {
      // Prevent multiple attempts from the same email for this interview
      const already = await checkAlreadyAttempted();
      if (already) {
        setHasAttempted(true);
        toast.error("You have already completed this interview", {
          description: (
            <span className="text-sm text-gray-500 font-medium">
              Each email can submit once for this interview.
            </span>
          ),
        });
        return;
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startCall();
      setHasStarted(true);
    } catch (err) {
      console.error("Mic permission error:", err);
      toast.error("Microphone permission required", {
        description: (
          <span className="text-sm text-gray-500 font-medium">
            Please allow microphone access to start the interview.
          </span>
        ),
      });
    }
  };

  // Check in DB whether this email already attempted this interview
  const checkAlreadyAttempted = async (): Promise<boolean> => {
    try {
      if (!interviewInfo?.userEmail || !interviewInfo?.interviewID) return false;
      const { data, error } = await supabase
        .from("interview-details")
        .select("id")
        .eq("interview_id", interviewInfo.interviewID)
        .eq("userEmail", interviewInfo.userEmail)
        .limit(1);
      if (error) {
        console.error("Attempt check error:", error);
        return false;
      }
      return Array.isArray(data) && data.length > 0;
    } catch (e) {
      console.error("Attempt check unexpected error:", e);
      return false;
    }
  };

  // Preload attempt status when user info becomes available
  useEffect(() => {
    (async () => {
      const attempted = await checkAlreadyAttempted();
      if (attempted) {
        setHasAttempted(true);
      }
    })();
  }, [interviewInfo?.userEmail, interviewInfo?.interviewID]);

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

  // Auto-enable camera on load (single prompt)
  useEffect(() => {
    if (cameraInitRef.current) return;
    cameraInitRef.current = true;
    (async () => {
      try {
        await startCamera();
      } catch (err) {
        console.error("Camera auto-enable error:", err);
      }
    })();
  }, []);

  const toggleMic = async () => {
    try {
      if (isMicOn) {
        // Mute Vapi if supported
        try {
          (vapi as any)?.setMuted?.(true);
        } catch { }
        setIsMicOn(false);
        toast.success("Mic turned off");
      } else {
        // Ensure permission at least once
        await navigator.mediaDevices.getUserMedia({ audio: true });
        try {
          (vapi as any)?.setMuted?.(false);
        } catch { }
        setIsMicOn(true);
        toast.success("Mic turned on");
      }
    } catch (err) {
      console.error("Mic access error:", err);
    }
  };

  // Auto-enable mic on load (single prompt)
  useEffect(() => {
    if (micInitRef.current) return;
    micInitRef.current = true;
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        try {
          (vapi as any)?.setMuted?.(false);
        } catch { }
        setIsMicOn(true);
      } catch (err) {
        console.error("Mic auto-enable error:", err);
        setIsMicOn(false);
      }
    })();
  }, [vapi]);

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

  useEffect(() => {
    const handleSpeechStart = () => {
      setActiveUser(true);
    };

    const handleSpeechEnd = () => {
      setActiveUser(false);
    };

    const handleCallStart = () => {
      console.log("Call has started");
      setIsCallActive(true);
      setLoading(false);
      if (!hasCallStartToast) {
        setHasCallStartToast(true);
        toast.info("Interview started", {
          description: (
            <span className="text-sm text-gray-600 font-medium">
              Your interview has started. <span className="text-blue-600">All the best!</span>
            </span>
          ),
        });
      }
    };

    const handleCallEnd = () => {
      console.log("Call has stopped");
      setIsCallActive(false);
      setCallFinished(true);
      setHasCallStartToast(false);
    };

    const handleError = (e: any) => {
      console.error(e);
      setVapiError(e);
    };

    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("error", handleError);

    return () => {
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("error", handleError);
    };
  }, [vapi]);

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
    const handleMessage = (message: any) => {
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
    };

    vapi.on("message", handleMessage);

    return () => {
      vapi.off("message", handleMessage);
    };
  }, [vapi]);

  const stopCall = () => {
    stopCamera();
    vapi.stop();
    setIsMicOn(false);
    toast.success("Call ended");
  };

  const GenerateFeedback = async () => {
    setGenerateLoading(true);
    try {
      // Validate required info
      if (!interviewInfo?.userName || !interviewInfo?.userEmail || !interviewInfo?.interviewID) {
        console.error("❌ Missing interview info:", interviewInfo);
        toast.error("Missing candidate information. Cannot save feedback.");
        return;
      }

      console.log("📝 Generating feedback with info:", interviewInfo);
      const res = await axios.post("/api/ai-feedback", {
        conversation: messages,
      });
      console.log("✅ Feedback Result From GROQ LLM:", res.data);

      const { data, error } = await supabase
        .from("interview-details")
        .insert([
          {
            userName: interviewInfo.userName,
            userEmail: interviewInfo.userEmail,
            interview_id: interviewInfo.interviewID,
            feedback: res.data,
            recomended: "No",
            acceptResume: interviewInfo.acceptResume || false,
            organization: interviewInfo.organization || "",
            resumeURL: interviewInfo.resumeURL || null,
          },
        ])
        .select();

      if (error) {
        console.error("❌ Database Insert Error:", error);
        toast.error("Failed to save interview feedback", {
          description: error.message,
        });
        return;
      }

      console.log("✅ Interview Details Saved:", data);
      toast.success("Interview feedback saved successfully!", {
        description: (
          <span className="text-sm text-gray-500 font-medium">
            Your interview has been completed and feedback has been generated.
          </span>
        ),
      });
    } catch (err: any) {
      console.error("❌ GenerateFeedback Error:", err);
      toast.error("Error saving feedback", {
        description: err.message || "An unexpected error occurred",
      });
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

  const downloadTranscription = () => {
    if (messages.length === 0) {
      toast.error("No transcription to download", {
        description: (
          <span className="text-sm text-gray-500 font-medium">
            Start the interview first to generate transcription.
          </span>
        ),
      });
      return;
    }

    const transcript = messages
      .map((msg) => `${msg.type === "user" ? "You" : "AI"}: ${msg.content}`)
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-transcript-${interviewInfo?.interviewID || "unknown"}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Transcription downloaded", {
      description: (
        <span className="text-sm text-gray-500 font-medium">
          Your interview transcript has been saved.
        </span>
      ),
    });
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
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-3 py-3 text-slate-50 overflow-hidden flex flex-col">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 flex-1 w-full min-h-0">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur shrink-0">
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">
              Live interview
            </p>
            <h1 className="flex items-center gap-2.5 text-xl font-bold font-sora tracking-tight">
              <span className="font-extrabold">INTERVIEWX</span> AI Interview
              <LuVideo className="h-5 w-5 text-sky-300" />
            </h1>
            <p className="text-xs font-medium text-slate-400">
              Stay relaxed - we will guide you through every question.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 shadow-inner shadow-sky-900/40">
            {(() => {
              const dotClass = callFinished
                ? "bg-rose-400"
                : isCallActive
                  ? "bg-emerald-400"
                  : loading
                    ? "bg-amber-400 animate-pulse"
                    : "bg-slate-400";
              const label = callFinished
                ? "Ended"
                : isCallActive
                  ? "Connected"
                  : loading
                    ? "Connecting"
                    : "Ready";
              return (
                <>
                  <div className={`h-3 w-3 rounded-full ${dotClass}`} />
                  <span className="text-sm font-semibold">{label}</span>
                </>
              );
            })()}
            <Separator orientation="vertical" className="h-5 bg-white/10" />
            <div className="flex items-center gap-2 text-sm font-bold tabular-nums">
              <Timer className="h-4 w-4 text-slate-300" /> {formatTime(seconds)}
            </div>
            <Separator orientation="vertical" className="h-5 bg-white/10" />
            <Image
              src={"/profile.png"}
              alt="User Avatar"
              width={48}
              height={48}
              className="h-11 w-11 rounded-full border-2 border-white/20 object-cover shadow-sm"
              priority
            />
          </div>
        </div>

        <div className="grid grid-cols-[1.4fr_0.8fr] gap-3 max-lg:grid-cols-1 flex-1 min-h-0 overflow-hidden">
          {/* LEFT */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-800/80 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl flex flex-col min-h-0">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="font-semibold text-xs">Voice interview in progress</span>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {interviewInfo?.jobPosition || "Interview"}
              </span>
            </div>

            <div className="relative isolate mt-2 flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.15),transparent_30%)]" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full rounded-xl object-cover"
              />
              {!isCameraOn && (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-center">
                  <Image
                    src="/profile.png"
                    alt="User Avatar"
                    width={100}
                    height={100}
                    className="h-[100px] w-[100px] rounded-full border-3 border-white/20 object-cover shadow-2xl"
                    priority
                  />
                  <p className="text-sm font-bold capitalize text-slate-100">
                    {interviewInfo?.userName}
                  </p>
                </div>
              )}

              <div className="absolute right-3 top-3 z-[2] flex h-[95px] w-[95px] flex-col items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-2 text-center shadow-xl shadow-sky-900/50">
                <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white/15 shadow-inner">
                  <h1 className="text-base font-extrabold text-white tracking-tight">AI</h1>
                </div>
                {!loading && (
                  <div className="flex flex-col items-center gap-0.5 text-[9px] font-semibold text-slate-100">
                    <AI_Voice />
                    <p className="text-[8px] font-semibold">{activeUser ? "Speaking" : "Listening"}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={handleStart}
                disabled={hasAttempted}
                className={`h-9 px-4 font-inter text-xs font-bold shadow-lg ${hasAttempted ? "opacity-60 cursor-not-allowed bg-white/10 text-slate-300" : "bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400"}`}
              >
                Start <SearchCheck className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={toggleCamera}
                className={`h-9 px-4 font-inter text-xs font-bold shadow-lg transition-all duration-150 ${isCameraOn
                  ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400"
                  : "border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
              >
                {isCameraOn ? (
                  <LuVideo className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <LuVideoOff className="mr-1.5 h-3.5 w-3.5" />
                )}
                Video
              </Button>

              <Button
                onClick={toggleMic}
                className={`h-9 px-4 font-inter text-xs font-bold shadow-lg transition-all duration-150 ${isMicOn
                  ? "bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:from-emerald-400 hover:to-sky-400"
                  : "border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10"
                  }`}
              >
                {isMicOn ? (
                  <LuMic className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <LuMicOff className="mr-1.5 h-3.5 w-3.5" />
                )}
                Mic
              </Button>

              <Button
                variant="destructive"
                onClick={stopCall}
                className="h-9 px-4 font-inter text-xs font-bold shadow-lg bg-gradient-to-r from-rose-600 to-orange-500 text-white hover:from-rose-500 hover:to-orange-400"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                End
              </Button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl min-h-0 overflow-hidden">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-600/30 via-indigo-500/30 to-fuchsia-500/30 px-3 py-2 text-xs font-bold text-white shadow-inner shrink-0">
              <div className="flex items-center gap-2">
                <LuMessagesSquare className="h-4 w-4" />
                <span className="font-bold text-xs">Live Transcription</span>
              </div>
              <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.15em] font-bold text-slate-50">
                Clarity matters
              </span>
            </div>

            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-[11px] leading-relaxed font-medium text-slate-200 shrink-0">
              All transcriptions appear here. Keep answers concise and relevant.
            </div>

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-400 flex-1 min-h-0 overflow-hidden">
                <LuGhost className="h-8 w-8 opacity-50" />
                <p className="text-xs font-semibold text-slate-300">No transcriptions yet</p>
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-[200px]">Your conversation will appear here once the call begins.</p>
              </div>
            ) : (
              <div ref={transcriptRef} className="mt-2 space-y-2 overflow-y-auto overflow-x-hidden pr-1.5 flex-1 min-h-0">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.type === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-relaxed font-inter shadow-sm shadow-black/20 break-words ${msg.type === "assistant"
                        ? "rounded-bl-none border border-white/10 bg-white/10 text-slate-50"
                        : "rounded-br-none bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium"
                        }`}
                    >
                      {msg.content}
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 w-full shrink-0">
              <Separator className="mb-2 bg-white/10" />
              <Button onClick={downloadTranscription} className="flex w-full items-center justify-center gap-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-lg hover:from-sky-400 hover:via-indigo-400 hover:to-fuchsia-400 h-9">
                Download Transcription <LuDownload className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent showCloseButton={false} className="max-w-md overflow-hidden rounded-none border border-white/10 bg-slate-900 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
            <DialogHeader className="relative bg-gradient-to-br from-sky-600 via-indigo-500 to-fuchsia-400 p-6 pr-12 text-white">
              <DialogTitle className="flex items-center justify-center gap-3 text-center text-2xl font-bold font-sora">
                Congratulations! <LucideCheckCircle className="h-7 w-7 text-white" />
              </DialogTitle>
              <DialogDescription className="text-center text-base font-medium text-slate-100">
                {(interviewInfo?.userName ?? "Candidate")}, your interview has ended successfully
              </DialogDescription>
              <DialogClose className="absolute right-4 top-4 rounded-md text-[#005eff] transition-colors duration-150 hover:text-[#0047cc]">
                <LuX className="h-5 w-5" />
              </DialogClose>
            </DialogHeader>

            <div className="flex flex-col gap-5 p-6 text-center">
              <p className="text-base font-medium text-slate-200">
                You have just completed your interview for <br />
                <span className="font-bold text-white">{interviewInfo?.jobPosition ?? interviewInfo?.jobTitle ?? "your selected role"}</span>.
              </p>

              <p className="text-sm font-medium text-slate-400">You can now safely leave this meeting.</p>

              <div className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm font-medium text-slate-200">
                <InfoIcon className="h-6 w-6 text-sky-300" />
                <p className="leading-relaxed">
                  You can close this tab or explore other interviews. Your feedback will be ready shortly.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 w-full font-semibold bg-white/10 text-white hover:bg-white/20"
                >
                  Close
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
