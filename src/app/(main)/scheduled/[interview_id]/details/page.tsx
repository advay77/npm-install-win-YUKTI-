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
import { Ghost, LucideLoader, LucideLoader2 } from "lucide-react";
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

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="flex items-center gap-2">
          <LucideLoader className="animate-spin" size={32} />
          <h2 className="text-2xl font-inter">Loading Contents...</h2>
        </div>
      </div>
    );
  }

  const interview = interviewList?.[0];

  return (
    <div
      className={`${darkTheme ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
        } h-full p-4`}
    >
      {/* INTERVIEW DETAILS */}
      {interview && (
        <Card className="max-w-5xl mx-auto mb-8 shadow border-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold font-inter flex items-center gap-4">
              <p className="w-8 h-8 rounded-md bg-blue-200 flex items-center justify-center">
                <LuWorkflow />
              </p>
              Job Title: {interview.jobTitle}
            </CardTitle>
            <p className="text-base mt-3 text-muted-foreground">
              <span className="text-lg font-medium text-gray-800 font-inter">
                {" "}
                Description:{" "}
              </span>{" "}
              {interview.jobDescription}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 font-sora text-sm">
              <p>
                <span className="font-semibold">Duration:</span>{" "}
                {interview.interviewDuration} mins
              </p>
              <p>
                <span className="font-semibold">Accept Resume:</span>{" "}
                {interview.acceptResume ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Created At:</span>{" "}
                {interview.created_at
                  ? new Date(interview.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  : ""}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Questions:</h3>
              <div className="grid grid-cols-2 gap-3">
                {interview.questionList?.map((q, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-md border text-sm bg-white/50 dark:bg-gray-800"
                  >
                    <span className="font-semibold mr-2">{i + 1}.</span>
                    {q.question}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CANDIDATES */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-medium font-sora mb-4">
          {!loading && users && "Candidates"}
        </h2>

        {!loading && (
          <>
            {interview?.["interview-details"] &&
              interview["interview-details"].length > 0 ? (
              <div className="grid gap-4">
                {interview?.["interview-details"]?.map((cand, idx) => {
                  // ⬇ put rating calculation INSIDE map()
                  const ratings = cand.feedback?.data?.feedback?.rating;
                  let avgScore: number | null = null;

                  if (ratings) {
                    const values = Object.values(ratings);
                    const sum = values.reduce((acc, v) => acc + (v ?? 0), 0);
                    avgScore = values.length > 0 ? sum / values.length : null;
                  }

                  const getColor = (score: number) => {
                    if (score < 5) return "text-red-500";
                    if (score < 7) return "text-orange-500";
                    return "text-green-500";
                  };

                  return (
                    <Card
                      key={idx}
                      className="p-3 border-none shadow"
                    // onClick={() => setSelectedCandidate(cand)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <Image
                            src="/profile.png"
                            alt="profile"
                            width={50}
                            height={50}
                            className="rounded-full"
                            priority
                          />
                          <div>
                            <p className="font-semibold capitalize font-inter">
                              {cand.userName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cand.userEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* ⭐ Show average rating */}
                          {avgScore !== null && (
                            <p
                              className={`font-semibold font-inter ${getColor(
                                avgScore
                              )}`}
                            >
                              {avgScore.toFixed(1)}/10
                            </p>
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
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-lg font-sora text-center mt-14 text-gray-500 italic flex items-center justify-center gap-5">
                No one has applied for this interview yet.{" "}
                <Ghost className="ml-2" />
              </p>
            )}
          </>
        )}
      </div>

      {/* CANDIDATE DIALOG */}
      <Dialog
        open={!!selectedCandidate}
        onOpenChange={() => setSelectedCandidate(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-sora tracking-tight flex items-center justify-between px-8">
              <div>
                Candidate Details <LuDatabase className="inline-flex ml-3" />
              </div>

              <div
                className={`${selectedCandidate?.feedback?.data?.feedback
                    ?.recommendation === "No"
                    ? "bg-red-500/30"
                    : "bg-green-500/30"
                  } w-fit p-2 rounded-md`}
              >
                <p className="text-base font-inter font-medium text-black">
                  Recomended:{" "}
                  {selectedCandidate?.feedback?.data?.feedback?.recommendation}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold capitalize text-lg font-inter">
                  Name: {selectedCandidate.userName}
                </p>
                <p className="text-base font-inter text-muted-foreground max-w-[220px] truncate">
                  Email: {selectedCandidate.userEmail}
                </p>
                {/* {selectedCandidate.resumeURL && (
                  <a
                    href={selectedCandidate.resumeURL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline"
                  >
                    View Resume
                  </a>
                )} */}
              </div>

              {/* Feedback Ratings with Progress */}
              {selectedCandidate.feedback?.data?.feedback?.rating && (
                <div className="space-y-3 mt-5">
                  {Object.entries(
                    selectedCandidate.feedback.data.feedback.rating
                  ).map(([key, val]) => (
                    <div key={key}>
                      <p className="capitalize text-base font-inter font-medium mb-1">
                        {key}
                      </p>
                      <Progress value={(val ?? 0) * 10} />
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {selectedCandidate.feedback?.data?.feedback?.summary && (
                <div className="mt-5">
                  <h3 className="font-semibold font-inter text-base ">
                    Summary
                  </h3>
                  <p className="text-sm tracking-tight font-inter">
                    {selectedCandidate.feedback.data.feedback.summary}
                  </p>
                </div>
              )}

              {/* Recommendation */}
              {selectedCandidate.feedback?.data?.feedback?.recommendation && (
                <div className="mt-5">
                  <h3 className="font-semibold font-inter text-base ">
                    Recommendation
                  </h3>
                  <p className="text-sm tracking-tight font-inter">
                    {/* {selectedCandidate.feedback.data.feedback.recommendation} –{" "} */}
                    {
                      selectedCandidate.feedback.data.feedback
                        .recommendationMessage
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedCandidate?.feedback?.data?.feedback?.recommendation ===
            "No" ? (
            <div className="mt-5 bg-red-500/30 border border-red-600 rounded-md p-3">
              <div className="flex items-center justify-between">
                <p className="tracking-tight text-sm font-inter">
                  Candidate is been rejected by AI interviewer, But you can
                  still Revisit this candidate
                </p>

                <Button variant="outline">
                  Send Mail <LuSend />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 bg-green-500/30 border border-green-600 rounded-md p-3">
              <div className="flex items-center justify-between">
                <p className="tracking-tight text-sm font-inter">
                  Candidate has been approved by AI interviewer, And Recomended
                  for this Job
                </p>

                <Button variant="outline">
                  Send Mail <LuSend />
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
    </div>
  );
}
