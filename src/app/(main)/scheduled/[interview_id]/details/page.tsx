/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase, getSignedResumeUrl } from "@/services/supabaseClient";
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
import { Ghost, LucideLoader, LucideLoader2, AlertTriangle, CheckCircle2, UserCircle2, Download } from "lucide-react";
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
  const [signedResumeUrl, setSignedResumeUrl] = useState<string | null>(null);
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

  // Generate signed URL when resume candidate changes
  useEffect(() => {
    if (resumeCandidate?.resumeURL) {
      getSignedResumeUrl(resumeCandidate.resumeURL).then(setSignedResumeUrl);
    } else {
      setSignedResumeUrl(null);
    }
  }, [resumeCandidate]);

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
      // Prefer already-fetched signed URL; otherwise, request a fresh one
      const resumeUrl = signedResumeUrl
        ? signedResumeUrl
        : resumeCandidate.resumeURL
          ? await getSignedResumeUrl(resumeCandidate.resumeURL)
          : null;

      if (!resumeUrl) {
        throw new Error("Resume URL is not available");
      }

      const { data } = await axios.post("/api/resume-score", {
        resumeURL: resumeUrl,
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
          className={`!w-[85vw] !h-[95vh] !max-w-none !max-h-none overflow-auto p-0 ${darkTheme
            ? "bg-slate-900/95 border border-slate-800 shadow-2xl"
            : "bg-white border border-slate-200 shadow-xl"}`}
        >
          <DialogHeader className="px-6 py-4 border-b border-transparent">
            <DialogTitle className={`text-2xl font-sora tracking-tight flex items-center justify-between pr-10 ${darkTheme ? "text-white" : "text-slate-900"}`}>
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
            <div className="px-6 pb-6 pt-2 space-y-6">
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
        <DialogContent className={`!w-[85vw] !h-[85vh] !max-w-none !max-h-none p-0 ${darkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <DialogHeader className={`p-4 border-b ${darkTheme ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
            <DialogTitle className={`text-xl font-inter tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>
              Resume & ATS Report <LuActivity className="inline ml-2" />
            </DialogTitle>
          </DialogHeader>
          <div className={`grid grid-cols-2 h-[calc(85vh-80px)] overflow-hidden ${darkTheme ? "bg-slate-800/30" : "bg-slate-50"}`}>
            {/* Left: Resume Viewer */}
            <div className={`h-full border-r w-full flex flex-col items-center justify-center p-4 overflow-hidden ${darkTheme ? "border-slate-700 bg-slate-800/20" : "border-slate-200 bg-slate-50"}`}>
              {resumeCandidate?.resumeURL && signedResumeUrl ? (
                <div className="w-full h-full flex flex-col gap-3">
                  <div className="w-full flex-1 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <object
                      data={signedResumeUrl}
                      type="application/pdf"
                      className="w-full h-full"
                    />
                    <div className="flex flex-col items-center gap-4 justify-center h-full hidden">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${darkTheme ? "bg-blue-500/20 text-blue-300" : "bg-blue-50 text-blue-600"}`}>
                        <LuDock className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold mb-2 ${darkTheme ? "text-slate-100" : "text-slate-900"}`}>PDF Preview Not Available</p>
                        <p className={`text-xs ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>Click buttons below to view or download</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a
                      href={signedResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${darkTheme ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md" : "bg-blue-600 hover:bg-blue-500 text-white shadow-md"}`}
                    >
                      <LuDock className="w-4 h-4" />
                      Open in New Tab
                    </a>
                    <a
                      href={signedResumeUrl}
                      download
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border ${darkTheme ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100" : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : resumeCandidate?.resumeURL ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <LucideLoader className="animate-spin w-8 h-8" />
                  <p className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>Loading resume...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${darkTheme ? "bg-slate-700 text-slate-500" : "bg-slate-100 text-slate-400"}`}>
                    <LuDock className="w-8 h-8" />
                  </div>
                  <p className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>No resume uploaded.</p>
                </div>
              )}
            </div>

            {/* Right: ATS Report */}
            <div className={`w-full h-full p-8 overflow-y-auto flex flex-col ${darkTheme ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900" : "bg-gradient-to-br from-slate-50 via-white to-blue-50"}`}>
              {!atsReports?.[resumeCandidate?.userEmail] ? (
                <div className="flex flex-col gap-6 items-center justify-center h-full py-12">
                  {/* Header Text */}
                  <div className="text-center space-y-2 mb-4">
                    <h3 className={`text-2xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
                      Resume Analysis
                    </h3>
                    <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      Generate ATS score and detailed feedback
                    </p>
                  </div>

                  {/* Button with Glow Effect */}
                  <Button
                    onClick={handleGenerate}
                    disabled={loadingReport}
                    className={`relative w-full max-w-sm cursor-pointer font-semibold py-6 text-base group transition-all duration-300 transform hover:scale-105 ${darkTheme
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50"
                      : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-400/40"
                      }`}
                  >
                    <span className="flex items-center justify-center gap-2 w-full">
                      {loadingReport ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Analyzing Resume...</span>
                        </>
                      ) : (
                        <>
                          <LuActivity className="w-5 h-5" />
                          <span>Generate ATS Score</span>
                        </>
                      )}
                    </span>
                    {!loadingReport && (
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 group-hover:bg-white transition-all duration-300" />
                    )}
                  </Button>

                  {/* Loading State */}
                  {loadingReport && (
                    <div className="w-full mt-8">
                      <AILoadingState />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5 flex-1">
                  {/* Header */}
                  <div className="text-center space-y-2 mb-6">
                    <h2 className={`text-2xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
                      Resume Analysis Report
                    </h2>
                    <div className={`h-1 w-16 mx-auto rounded-full ${darkTheme ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-blue-600 to-blue-500"}`} />
                  </div>

                  {/* ATS Score Card - Large and Professional */}
                  <div className={`relative p-6 rounded-2xl border-2 ${darkTheme
                    ? "border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-cyan-900/20 shadow-lg shadow-blue-500/20"
                    : "border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-400/20"
                    }`}>
                    <div className="text-center space-y-3">
                      <p className={`text-sm font-semibold uppercase tracking-wider ${darkTheme ? "text-blue-300" : "text-blue-700"}`}>
                        Overall ATS Score
                      </p>
                      <div className={`text-5xl font-bold font-sora ${atsReports[resumeCandidate.userEmail].atsScore >= 80
                        ? darkTheme ? "text-emerald-400" : "text-emerald-600"
                        : atsReports[resumeCandidate.userEmail].atsScore >= 60
                          ? darkTheme ? "text-yellow-400" : "text-yellow-600"
                          : darkTheme ? "text-orange-400" : "text-orange-600"
                        }`}>
                        {atsReports[resumeCandidate.userEmail].atsScore}
                        <span className="text-2xl ml-1">/100</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${darkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${atsReports[resumeCandidate.userEmail].atsScore >= 80
                            ? "bg-gradient-to-r from-emerald-500 to-green-500"
                            : atsReports[resumeCandidate.userEmail].atsScore >= 60
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                              : "bg-gradient-to-r from-orange-500 to-red-500"
                            }`}
                          style={{ width: `${atsReports[resumeCandidate.userEmail].atsScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Strengths Card */}
                  <div className={`p-5 rounded-2xl border-2 backdrop-blur-sm ${darkTheme
                    ? "border-emerald-500/30 bg-gradient-to-br from-emerald-900/25 to-green-900/15 shadow-lg shadow-emerald-500/15"
                    : "border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-400/15"
                    }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${darkTheme ? "bg-emerald-500/20" : "bg-emerald-200/50"}`}>
                        <svg className={`w-5 h-5 ${darkTheme ? "text-emerald-400" : "text-emerald-600"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className={`font-bold text-lg ${darkTheme ? "text-emerald-300" : "text-emerald-700"}`}>
                        Strengths
                      </h4>
                    </div>
                    <ul className={`space-y-2.5 font-inter text-sm ${darkTheme ? "text-emerald-100/90" : "text-emerald-900"}`}>
                      {atsReports[resumeCandidate.userEmail].strongPoints.map(
                        (p: string, i: number) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${darkTheme ? "bg-emerald-500/30 text-emerald-300" : "bg-emerald-300/50 text-emerald-700"}`}>
                              ✓
                            </span>
                            <span>{p}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses Card */}
                  <div className={`p-5 rounded-2xl border-2 backdrop-blur-sm ${darkTheme
                    ? "border-orange-500/30 bg-gradient-to-br from-orange-900/25 to-red-900/15 shadow-lg shadow-orange-500/15"
                    : "border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg shadow-orange-400/15"
                    }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${darkTheme ? "bg-orange-500/20" : "bg-orange-200/50"}`}>
                        <svg className={`w-5 h-5 ${darkTheme ? "text-orange-400" : "text-orange-600"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className={`font-bold text-lg ${darkTheme ? "text-orange-300" : "text-orange-700"}`}>
                        Areas for Improvement
                      </h4>
                    </div>
                    <ul className={`space-y-2.5 font-inter text-sm ${darkTheme ? "text-orange-100/90" : "text-orange-900"}`}>
                      {atsReports[resumeCandidate.userEmail].weakPoints.map(
                        (p: string, i: number) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${darkTheme ? "bg-orange-500/30 text-orange-300" : "bg-orange-300/50 text-orange-700"}`}>
                              !
                            </span>
                            <span>{p}</span>
                          </li>
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
