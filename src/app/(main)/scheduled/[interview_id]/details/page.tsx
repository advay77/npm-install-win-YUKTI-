/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { useUserData } from "@/context/UserDetailContext";
import { useTheme } from "@/context/ThemeProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Ghost, LucideLoader, LucideLoader2, AlertTriangle, CheckCircle2, UserCircle2 } from "lucide-react";
import {
  LuActivity,
  LuDatabase,
  LuDock,
  LuSend,
  LuSquareSquare,
  LuWorkflow,
} from "react-icons/lu";
import Image from "next/image";
import axios from "axios";
import AILoadingState from "@/components/kokonutui/ai-loading";
import SendMailForm from "@/components/SendMailForm";

// ---------- Interfaces ----------
interface Question {
  question?: string;
  type?: string;
}

interface FeedbackRatings {
  technicalSkills?: number;
  communication?: number;
  problemSolving?: number;
  experience?: number;
}

interface FeedbackData {
  feedback: {
    rating: FeedbackRatings;
    summary: string;
    recommendation?: string;
    recommendationMessage: string;
  };
}

interface Feedback {
  data: FeedbackData;
}

interface InterviewDetails {
  userEmail?: string;
  userName?: string;
  feedback?: Feedback | null;
  resumeURL?: string | null;
  created_at?: string;
}

interface Interview {
  jobTitle?: string;
  jobDescription?: string;
  interview_id?: string;
  created_at?: string;
  interviewDuration?: number;
  interviewType?: string;
  acceptResume?: boolean;
  questionList?: Question[] | null;
  "interview-details"?: InterviewDetails[];
}

// ---------- Page ----------
export default function InterviewDetailsPage() {
  const { interview_id } = useParams();
  const { users } = useUserData();
  const { darkTheme } = useTheme();

  const [resumeCandidate, setResumeCandidate] = useState<any | null>(null);
  // const [atsReport, setAtsReport] = useState<any>(null);
  const [atsReports, setAtsReports] = useState<Record<string, any>>({});
  const [loadingReport, setLoadingReport] = useState(false);

  const [loading, setLoading] = useState(false);
  const [interviewList, setInterviewList] = useState<Interview[] | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<InterviewDetails | null>(null);
  const [mailCandidate, setMailCandidate] =
    useState<InterviewDetails | null>(null);

  useEffect(() => {
    users && GetInterviewList();
  }, [users]);

  // const GetInterviewList = async () => {
  //   setLoading(true);
  //   try {
  //     const result = await supabase
  //       .from("interviews")
  //       .select(
  //         "jobTitle, jobDescription, interview_id,created_at,interviewDuration,interviewType,acceptResume,questionList, interview-details(userEmail,userName,feedback,resumeURL,created_at)"
  //       )
  //       .eq("userEmail", users?.[0].email)
  //       .eq("interview_id", interview_id);

  //     console.log("detailed candidate and interview data", result.data);

  //     setInterviewList(result.data as Interview[]);
  //   } catch (err) {
  //     console.log(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // subscribe to realtime for interview-details
  useEffect(() => {
    if (!interview_id) return;

    const channel = supabase
      .channel("interview-details-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interview-details",
          filter: `interview_id=eq.${interview_id}`,
        },
        (payload) => {
          console.log("New row in interview-details:", payload.new);
          GetInterviewList(); // just refetch full list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interview_id, users]);

  const GetInterviewList = async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("interviews")
        .select(
          "jobTitle, jobDescription, interview_id, created_at, interviewDuration, interviewType, acceptResume, questionList, interview-details(userEmail,userName,feedback,resumeURL,created_at)"
        )
        .eq("userEmail", users?.[0].email)
        .eq("interview_id", interview_id);

      console.log("detailed candidate and interview data", result.data);
      setInterviewList(result.data as Interview[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Resume link sending and scores getting
  const handleGenerate = async () => {
    if (!resumeCandidate) return;
    setLoadingReport(true);
    try {
      const { data } = await axios.post("/api/resume-score", {
        resumeURL: resumeCandidate?.resumeURL,
      });
      setAtsReports((prev) => ({
        ...prev,
        [resumeCandidate.userEmail]: data,
      }));
    } catch (err) {
      console.error("Error generating ATS report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const buildMailBody = () => {
    if (!selectedCandidate || !interview) return "";
    const recommendation = selectedCandidate.feedback?.data?.feedback?.recommendation || "Pending";
    return `Dear ${selectedCandidate.userName},\n\nThank you for participating in the interview for the ${interview.jobTitle} position.\n\nInterview Status: ${recommendation}\n\nBest regards,\nHiring Team`;
  };

  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${darkTheme
        ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
        : "bg-gradient-to-br from-blue-50 via-slate-50 to-white"
        }`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkTheme ? "bg-slate-800/80 border border-slate-700" : "bg-white/80 border border-slate-200 shadow-md"}`}>
          <LucideLoader className={`animate-spin ${darkTheme ? "text-blue-300" : "text-blue-600"}`} size={28} />
          <h2 className={`text-lg font-inter font-semibold ${darkTheme ? "text-slate-200" : "text-slate-800"}`}>
            Loading interview details…
          </h2>
        </div>
      </div>
    );
  }

  const interview = interviewList?.[0];
  const mailSubject = interview?.jobTitle
    ? `🎯 Your ${interview.jobTitle} Interview Results & Next Steps`
    : "🎯 Your Interview Results & Next Steps";

  return (
    <div
      className={`min-h-screen w-full pb-14 ${darkTheme
        ? "bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100"
        : "bg-gradient-to-b from-blue-50 via-slate-50 to-white text-slate-900"
        }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* INTERVIEW DETAILS */}
        {interview && (
          <Card className={`${darkTheme ? "bg-slate-900/70 border-slate-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl"} mb-10 overflow-hidden`}>
            <CardHeader className="space-y-2">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkTheme ? "bg-blue-500/20 text-blue-200" : "bg-blue-100 text-blue-700"}`}>
                  <LuWorkflow className="text-xl" />
                </div>
                <div className="space-y-1">
                  <CardTitle className={`text-2xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
                    {interview.jobTitle}
                  </CardTitle>
                  <p className={`text-sm leading-relaxed ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    {interview.jobDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${darkTheme ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                  Duration: {interview.interviewDuration} mins
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${interview.acceptResume
                  ? darkTheme
                    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-700/60"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : darkTheme
                    ? "bg-amber-500/15 text-amber-200 border border-amber-700/60"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                  Accept Resume: {interview.acceptResume ? "Yes" : "No"}
                </span>
                {interview.created_at && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${darkTheme ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                    Created: {new Date(interview.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${darkTheme ? "bg-slate-800 text-slate-200 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                  Candidates: {interview["interview-details"]?.length || 0}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkTheme ? "text-slate-100" : "text-slate-900"}`}>
                  Questions
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {interview.questionList?.map((q, i) => (
                    <div
                      key={i}
                      className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} border rounded-xl px-3 py-2 flex gap-3 items-start shadow-sm`}
                    >
                      <span className={`${darkTheme ? "bg-blue-500/20 text-blue-100" : "bg-blue-100 text-blue-700"} rounded-md px-2 py-1 text-xs font-semibold mt-0.5`}>{i + 1}</span>
                      <p className={`text-sm leading-relaxed ${darkTheme ? "text-slate-200" : "text-slate-800"}`}>
                        {q.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CANDIDATES */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
              Candidates
            </h2>
          </div>

          {!loading && (
            <>
              {interview?.["interview-details"] &&
                interview["interview-details"].length > 0 ? (
                <div className="grid gap-4">
                  {interview?.["interview-details"]?.map((cand, idx) => {
                    const ratings = cand.feedback?.data?.feedback?.rating;
                    let avgScore: number | null = null;

                    if (ratings) {
                      const values = Object.values(ratings);
                      const sum = values.reduce((acc, v) => acc + (v ?? 0), 0);
                      avgScore = values.length > 0 ? sum / values.length : null;
                    }

                    return (
                      <Card
                        key={idx}
                        className={`${darkTheme ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} p-4 shadow-sm`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <Image
                              src="/profile.png"
                              alt="profile"
                              width={50}
                              height={50}
                              className="rounded-full"
                              priority
                            />
                            <div>
                              <p className={`font-semibold capitalize font-inter ${darkTheme ? "text-white" : "text-slate-900"}`}>
                                {cand.userName}
                              </p>
                              <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                                {cand.userEmail}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 sm:justify-end items-center">
                            {avgScore !== null && (
                              <span className={`px-3 py-1 rounded-full text-xs justify-center font-semibold ${avgScore < 5
                                ? darkTheme ? "bg-red-500/20 text-red-200" : "bg-red-50 text-red-600"
                                : avgScore < 7
                                  ? darkTheme ? "bg-amber-500/20 text-amber-200" : "bg-amber-50 text-amber-700"
                                  : darkTheme ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>
                                {avgScore.toFixed(1)}/10
                              </span>
                            )}

                            <Button
                              variant="outline"
                              onClick={() => setSelectedCandidate(cand)}
                            >
                              View Report <LuWorkflow />
                            </Button>
                            {cand.resumeURL && (
                              <Button
                                variant="outline"
                                onClick={() => setResumeCandidate(cand)}
                              >
                                View Resume <LuDock />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => setMailCandidate(cand)}
                            >
                              Send Mail <LuSend />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className={`${darkTheme ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-blue-50 border-blue-100 text-slate-600"} border rounded-2xl px-6 py-10 text-center flex flex-col items-center gap-3`}>
                  <Ghost className={`${darkTheme ? "text-slate-500" : "text-blue-400"}`} size={32} />
                  <p className="text-sm font-medium">No candidates have completed this interview yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Dialog
        open={!!selectedCandidate}
        onOpenChange={() => setSelectedCandidate(null)}
      >
        <DialogContent
          className={`sm:max-w-[760px] ${darkTheme
            ? "bg-slate-900/95 border border-slate-800 shadow-2xl"
            : "bg-white border border-slate-200 shadow-xl"}`}
        >
          <DialogHeader>
            <DialogTitle className={`text-2xl font-sora tracking-tight flex items-center justify-between px-4 sm:px-6 ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <div className="flex items-center gap-2">
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkTheme ? "bg-blue-500/15 text-blue-200" : "bg-blue-50 text-blue-600"}`}>
                  <UserCircle2 className="h-6 w-6" />
                </span>
                <span>Candidate Details</span>
              </div>

              <div
                className={`text-sm font-semibold px-3 py-1 rounded-full border ${selectedCandidate?.feedback?.data?.feedback?.recommendation === "No"
                  ? darkTheme
                    ? "bg-red-500/15 border-red-700 text-red-100"
                    : "bg-red-50 border-red-200 text-red-700"
                  : darkTheme
                    ? "bg-emerald-500/15 border-emerald-700 text-emerald-100"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
              >
                Recommended: {selectedCandidate?.feedback?.data?.feedback?.recommendation || "-"}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="mt-4 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className={`font-semibold capitalize text-lg font-inter ${darkTheme ? "text-white" : "text-slate-900"}`}>
                    {selectedCandidate.userName}
                  </p>
                  <p className={`text-sm font-inter ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    Email: {selectedCandidate.userEmail}
                  </p>
                </div>
              </div>

              {/* Feedback Ratings with Progress */}
              {selectedCandidate.feedback?.data?.feedback?.rating && (
                <div className="space-y-3">
                  {Object.entries(
                    selectedCandidate.feedback.data.feedback.rating
                  ).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm font-medium font-inter">
                        <span className={`capitalize ${darkTheme ? "text-slate-100" : "text-slate-900"}`}>{key}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${darkTheme ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-700"}`}>
                          {(val ?? 0)}/10
                        </span>
                      </div>
                      <Progress value={(val ?? 0) * 10} className={darkTheme ? "bg-slate-800" : ""} />
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {selectedCandidate.feedback?.data?.feedback?.summary && (
                <div className={`p-4 rounded-xl border ${darkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className={`font-semibold font-inter text-base mb-2 ${darkTheme ? "text-slate-100" : "text-slate-900"}`}>Summary</h3>
                  <p className={`text-sm leading-relaxed font-inter ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    {selectedCandidate.feedback.data.feedback.summary}
                  </p>
                </div>
              )}

              {/* Recommendation */}
              {selectedCandidate.feedback?.data?.feedback?.recommendation && (
                <div className={`p-4 rounded-xl border ${darkTheme ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                  <h3 className={`font-semibold font-inter text-base mb-2 ${darkTheme ? "text-slate-100" : "text-slate-900"}`}>Recommendation</h3>
                  <p className={`text-sm leading-relaxed font-inter ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    {selectedCandidate.feedback.data.feedback.recommendationMessage}
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedCandidate?.feedback?.data?.feedback?.recommendation === "No" ? (
            <div className={`mt-6 rounded-xl overflow-hidden ${darkTheme
              ? "bg-gradient-to-r from-red-950/40 to-red-900/20 border border-red-800/40"
              : "bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200"}`}>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 flex-1">
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${darkTheme ? "text-red-300" : "text-red-600"}`} />
                  <p className={`text-sm font-medium font-inter leading-relaxed ${darkTheme ? "text-red-100" : "text-red-900"}`}>
                    Candidate was rejected by AI interviewer, but you can revisit and follow up.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={darkTheme
                    ? "bg-red-600 text-white border-red-600 hover:bg-red-500 hover:border-red-500 font-semibold whitespace-nowrap shadow-md"
                    : "bg-red-600 text-white border-red-600 hover:bg-red-500 hover:border-red-500 font-semibold whitespace-nowrap shadow-md"}
                  onClick={() => {
                    setSelectedCandidate(null);
                    setMailCandidate(selectedCandidate);
                  }}
                >
                  <LuSend className="mr-1.5 h-4 w-4" />
                  Send Mail
                </Button>
              </div>
            </div>
          ) : (
            <div className={`mt-6 rounded-xl overflow-hidden ${darkTheme
              ? "bg-gradient-to-r from-emerald-950/40 to-emerald-900/20 border border-emerald-800/40"
              : "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200"}`}>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${darkTheme ? "text-emerald-300" : "text-emerald-600"}`} />
                  <p className={`text-sm font-medium font-inter leading-relaxed ${darkTheme ? "text-emerald-100" : "text-emerald-900"}`}>
                    Candidate approved by AI interviewer. You may proceed or send next steps.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={darkTheme
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 font-semibold whitespace-nowrap shadow-md"
                    : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500 hover:border-emerald-500 font-semibold whitespace-nowrap shadow-md"}
                  onClick={() => {
                    setSelectedCandidate(null);
                    setMailCandidate(selectedCandidate);
                  }}
                >
                  <LuSend className="mr-1.5 h-4 w-4" />
                  Send Mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RESUME DIALOG */}
      <Dialog
        open={!!resumeCandidate}
        onOpenChange={() => setResumeCandidate(null)}
      >
        <DialogContent className="min-w-3xl max-w-5xl w-full p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-xl font-inter tracking-tight">
              Resume & ATS Report <LuActivity className="inline ml-2" />
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 h-[55vh] justify-items-center">
            {/* Left: Resume Viewer */}
            <div className="h-full border-r w-full">
              {resumeCandidate?.resumeURL ? (
                <iframe
                  src={resumeCandidate.resumeURL}
                  className="w-full h-full"
                />
              ) : (
                <p className="p-4 text-gray-500 italic">No resume uploaded.</p>
              )}
            </div>

            {/* Right: ATS Report */}
            <div className="bg-gray-100 w-full h-full p-4 overflow-y-auto">
              {!atsReports?.[resumeCandidate?.userEmail] ? (
                <div className="flex flex-col gap-10 items-center justify-center h-full">
                  <Button
                    onClick={handleGenerate}
                    disabled={loadingReport}
                    className="cursor-pointer"
                  >
                    {loadingReport ? "Analyzing..." : "Generate Scores"}{" "}
                    <LuActivity className="ml-2" />
                  </Button>

                  {loadingReport && <AILoadingState />}
                </div>
              ) : (
                <div>
                  <h2 className="text-center font-sora text-lg font-medium">
                    Resume Analysis Report
                  </h2>
                  <h3 className="text-base text-center font-semibold mt-3 font-inter">
                    ATS Score: {atsReports[resumeCandidate.userEmail].atsScore}
                    /100
                  </h3>
                  <div className="mt-3 bg-green-200/30 border border-green-500 p-3 rounded">
                    <h4 className="font-medium mb-2 font-sora text-center">
                      Strong Points
                    </h4>
                    <ul className="list-disc pl-5 text-green-600 font-inter tracking-tight">
                      {atsReports[resumeCandidate.userEmail].strongPoints.map(
                        (p: string, i: number) => (
                          <li key={i}>{p}</li>
                        )
                      )}
                    </ul>
                  </div>
                  <div className="mt-5 bg-red-200/30 border border-red-500 p-3 rounded">
                    <h4 className="font-medium mb-2 font-sora text-center">
                      Weak Points
                    </h4>
                    <ul className="list-disc pl-5 text-red-600 font-inter tracking-tight">
                      {atsReports[resumeCandidate.userEmail].weakPoints.map(
                        (p: string, i: number) => (
                          <li key={i}>{p}</li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MAIL DIALOG */}
      <Dialog open={!!mailCandidate} onOpenChange={() => setMailCandidate(null)}>
        <DialogContent className={`sm:max-w-[600px] ${darkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <DialogHeader>
            <DialogTitle className={`text-xl font-sora tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>
              Send email to {mailCandidate?.userName}
            </DialogTitle>
          </DialogHeader>
          <SendMailForm
            defaultEmail={mailCandidate?.userEmail || ""}
            defaultSubject={mailSubject}
            defaultBody={buildMailBody()}
            onSuccess={() => setMailCandidate(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
