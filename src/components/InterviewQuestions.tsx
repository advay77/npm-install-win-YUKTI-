/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { LuLoader, LuX } from "react-icons/lu";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "./ui/separator";
import { LuArrowRight, LuBrain } from "react-icons/lu";
import { supabase } from "@/services/supabaseClient";
import { useUserData } from "@/context/UserDetailContext";
import { useTheme } from "@/context/ThemeProvider";
import { v4 as uuidv4 } from "uuid";
import { LuDelete } from "react-icons/lu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LuListPlus } from "react-icons/lu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface InterviewFormData {
  jobTitle: string;
  jobDescription: string;
  interviewDuration: string;
  interviewType: string[];
  acceptResume: boolean;
}
type InterviewQuestion = {
  question: string;
  type:
  | "Technical"
  | "Behavioral"
  | "Problem Solving"
  | "Leadership"
  | "Experience";
};

type AIResponse = {
  interviewQuestions: InterviewQuestion[];
};

interface InterviewQuestionsProps {
  formData: InterviewFormData;
  onCreateLink: (id: string) => void;
}
const InterviewQuestions: React.FC<InterviewQuestionsProps> = ({
  formData,
  onCreateLink,
}) => {
  const { darkTheme } = useTheme();
  const { users, setRemainingCredits } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const interview_id = uuidv4();
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] =
    useState<InterviewQuestion["type"]>("Technical");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (formData) {
      GenerateAIQna();
    }
  }, [formData]);

  const GenerateAIQna = async () => {
    setLoading(true);
    setIsError(false);

    const startDelay = new Promise((res) => setTimeout(res, 2000));

    try {
      const request = axios.post("/api/ai-model", formData);
      const [result] = await Promise.all([request, startDelay]);
      // console.log("AI Response------------->", result.data);
      // console.log("setQuestions------------->", questions);
      if (result?.data?.isError) {
        console.error("❌ AI Error:", result.data.error);
        toast(result.data.error || "An error occurred during AI generation.");
        setIsError(true);
        return;
      }
      setQuestions(result.data.data.interviewQuestions);
    } catch (e: any) {
      // Improved error reporting for Axios and generic errors so browser
      // shows the server's JSON error body (if any) instead of a vague 500.
      console.error("❌ Request failed:", e);
      // Axios error shape: e.response?.data
      const serverData = e?.response?.data;
      if (serverData && (serverData.error || serverData.isError)) {
        const message = serverData.error || JSON.stringify(serverData);
        console.error("Server response:", serverData);
        toast(message);
      } else if (e?.message) {
        toast(e.message);
      } else {
        toast("A network/server error occurred. Please try again.");
      }
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async () => {
    setSaveLoading(true);

    const userEmail = users?.[0]?.email;
    if (!userEmail) {
      setSaveLoading(false);
      toast("User not loaded. Please re-authenticate.");
      return;
    }

    // Give unlimited credits for the owner account
    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "advayanand88@gmail.com";
    const isAdmin = userEmail === ADMIN_EMAIL;

    // insert interview
    const { data, error } = await supabase
      .from("interviews")
      .insert([
        {
          ...formData,
          questionList: questions,
          userEmail: users?.[0]?.email,
          created_by: users?.[0]?.id,
          organization: users?.[0]?.organization,
          interview_id: interview_id,
        },
      ])
      .select();

    if (error) {
      console.error("Interview insert error:", error);
      console.error("Interview insert error (stringified):", JSON.stringify(error, null, 2));
      setSaveLoading(false);

      // 404 means table doesn't exist or isn't accessible
      if (error.code === 'PGRST116' || error.message?.includes('404')) {
        toast("The interviews table is not set up. Please configure your Supabase database.");
      } else {
        toast("Error creating interview: " + (error.message || "Unknown error"));
      }
      return;
    }

    // decrement credits in DB AFTER successfully creating interview
    if (!isAdmin) {
      // Get current credits first
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("remainingcredits")
        .eq("email", userEmail)
        .single();

      if (userError) {
        console.error("Error fetching user credits:", userError);
        setSaveLoading(false);
        toast("Error fetching user credits");
        return;
      }

      const currentCredits = (userData as any)?.remainingcredits ?? 0;
      const newCredits = currentCredits - 1;

      // Update credits in DB
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          remainingcredits: newCredits,
        })
        .eq("email", userEmail)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating credits:", updateError);
        setSaveLoading(false);
        toast("Error updating credits");
        return;
      }

      if (updatedUser) {
        // Update context so sidebar reflects immediately
        const updatedRemaining = (updatedUser as any)?.remainingcredits ?? 0;
        setRemainingCredits(updatedRemaining);
      }
    } else {
      // For admin, ensure UI reflects "unlimited"
      setRemainingCredits(9999);
    }

    setSaveLoading(false);
    onCreateLink(interview_id);
    toast("Interview is Ready");
  };

  const handleDelete = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;

    setQuestions((prev) => [...prev, { question: newQuestion, type: newType }]);
    setNewQuestion("");
    setNewType("Technical");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {loading && (
        <div className={`mt-5 rounded-2xl border px-6 py-5 text-center shadow-sm ${darkTheme ? "border-blue-700 bg-blue-900/30" : "border-sky-200 bg-sky-50"}`}>
          <p className={`flex items-center justify-center gap-3 text-lg font-semibold ${darkTheme ? "text-blue-300" : "text-slate-800"}`}>
            <LuLoader className="h-5 w-5 animate-spin text-sky-600" />
            Generating AI Questions
          </p>
          <p className={`mt-2 text-sm ${darkTheme ? "text-blue-400" : "text-slate-600"}`}>
            We are crafting questions tailored to your role and interview type.
          </p>
        </div>
      )}

      {isError && (
        <div className={`mt-5 rounded-2xl border px-6 py-5 text-center shadow-sm ${darkTheme ? "border-red-700 bg-red-900/30" : "border-red-200 bg-red-50"}`}>
          <p className={`flex items-center justify-center gap-3 text-lg font-semibold ${darkTheme ? "text-red-300" : "text-red-700"}`}>
            <LuX className="h-5 w-5" /> Error while generating
          </p>
          <p className={`mt-2 text-sm ${darkTheme ? "text-red-300" : "text-red-600"}`}>
            It is on us. Please retry generating the questions.
          </p>
          <Button
            className={`mx-auto mt-4 text-white ${darkTheme ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"}`}
            onClick={() => router.push("/dashboard")}
          >
            Retry
          </Button>
        </div>
      )}

      {!loading && !isError && questions.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="flex flex-col gap-4"
        >
          <div className={`rounded-3xl border px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${darkTheme ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  Step 2 of 3
                </p>
                <h2 className={`text-2xl font-semibold ${darkTheme ? "text-white" : "text-slate-900"}`}>Generated Questions</h2>
                <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  Review, remove, or add questions before sharing the interview link.
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className={`gap-2 text-white ${darkTheme ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : "bg-sky-600 hover:bg-sky-500"}`}>
                    Add New Question
                    <LuListPlus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>

                <DialogContent className={`sm:max-w-md ${darkTheme ? "bg-slate-800 text-white" : ""}`}>
                  <DialogHeader>
                    <DialogTitle className={darkTheme ? "text-white" : ""}>Add Interview Question</DialogTitle>
                  </DialogHeader>

                  <Input
                    placeholder="Enter your question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className={`mt-2 ${darkTheme ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : ""}`}
                  />

                  {mounted && (
                    <Select
                      value={newType}
                      onValueChange={(value) =>
                        setNewType(value as InterviewQuestion["type"])
                      }
                    >
                      <SelectTrigger className={`mt-4 ${darkTheme ? "border-slate-600 bg-slate-700 text-white" : ""}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Behavioral">Behavioral</SelectItem>
                        <SelectItem value="Problem Solving">Problem Solving</SelectItem>
                        <SelectItem value="Leadership">Leadership</SelectItem>
                        <SelectItem value="Experience">Experience</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  <DialogFooter className="mt-4">
                    <Button className={`text-white ${darkTheme ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : "bg-sky-600 hover:bg-sky-500"}`} onClick={handleAddQuestion}>
                      Add Question
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 space-y-3">
              {questions.map((q, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`rounded-2xl border px-4 py-3 shadow-sm ${darkTheme ? "border-slate-700 bg-slate-700" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border ${darkTheme ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-sky-50 text-sky-700 border-sky-100"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={`text-base font-semibold ${darkTheme ? "text-white" : "text-slate-900"}`}>
                        {q.question}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkTheme ? "bg-blue-900/40 text-blue-300" : "bg-sky-100 text-sky-700"}`}>
                          {q.type}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-9 w-9 ${darkTheme ? "border-red-700/50 text-red-400 hover:border-red-600 hover:text-red-300 hover:bg-red-900/20" : "border-red-300 text-red-600 hover:border-red-400 hover:text-red-700 hover:bg-red-50"}`}
                          onClick={() => handleDelete(i)}
                          aria-label="Remove question"
                        >
                          <LuDelete className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button className={`${darkTheme ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}>
                Cancel <LuX className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={onFinish}
                disabled={saveLoading}
                className={`text-white ${darkTheme ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : "bg-sky-600 hover:bg-sky-500"}`}
              >
                {saveLoading && (
                  <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                )}
                {saveLoading ? "Saving..." : "Finish"}
                <LuArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InterviewQuestions;
