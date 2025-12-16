/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
// 5bddec57-596b-458d-bdf5-e762fdc61a92
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

  // ====================================================
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

  // ================================================
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

  // =================================================

  const startCall = async () => {
    let questionList = "";
    interviewInfo?.interviewData?.forEach((item: any, index: number) => {
      questionList +=
        item.question +
        (index < interviewInfo.interviewData.length - 1 ? "," : "");
    });
    try {
      await vapi.start({
        // Basic assistant configuration
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

        // Voice configuration Elliot
        voice: {
          provider: "vapi",
          voiceId: "Hana",
        },

        // Transcriber configuration
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },

        // Call settings
        firstMessage:
          "Hi " +
          interviewInfo?.userName +
          ", how are you? Ready for your interview on " +
          interviewInfo?.jobPosition +
          "?",
        endCallMessage:
          "Thanks for chatting! Hope to see you crushing projects soon!",
        endCallPhrases: ["goodbye", "bye", "end call", "hang up"],

        // Silence timeout (in seconds)
        silenceTimeoutSeconds: 20,

        // Max call duration (in seconds) - 10 minutes/ 5min
        maxDurationSeconds: 300,
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
  // TIMER--------------------------------
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isCallActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Reset timer when call ends
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

  // ===============================================
  useEffect(() => {
    vapi.on("message", (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const role = message.role === "user" ? "user" : "assistant";
        const content = message.transcript;

        //  Prevent duplicates
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

  // =============================================

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

  // messages to pass to feedback
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
    // User: hello
    // Assistant: Hi, how can I help?
    setConversation(
      (prev) => `${prev}\n${type === "user" ? "User" : "Assistant"}: ${content}`
    );
  };

  // --------------------TESTING-----------------------------
  // const handleCheckConversation = () => {
  //   console.log("🔹 Messages Array:", messages);
  // };

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
    <div className="w-full h-screen overflow-hidden  bg-white p-4">
      <div className="flex justify-between w-full">
        <div>
          <h1 className="text-[24px] font-sora font-semibold mt-2 flex items-center gap-4">
            <span className="font-extrabold font-sora text-2xl tracking-tighter">
              INTERVIEWX
            </span>{" "}
            AI Interview <LuVideo className="w-6 h-6" />
          </h1>
        </div>
        <Image
          src={"/profile.png"}
          alt="User Avatar"
          width={70}
          height={70}
          className="rounded-full w-[65px] h-[65 px] shrink-0"
          priority
        />
      </div>
      <Separator className="my-2 max-w-[90%] bg-gray-300 mx-auto" />

      {/* PARENT BOX - LEFT VIDEO / RIGHT - MESSAGE */}
      <div className="flex gap-5 ">
        {/* LEFT */}
        <div className="flex-1 p-2">
          <div className="flex justify-between mb-2">
            {loading ? (
              <div className="flex gap-4">
                <div className="w-5 h-5 bg-red-400 rounded-full animate-bounce"></div>
                <p className="font-inter text-base tracking-wide">
                  Connecting...
                </p>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="w-5 h-5 bg-green-300 rounded-full animate-bounce"></div>
                <p className="font-inter text-base tracking-wide">Connected</p>
              </div>
            )}

            <p className="text-xl flex items-center gap-3 font-semibold">
              <Timer /> {formatTime(seconds)}
            </p>
          </div>
          {/* VIDEO PART */}
          <div className="flex  justify-center w-full h-[520px] border-2 rounded-lg shadow relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-xl"
            />
            {!isCameraOn && (
              <div>
                <Image
                  src={"/profile.png"}
                  alt="User Avatar"
                  width={70}
                  height={70}
                  className="rounded-full w-[200px] h-[200px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  priority
                />
                <p className="absolute top-[70%] left-1/2 -translate-x-1/2 font-inter capitalize text-lg font-semibold">{interviewInfo?.userName} </p>

              </div>
            )}

            <div className="w-[180px] h-[180px] bg-blue-50 absolute top-3 right-3 rounded-lg border-2 border-blue-400 flex flex-col items-center justify-center overflow-hidden">
              <div className="  bg-white border rounded-full w-16 h-16 flex items-center justify-center shrink-0 -mb-5">
                <h1 className="font-extrabold font-inter text-2xl">AI</h1>
              </div>
              {!loading && (
                <div className="mt-10 flex flex-col space-y-1">
                  <AI_Voice />
                  {activeUser ? (
                    <p className="text-center font-inter text-sm">Speaking</p>
                  ) : (
                    <p className="text-center font-inter text-sm">Listening</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-center gap-10">
            {/*  Video Button */}
            <Button
              variant={isCameraOn ? "default" : "outline"}
              onClick={toggleCamera}
              className="font-inter text-sm shadow-md cursor-pointer"
            >
              {isCameraOn ? (
                <LuVideo className="w-4 h-4 mr-2 text-white" />
              ) : (
                <LuVideoOff className="w-4 h-4 mr-2 text-black" />
              )}
              Video
            </Button>
            {/*  Mic Button */}
            <Button
              variant={isMicOn ? "default" : "outline"}
              onClick={toggleMic}
              className="font-inter text-sm shadow-md cursor-pointer"
            >
              {isMicOn ? (
                <LuMic className="w-4 h-4 mr-2 text-white" />
              ) : (
                <LuMicOff className="w-4 h-4 mr-2 text-black" />
              )}
              Mic
            </Button>
            {/*  End Button */}
            <Button
              variant="destructive"
              onClick={stopCall}
              className="font-inter text-sm shadow-md cursor-pointer"
            >
              <X className="w-4 h-4 mr-2" />
              End
            </Button>

            {/* TESTING BUTTON */}
            {/* <Button className="text-sm font-inter" onClick={testing}>
              Test
            </Button> */}
          </div>
        </div>
        {/* RIGHT */}
        <div className="w-[28%] bg-gray-50 rounded-lg border p-3 flex flex-col">
          <h2 className="flex items-center justify-center gap-3 font-inter text-xl">
            Transcribe <LuMessagesSquare className="w-6 h-6" />
          </h2>
          <div className="bg-blue-50 border border-blue-400 mt-4 px-3 py-6 rounded-md">
            <p className="font-inter tracking-tight text-sm text-center">
              All transcriptions appear here. Please give clear, relevant
              answers.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full ">
              <h2 className="font-inter text-lg text-muted-foreground mb-2">
                No Transcriptions Available
              </h2>
              <LuGhost className="w-6 h-6 text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3 h-[380px] mt-5 overflow-y-scroll">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.type === "assistant" ? "justify-start" : "justify-end"
                    }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-xs tracking-tight font-inter shadow-sm ${msg.type === "assistant"
                      ? "bg-white text-foreground rounded-bl-none"
                      : "bg-primary text-primary-foreground rounded-br-none"
                      }`}
                  >
                    {msg.content}
                  </div>
                  <div ref={scrollRef} />
                </div>
              ))}
            </div>
          )}

          <div className="w-full mt-auto">
            <Separator className="my-2" />
            <Button className="font-inter text-sm w-full bg-gradient-to-br from-indigo-400 to-sky-500 text-white hover:bg-blue-600 cursor-pointer">
              Download Transcribe <LuDownload className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 overflow-hidden rounded-md max-w-md ">
          {/* Header with gradient */}
          <DialogHeader className="bg-gradient-to-br from-blue-500 via-indigo-400 to-pink-300 p-5">
            <DialogTitle className="text-center flex items-center justify-center gap-3 text-white text-2xl font-semibold font-sora">
              Congratulations!{" "}
              <LucideCheckCircle className="w-7 h-7 text-white" />
            </DialogTitle>
            <DialogDescription className="text-lg text-gray-100 font-inter text-center">
              {interviewInfo?.userName}, your interview has ended successfully
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <div className="p-6 text-center space-y-4">
            <p className="text-muted-foreground text-base font-inter">
              You’ve just completed your interview for <br />
              <span className="font-semibold">{interviewInfo?.jobTitle}</span>.
            </p>

            <p className="text-base text-gray-500">
              You can now safely leave this meeting.
            </p>

            <div className="bg-blue-200 border border-blue-600 p-3 rounded-md flex gap-3 mt-10">
              <InfoIcon className="w-8 h-8 text-blue-600" />
              <p className="tracking-tight text-sm font-inter">
                You can either close this tab or you can also check other
                interviews by clikcing on Explore!
              </p>
            </div>

            <div className=" grid grid-cols-2 justify-items-center gap-6">
              <Button
                onClick={() => setIsDialogOpen(false)}
                className="w-full  font-medium bg-gray-300 text-black cursor-pointer hover:bg-gray-100 "
              >
                Close
              </Button>
              <Button className="w-full  font-medium ">
                Explore <SearchCheck />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartInterview;

// <Timer /> {formatTime(seconds)}
// onClick={stopCall}
//  {interviewInfo?.userName}
// onClick={() => setIsDialogOpen(false)}
// {interviewInfo?.jobTitle}
