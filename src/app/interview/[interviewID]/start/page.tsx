"use client";
import { useInterview } from "@/context/interviewContext";
import { useParams, useRouter } from "next/navigation";
import {
  InfoIcon,
  SearchCheck,
  Timer,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { generatePDFReport } from "@/utils/pdfGenerator";
import Vapi from "@vapi-ai/web";
import {
  LuDownload,
  LuGhost,
  LuMessagesSquare,
  LuMic,
  LuMicOff,
  LuVideo,
  LuVideoOff,
  LuX,
  LuTerminal,
} from "react-icons/lu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { supabase } from "@/services/supabaseClient";
import { Separator } from "@/components/ui/separator";
import AI_Voice from "@/components/kokonutui/AiVoice";
import CodeEditor from "@/components/CodeEditor";

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
  const { interviewInfo } = useInterview();
  const router = useRouter();
  const params = useParams<{ interviewID: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUser, setActiveUser] = useState<boolean>(false);
  const [callFinished, setCallFinished] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [hasCallStartToast, setHasCallStartToast] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);
  const [hasAcknowledgedInstructions, setHasAcknowledgedInstructions] = useState(false);
  const [showPreInterviewModal, setShowPreInterviewModal] = useState(false);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Coding Mode States
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [code, setCode] = useState<string>("// JavaScript Solution\nconsole.log(\"InterviewX IDE Initialized.\");\n\nfunction main() {\n    const message = \"The code is running successfully!\";\n    console.log(message);\n}\n\nmain();");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeOutput, setCodeOutput] = useState("");
  const [codeHistory, setCodeHistory] = useState<{ timestamp: number, code: string }[]>([]);
  const [activeProblem, setActiveProblem] = useState<any>(null);

  // Update default code when language changes
  useEffect(() => {
    // Only set default if user hasn't edited anything or the code is the default of a language
    const defaults = [
      "// JavaScript Solution\nconsole.log(\"InterviewX IDE Initialized.\");\n\nfunction main() {\n    const message = \"The code is running successfully!\";\n    console.log(message);\n}\n\nmain();",
      "# Python Solution\nprint(\"Python Environment Ready.\")\n\ndef greet(name):\n    print(f\"Hello, {name}!\")\n\ngreet(\"Candidate\")",
      "// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"C++ Output System Ready!\" << endl;\n    cout << \"Status Code: 200\" << endl;\n    return 0;\n}",
      "// Java Solution\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java!\");\n    }\n}"
    ];

    if (code === "" || defaults.includes(code)) {
      if (codeLanguage === "python") setCode("# Python Solution\nprint(\"Python Environment Ready.\")\n\ndef greet(name):\n    print(f\"Hello, {name}!\")\n\ngreet(\"Candidate\")");
      else if (codeLanguage === "cpp") setCode("// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"C++ Output System Ready!\" << endl;\n    cout << \"Status Code: 200\" << endl;\n    return 0;\n}");
      else if (codeLanguage === "java") setCode("// Java Solution\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java!\");\n    }\n}");
      else if (codeLanguage === "javascript") setCode("// JavaScript Solution\nconsole.log(\"InterviewX IDE Initialized.\");\n\nfunction main() {\n    const message = \"The code is running successfully!\";\n    console.log(message);\n}\n\nmain();");
    }
  }, [codeLanguage]);

  const [vapi] = useState(() => new Vapi(VAPI_PUBLIC_KEY));

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const micInitRef = useRef(false);
  const cameraInitRef = useRef(false);

  // Cheating detection states
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [suspiciousActivities, setSuspiciousActivities] = useState<string[]>([]);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [warnedCategories, setWarnedCategories] = useState<Set<string>>(new Set());
  const cheatingDetectionRef = useRef<any>(null);
  const previousImageDataRef = useRef<ImageData | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const missingRequired = !interviewInfo?.userName || !interviewInfo?.userEmail;
    if (missingRequired) {
      const id = (interviewInfo?.interviewID || (params?.interviewID as string)) || "";
      if (id) router.replace(`/interview/${id}`);
    }
  }, [interviewInfo, router, params]);

  useEffect(() => {
    if (!hasAcknowledgedInstructions) {
      setShowPreInterviewModal(true);
    }
  }, [hasAcknowledgedInstructions]);

  const checkAlreadyAttempted = async (): Promise<boolean> => {
    try {
      if (!interviewInfo?.userEmail || !interviewInfo?.interviewID) return false;
      const { data, error } = await supabase
        .from("interview-details")
        .select("id")
        .eq("interview_id", interviewInfo.interviewID)
        .eq("userEmail", interviewInfo.userEmail)
        .limit(1);
      if (error) return false;
      return Array.isArray(data) && data.length > 0;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      const attempted = await checkAlreadyAttempted();
      if (attempted) {
        setHasAttempted(true);
      }
    })();
  }, [interviewInfo]);

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
      startCheatingDetection();
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
    stopCheatingDetection();
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera(); // Already sets isCameraOn to false
    } else {
      startCamera(); // Already sets isCameraOn to true
    }
  };

  useEffect(() => {
    if (cameraInitRef.current) return;
    cameraInitRef.current = true;
    startCamera();
  }, []);

  const toggleMic = async () => {
    try {
      if (isMicOn) {
        // Turning OFF
        if (isCallActive) {
          try {
            (vapi as any)?.setMuted?.(true);
          } catch (e) {
            console.warn("Vapi Mute Error (ignore if call ended):", e);
          }
        }
        setIsMicOn(false);
        toast.info("Mic Muted", { icon: "🔇" });
      } else {
        // Turning ON
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCallActive) {
          try {
            (vapi as any)?.setMuted?.(false);
          } catch (e) {
            console.warn("Vapi Unmute Error (ignore if call ended):", e);
          }
        }
        setIsMicOn(true);
        toast.success("Mic Unmuted", { icon: "🎤" });
      }
    } catch (err) {
      console.error("Mic access error:", err);
      toast.error("Could not access microphone");
    }
  };

  useEffect(() => {
    if (micInitRef.current) return;
    micInitRef.current = true;
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicOn(true);
      } catch (err) {
        setIsMicOn(false);
      }
    })();
  }, [vapi]);

  const startCall = async () => {
    let questionList = "";
    interviewInfo?.interviewData?.forEach((item: { question: string }, index: number) => {
      questionList += item.question + (index < interviewInfo.interviewData.length - 1 ? "," : "");
    });
    try {
      await vapi.start({
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a professional AI interviewer for ${interviewInfo?.jobPosition || 'this role'}. 
FOLLOW THIS STRUCTURED INTERVIEW FLOW:

Phase 1: Oral Introduction (2 Questions)
1. Start with a brief, friendly introduction.
2. Ask exactly TWO technical oral questions from this list: ${questionList}.
3. Listen and provide brief feedback or small follow-ups.

Phase 2: Coding Assessment
1. After the 2 oral questions, explicitly say: "Great! Now let's move on to a practical coding challenge. Please switch to the Coding View if you haven't already."
2. Give them ONE specific coding problem and IMMEDIATELY follow your verbal explanation with a hidden JSON structure.
3. FORMAT REQUIREMENT: Your output must contain the string "PROBLEM_JSON:" followed by a valid JSON object. IMPORTANT: Do NOT speak the JSON part aloud; it is for the UI only.
   PROBLEM_JSON: {
     "title": "Problem Title",
     "description": "Full description of the logic required.",
     "examples": [
       {"input": "example input", "output": "expected output", "explanation": "optional"}
     ]
   }
4. INSTRUCTIONS FOR CANDIDATE: "Write your solution in the editor. You can click 'Run' to test it locally. Once you're ready for me to review it, click 'Discuss with AI'."
5. BEHAVIOR: You CANNOT see the code in real-time. You only see it when the candidate clicks 'Discuss with AI'. 
6. When they share the code: 
   - Analyze the logic, time/space complexity.
   - Point out bugs or suggest optimizations.
   - Ask them why they chose this specific approach.

Keep your tone professional, encouraging, and highly technical during the coding phase.`
            },
          ],
        },
        voice: { provider: "vapi", voiceId: "Hana" },
        transcriber: { provider: "deepgram", model: "nova-2", language: "en-US" },
        firstMessage: "Hi " + interviewInfo?.userName + ", how are you? Ready for your interview today?",
      });
    } catch (error) {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!hasAcknowledgedInstructions) {
      toast.error("Please acknowledge instructions first.");
      setShowPreInterviewModal(true);
      return;
    }
    if (hasStarted) return;
    try {
      if (await checkAlreadyAttempted()) {
        setHasAttempted(true);
        toast.error("Already attempted.");
        return;
      }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startCall();
      setHasStarted(true);
    } catch (err) { }
  };

  useEffect(() => {
    const handleSpeechStart = () => setActiveUser(true);
    const handleSpeechEnd = () => setActiveUser(false);
    const handleCallStart = () => {
      setIsCallActive(true);
      setLoading(false);
      // Sync mute state on start
      (vapi as any)?.setMuted?.(!isMicOn);
      if (!hasCallStartToast) {
        setHasCallStartToast(true);
        toast.info("Interview started");
      }
    };
    const handleCallEnd = () => {
      setIsCallActive(false);
      setCallFinished(true);
    };

    const handleVapiError = (error: any) => {
      console.error("Vapi Global Error:", error);
      // Suppress technical meeting ejection messages as they are often redundant
      const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
      if (errorMsg.includes("Meeting has ended") || errorMsg.includes("ejection")) {
        return;
      }
      toast.error("Connection issue detected.");
    };

    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("error", handleVapiError);

    return () => {
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("error", handleVapiError);
    };
  }, [vapi, hasCallStartToast]);

  useEffect(() => {
    if (callFinished) {
      GenerateFeedback();
      setIsDialogOpen(true);
    }
  }, [callFinished]);

  useEffect(() => {
    let interval: any = null;
    if (isCallActive) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isCallActive]);

  // Scan existing messages for a problem if not already active
  useEffect(() => {
    if (activeProblem) return;
    const lastProblemMessage = [...messages].reverse().find(m => m.type === "assistant" && m.content.includes("PROBLEM_JSON:"));
    if (lastProblemMessage) {
      try {
        const content = lastProblemMessage.content;
        const markerIndex = content.indexOf("PROBLEM_JSON:");
        const jsonSubstring = content.substring(markerIndex + "PROBLEM_JSON:".length);
        const firstBrace = jsonSubstring.indexOf("{");
        const lastBrace = jsonSubstring.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonPart = jsonSubstring.substring(firstBrace, lastBrace + 1);
          setActiveProblem(JSON.parse(jsonPart));
        }
      } catch (e) {
        console.error("Failed to parse historical problem JSON", e);
      }
    }
  }, [messages, activeProblem]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const role = message.role === "user" ? "user" : "assistant";
        const content = message.transcript || "";
        setMessages((prev) => [...prev, { type: role as "user" | "assistant", content }]);

        // Logic to detect Problem JSON from AI
        if (role === "assistant" && content.includes("PROBLEM_JSON:")) {
          try {
            // Find the first '{' after PROBLEM_JSON: and the last '}'
            const markerIndex = content.indexOf("PROBLEM_JSON:");
            const jsonSubstring = content.substring(markerIndex + "PROBLEM_JSON:".length);
            const firstBrace = jsonSubstring.indexOf("{");
            const lastBrace = jsonSubstring.lastIndexOf("}");

            if (firstBrace !== -1 && lastBrace !== -1) {
              const jsonPart = jsonSubstring.substring(firstBrace, lastBrace + 1);
              const problemData = JSON.parse(jsonPart);
              setActiveProblem(problemData);
              toast.success("New coding challenge received!");
            }
          } catch (err) {
            console.error("Failed to parse problem JSON", err);
          }
        }
      }
    };
    (vapi as any)?.on("message", handleMessage);
    return () => {
      (vapi as any)?.off("message", handleMessage);
    };
  }, [vapi]);

  // Periodic Code Snapshotting for Keystroke Replay
  useEffect(() => {
    if (!isCallActive || !isCodingMode) return;

    // Capture initial state immediately
    if (codeHistory.length === 0) {
      setCodeHistory([{ timestamp: Date.now(), code: code }]);
    }

    const interval = setInterval(() => {
      setCodeHistory(prev => {
        // Only add if code has changed since last snapshot
        if (prev.length > 0 && prev[prev.length - 1].code === code) return prev;
        return [...prev, { timestamp: Date.now(), code: code }];
      });
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [isCallActive, isCodingMode, code]);

  const stopCall = () => {
    toast.info("Wrapping up your interview...");
    stopCamera();
    try {
      vapi.stop();
    } catch (e) {
      console.warn("Vapi Stop Error:", e);
    }
    setIsMicOn(false);
    setIsCallActive(false);
    stopCheatingDetection();

    // Manually trigger finishing state if not already done
    if (!callFinished) {
      setCallFinished(true);
    }
  };

  const startCheatingDetection = () => {
    if (cheatingDetectionRef.current) return;
    cheatingDetectionRef.current = setInterval(() => detectSuspiciousActivity(), 5000);
  };

  const stopCheatingDetection = () => {
    if (cheatingDetectionRef.current) {
      clearInterval(cheatingDetectionRef.current);
      cheatingDetectionRef.current = null;
    }
  };

  const detectSuspiciousActivity = () => {
    if (!videoRef.current || !isCallActive) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const activity = analyzeFrameForCheating(imageData);
      if (activity) handleSuspiciousActivity(activity);
      if (previousImageDataRef.current) {
        const motion = detectMotion(previousImageDataRef.current, imageData);
        if (motion > 0.05) handleSuspiciousActivity("movement");
      }
      previousImageDataRef.current = imageData;
    } catch (e) { }
  };

  const analyzeFrameForCheating = (imageData: ImageData): string | null => {
    const data = imageData.data;
    let brightness = 0;
    let brightPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      brightness += avg;
      if (avg > 200) brightPixels++;
    }
    const avgBrightness = brightness / (data.length / 4);
    if (avgBrightness < 30) return "low_light";
    if (brightPixels / (data.length / 4) > 0.1) return "bright_screen";
    return null;
  };

  const detectMotion = (prev: ImageData, curr: ImageData): number => {
    let changed = 0;
    for (let i = 0; i < prev.data.length; i += 4) {
      const diff = Math.abs(prev.data[i] - curr.data[i]);
      if (diff > 30) changed++;
    }
    return changed / (prev.data.length / 4);
  };

  const handleSuspiciousActivity = (category: string) => {
    if (warnedCategories.has(category)) return;
    setWarnedCategories(prev => new Set(prev).add(category));
    const timestamp = new Date().toLocaleTimeString();
    setSuspiciousActivities(prev => [...prev.slice(-4), `${timestamp}: ${category}`]);
    setWarningCount(prev => prev + 1);

    let msg = "⚠️ Warning: Suspicious activity.";
    if (category === "low_light") msg = "⚠️ Warning: Low lighting.";
    if (category === "bright_screen") msg = "⚠️ Warning: Device screen detected.";
    if (category === "movement") msg = "⚠️ Warning: Movement detected.";

    setWarningMessage(msg);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);

    if (warningCount + 1 >= 3) {
      toast.error("Terminated due to multiple warnings.");
      stopCall();
      router.push("/");
    }
  };

  const toggleCodingMode = () => {
    const next = !isCodingMode;
    setIsCodingMode(next);
    if (isCallActive) {
      try {
        vapi.send({
          type: "add-message",
          message: {
            role: "system",
            content: `The candidate has switched to ${next ? 'CODING VIEW' : 'VIDEO VIEW'}.`,
          },
        });
      } catch (e) {
        console.warn("Vapi Send Mode Sync Error:", e);
      }
    }
    toast.info(`Switched to ${next ? 'Coding' : 'Video'} Mode`);
  };

  const runCode = () => {
    setCodeOutput("Running...\n");
    setTimeout(() => {
      if (codeLanguage === "javascript") {
        try {
          const consoleLog: string[] = [];
          const logHandler = (...args: any[]) => {
            const output = args.map(a =>
              typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
            ).join(" ");
            consoleLog.push(output);
          };

          const customConsole = {
            log: logHandler,
            info: logHandler,
            warn: logHandler,
            debug: logHandler,
            error: (...args: any[]) => logHandler("ERROR:", ...args),
          };

          const run = new Function("console", `try { ${code} } catch(e) { console.error(e.message); }`);
          run(customConsole);

          const finalOutput = consoleLog.join("\n") || "(Code executed, but produced no output. Did you call your function?)";
          setCodeOutput(finalOutput);
        } catch (err: any) {
          setCodeOutput("Runtime Error: " + err.message);
        }
      } else if (codeLanguage === "python") {
        // Advanced Simulation for Interview Use-cases
        const outputs: string[] = [];

        // Match string literals
        const stringPrints = code.match(/print\s*\(\s*f?['"](.*?)['"]\s*\)/g);
        if (stringPrints) {
          stringPrints.forEach(p => {
            const m = p.match(/['"](.*?)['"]/);
            if (m) outputs.push(m[1]);
          });
        }

        // Match variable assignments and prints
        const variableMatch = code.match(/(\w+)\s*=\s*['"]?(.*?)['"]?\s*\n/g);
        if (variableMatch) {
          variableMatch.forEach(v => {
            const parts = v.split("=");
            const varName = parts[0].trim();
            const varVal = parts[1].trim().replace(/['"]/g, "");

            const varPrint = new RegExp(`print\\s*\\(\\s*${varName}\\s*\\)`, 'g');
            if (varPrint.test(code)) {
              outputs.push(varVal);
            }
          });
        }

        if (outputs.length > 0) {
          setCodeOutput(outputs.join("\n") + "\n\n(Simulated Python Response)");
        } else {
          setCodeOutput("Code executed successfully.\n(For dynamic logic, click 'Discuss with AI' to have the AI review your solution)");
        }
      } else if (codeLanguage === "cpp") {
        const outputs: string[] = [];
        const couts = code.match(/cout\s*<<\s*['"](.*?)['"]\s*/g);
        if (couts) {
          couts.forEach(c => {
            const m = c.match(/['"](.*?)['"]/);
            if (m) outputs.push(m[1]);
          });
          setCodeOutput(outputs.join("") + "\n\n(Simulated C++ Output)");
        } else {
          setCodeOutput("Build successful.\nProcess exited with status 0.");
        }
      } else {
        setCodeOutput(`Run functionality for ${codeLanguage} is simulated.\nPlease click 'Discuss with AI' to get technical feedback on your logic.`);
      }
    }, 600);
  };

  const askAIToDiscussCode = () => {
    if (!isCallActive) {
      toast.error("Please start the interview first.");
      return;
    }
    toast.info("Sharing code with AI...");
    vapi.send({
      type: "add-message",
      message: {
        role: "system",
        content: `CANDIDATE SHARED CODE UPDATE:
Language: ${codeLanguage}
Code Content:
${code}

Code Execution Output (if any):
${codeOutput || 'Not executed yet.'}

Please review this solution for correctness and optimization. Discuss it with the candidate immediately.`,
      },
    });
  };

  const GenerateFeedback = async () => {
    setGenerateLoading(true);
    let aiFeedback = null;

    // 1. Try to get AI Feedback
    try {
      if (messages.length > 0) {
        const res = await axios.post("/api/ai-feedback", { conversation: messages });
        aiFeedback = res.data;
      } else {
        console.warn("No conversation messages found to analyze.");
      }
    } catch (err: any) {
      console.error("AI Feedback Generation Failed:", err);
      toast.error("AI analysis encountered an issue, but your completion is being saved.");
    }

    // 2. Prepare Fallback if AI fails or no messages
    if (!aiFeedback) {
      aiFeedback = {
        data: {
          feedback: {
            rating: { relevance: 0, technicalDepth: 0, clarity: 0, communicationQuality: 0 },
            summary: "The interview was completed, but automated analysis could not be generated due to insufficient conversation data or service interruption.",
            recommendation: "Maybe",
            recommendationMessage: "Further manual review required.",
            strengths: [],
            improvements: [],
            technicalAssessment: "Manual review pending.",
            communicationAssessment: "Manual review pending.",
            overallConfidence: 0
          }
        }
      };
    }

    setFeedback(aiFeedback);

    // 3. ALWAYS Save to Supabase
    try {
      // Nesting code data inside feedback since columns might not exist in target table
      const insertData = {
        userName: interviewInfo.userName,
        userEmail: interviewInfo.userEmail,
        interview_id: interviewInfo.interviewID,
        resumeURL: interviewInfo.resumeURL || null,
        feedback: {
          ...aiFeedback,
          metadata: {
            code_history: codeHistory,
            final_code: code
          }
        },
        recomended: aiFeedback?.data?.feedback?.recommendation || "Maybe",
      };

      const { error: insertError } = await supabase.from("interview-details").insert([insertData]);

      if (insertError) {
        console.error("Detailed Supabase Insert Error:", JSON.stringify(insertError, null, 2));
        throw new Error(insertError.message || "Database insert failed");
      }

      await generatePDFReport(aiFeedback, interviewInfo);
      toast.success("Interview report saved successfully!");
    } catch (err: any) {
      console.error("Supabase Save Failed:", err);
      toast.error("Failed to save report to dashboard: " + (err.message || "Unknown error"));
    } finally {
      setGenerateLoading(false);
    }
  };

  const downloadTranscription = () => {
    const transcript = messages.map((msg) => `${msg.type}: ${msg.content}`).join("\n\n");
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={showPreInterviewModal} onOpenChange={setShowPreInterviewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Instructions</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => { setHasAcknowledgedInstructions(true); setShowPreInterviewModal(false); }}>
              I Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="h-screen bg-slate-950 text-slate-50 overflow-hidden flex flex-col p-3">
        {/* Warning Banner */}
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-2 rounded-full shadow-2xl transition-all duration-300 ${showWarning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="font-bold">{warningMessage}</span>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-2 flex-1 w-full min-h-0">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shrink-0">
            <h1 className="text-xl font-bold font-sora tracking-tight">INTERVIEWX AI</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-bold"><Timer className="h-4 w-4" /> {formatTime(seconds)}</div>
              <Image src="/profile.png" alt="Profile" width={40} height={40} className="rounded-full border-2 border-white/20" />
            </div>
          </div>

          <div className={`grid ${isCodingMode ? 'grid-cols-[1.8fr_1fr]' : 'grid-cols-[1.4fr_0.8fr]'} gap-3 flex-1 min-h-0 overflow-hidden`}>
            {/* LEFT AREA: Video or Editor */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-3 flex flex-col min-h-0">
              {isCodingMode ? (
                <CodeEditor
                  code={code}
                  onChange={(val) => setCode(val || "")}
                  language={codeLanguage}
                  onLanguageChange={(lang) => setCodeLanguage(lang)}
                  onAskAI={askAIToDiscussCode}
                  onRun={runCode}
                  output={codeOutput}
                  problem={activeProblem}
                />
              ) : (
                <div className="relative flex-1 rounded-xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
                </div>
              )}

              <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                  onClick={handleStart}
                  disabled={hasAttempted || hasStarted}
                  className={hasStarted ? "bg-slate-800" : "bg-blue-600 hover:bg-blue-500"}
                >
                  {hasStarted ? "Interview in Progress" : "Start Interview"}
                </Button>

                <Button
                  onClick={toggleCamera}
                  variant="outline"
                  className={`gap-2 border-white/10 ${isCameraOn ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                >
                  {isCameraOn ? <LuVideo className="w-4 h-4" /> : <LuVideoOff className="w-4 h-4" />}
                  {isCameraOn ? "Camera: ON" : "Camera: OFF"}
                </Button>

                <Button
                  onClick={toggleMic}
                  variant="outline"
                  className={`gap-2 border-white/10 ${isMicOn ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                >
                  {isMicOn ? <LuMic className="w-4 h-4" /> : <LuMicOff className="w-4 h-4" />}
                  {isMicOn ? "Mic: ON" : "Mic: OFF"}
                </Button>

                <Button variant="destructive" onClick={stopCall} className="gap-2">
                  <LuX className="w-4 h-4" /> Finish
                </Button>

                <Separator orientation="vertical" className="h-6 bg-white/10 mx-2" />

                <Button
                  onClick={toggleCodingMode}
                  className={`gap-2 ${isCodingMode ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-800 hover:bg-slate-700"}`}
                >
                  {isCodingMode ? <LuVideo className="w-4 h-4" /> : <LuTerminal className="w-4 h-4" />}
                  {isCodingMode ? "Switch to Video View" : "Go to Coding View"}
                </Button>
              </div>
            </div>

            {/* RIGHT AREA: Transcription + PIP Video */}
            <div className="flex flex-col gap-3 min-h-0">
              {isCodingMode && (
                <div className="h-48 rounded-2xl border border-white/10 overflow-hidden relative bg-black shrink-0">
                  <video
                    ref={(el) => { if (el && stream) el.srcObject = stream; }}
                    autoPlay playsInline muted
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 scale-75 origin-bottom-right">
                    <AI_Voice />
                    <span className="text-[10px] uppercase">{activeUser ? "Speaking" : "AI"}</span>
                  </div>
                </div>
              )}
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-4"><LuMessagesSquare className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Transcription</span></div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                      <LuGhost className="w-8 h-8" />
                      <span className="text-xs">Waiting for conversation...</span>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <div key={i} className={`flex ${m.type === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.type === 'assistant' ? 'bg-white/10 text-slate-100' : 'bg-blue-600 text-white'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button onClick={downloadTranscription} className="mt-4 w-full text-xs font-bold gap-2"><LuDownload className="w-3.5 h-3.5" /> Download</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-xl font-bold font-sora">Interview Completed!</DialogTitle></DialogHeader>
          <div className="p-4 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                <SearchCheck className="w-10 h-10" />
              </div>
            </div>
            <p className="text-slate-400 text-sm">Thank you for participating. Your performance has been analyzed and your report is ready for download.</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-white/10 hover:bg-white/5"
              >
                Go Home
              </Button>
              <Button
                disabled={generateLoading}
                onClick={() => generatePDFReport(feedback, interviewInfo)}
                className="bg-blue-600 hover:bg-blue-500 font-bold"
              >
                {generateLoading ? "Generating..." : "Download Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StartInterview;
