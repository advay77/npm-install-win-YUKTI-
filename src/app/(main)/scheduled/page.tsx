/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useUserData } from "@/context/UserDetailContext";
import { supabase } from "@/services/supabaseClient";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/context/ThemeProvider";
import { Copy, LucideLoader, LucideLoader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Briefcase,
  Clock,
  FileText,
  UserCheck,
  Calendar,
  Send,
  Grid2X2,
  List,
  Filter,
} from "lucide-react";
import { LuActivity, LuLoader, LuVideo, LuDock } from "react-icons/lu";
import Image from "next/image";
import Link from "next/link";

const icons = [Briefcase, Clock, FileText, UserCheck, Calendar];

const ScheduledInterview = () => {
  const { users } = useUserData();
  const { darkTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [interviewList, setInterviewList] = useState<any>([]);
  const [view, setView] = useState("grid");
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    users && GetInterviewList();
  }, [users]);

  // Subscribe to real-time updates for interview-details
  useEffect(() => {
    if (!users?.[0]?.email) return;

    const channel = supabase
      .channel("interview-details-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interview-details",
        },
        () => {
          console.log("New interview detail detected, refreshing list...");
          GetInterviewList();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [users?.[0]?.email]);

  // we we have connect 2 tables interviews , interview-details using FK;
  const GetInterviewList = async () => {
    setLoading(true);
    try {
      // Primary: attempt FK-based nested select
      const result = await supabase
        .from("interviews")
        .select(
          "jobTitle, jobDescription, interview_id, created_at, interview-details(userEmail, userName, feedback, resumeURL, created_at)"
        )
        .eq("userEmail", users?.[0].email)
        .order("created_at", { ascending: false });

      let interviews = result.data || [];

      // If no interviews found for this recruiter, show all interviews (admin-style view)
      if (!interviews || interviews.length === 0) {
        const all = await supabase
          .from("interviews")
          .select(
            "jobTitle, jobDescription, interview_id, created_at, userEmail, interview-details(userEmail, userName, feedback, resumeURL, created_at)"
          )
          .order("created_at", { ascending: false });
        interviews = all.data || [];
        setUsedFallback(true);
      } else {
        setUsedFallback(false);
      }

      // Fallback: if FK not configured or nested arrays empty, fetch interview-details manually
      const allEmpty = Array.isArray(interviews) &&
        interviews.length > 0 &&
        interviews.every((it: any) => !it["interview-details"] || it["interview-details"].length === 0);

      if (allEmpty) {
        const ids = interviews.map((i: any) => i.interview_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: details, error: detailsErr } = await supabase
            .from("interview-details")
            .select("userEmail, userName, feedback, resumeURL, created_at, interview_id")
            .in("interview_id", ids);
          if (!detailsErr && Array.isArray(details)) {
            const byId: Record<string, any[]> = {};
            details.forEach((d) => {
              const key = (d as any).interview_id;
              byId[key] = byId[key] || [];
              byId[key].push(d);
            });
            interviews = interviews.map((i: any) => ({
              ...i,
              ["interview-details"]: byId[i.interview_id] || [],
            }));
          } else if (detailsErr) {
            console.warn("Manual details fetch error:", detailsErr.message);
          }
        }
      }

      console.log("interview data with candidates", interviews);
      setInterviewList(interviews);
    } catch (err) {
      console.error("Error fetching interviews:", err);
      toast("Error fetching interviews list");
      setInterviewList([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${darkTheme
        ? "bg-slate-900"
        : "bg-gradient-to-br from-blue-50 to-gray-100"
        }`}>
        <div className="flex items-center gap-2">
          <LucideLoader className={`animate-spin ${darkTheme ? "text-blue-400" : "text-blue-600"}`} size={32} />
          <h2 className={`text-2xl font-semibold ${darkTheme ? "text-slate-200" : "text-slate-900"}`}>Loading Contents...</h2>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`w-full min-h-screen p-6 ${!darkTheme
        ? "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50"
        : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        } relative`}
    >
      <div>
        {/* Welcome card */}
        <div
          className={`${darkTheme ? "bg-slate-800 border-slate-700 shadow-xl" : "bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-lg"}
            rounded-2xl flex items-center justify-between relative max-w-[900px] mx-auto hover:shadow-2xl transition-all duration-300 border overflow-hidden`}
        >
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

          {/* Subtle overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${darkTheme ? "from-blue-600/10 to-purple-600/10" : "from-blue-500/5 to-purple-500/5"}`} />

          <div className="relative z-10 flex flex-col justify-evenly h-full py-8 px-8">
            <h1 className={`font-bold text-3xl tracking-tight capitalize font-sora mb-2 ${darkTheme
              ? "text-white"
              : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent"
              }`}>
              Welcome {users?.[0].name}
            </h1>
            <p className={`font-inter text-sm md:text-base font-medium max-w-[520px] leading-relaxed ${darkTheme
              ? "text-slate-300"
              : "text-slate-700"
              }`}>
              Track and manage all your scheduled interviews. Review candidates and open interview details in one place.
            </p>
            <Button className={`py-2 px-6 text-sm tracking-tight font-inter font-semibold w-fit mt-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${darkTheme
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              }`}>
              View
            </Button>
          </div>
          <div className="relative mr-4">
            <div className={`absolute inset-0 bg-gradient-to-br blur-2xl rounded-full ${darkTheme
              ? "from-blue-600/30 to-purple-600/20"
              : "from-blue-400/30 to-purple-400/20"
              }`} />
            <Image
              src="/partnership.png"
              width={220}
              height={220}
              alt="welcome"
              className="object-cover relative z-10 drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mt-12 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <div className={`h-10 w-1.5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-lg`}></div>
            <h2 className={`font-bold text-3xl md:text-4xl font-sora tracking-tight ${darkTheme
              ? "text-white"
              : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent"
              }`}>
              Interview Results & Candidates
            </h2>
            {usedFallback && (
              <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold ${darkTheme ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                Showing all interviews
              </span>
            )}
          </div>

          {/* View Toggle Buttons */}
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${darkTheme
            ? "bg-slate-800/80 border-slate-700 backdrop-blur-sm"
            : "bg-white/80 border-blue-200 backdrop-blur-sm shadow-md"}`}>
            <button
              onClick={() => setView("grid")}
              className={`p-2.5 rounded-md transition-all font-semibold duration-200 ${view === "grid"
                ? darkTheme
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                : darkTheme
                  ? "text-slate-300 hover:text-white hover:bg-slate-700/60"
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-100/50"
                }`}
            >
              <Grid2X2 size={20} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2.5 rounded-md transition-all font-semibold duration-200 ${view === "list"
                ? darkTheme
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                : darkTheme
                  ? "text-slate-300 hover:text-white hover:bg-slate-700/60"
                  : "text-slate-600 hover:text-blue-600 hover:bg-blue-100/50"
                }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          {interviewList?.length == 0 && (
            <div className=" flex flex-col justify-center items-center mt-32">
              <div className={`p-4 rounded-full ${darkTheme ? "bg-blue-600/20" : "bg-blue-100"} mb-4`}>
                <LuVideo className={`text-5xl ${darkTheme ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <p className={`text-2xl font-semibold tracking-tight font-inter ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                No Interviews to display
              </p>
              <p className={`text-sm mt-2 ${darkTheme ? "text-slate-500" : "text-slate-600"}`}>
                Create your first interview to get started
              </p>
            </div>
          )}
        </div>

        {/* Interview sections with candidates */}
        {interviewList && interviewList.length > 0 && (
          <div className="space-y-8 mt-10 max-w-[1400px] mx-auto">
            {interviewList?.map((interview: any, index: number) => {
              const Icon = icons[index % icons.length];
              const candidates = interview["interview-details"] || [];

              return (
                <div
                  key={interview.interview_id}
                  className={`${darkTheme
                    ? "bg-slate-800 border-slate-700 shadow-lg hover:shadow-xl"
                    : "bg-white border-blue-100 shadow-md hover:shadow-lg"
                    } rounded-2xl p-8 relative overflow-hidden transition-all duration-300 border`}
                >
                  {/* Decorative top line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

                  {/* Interview header */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0 transition-transform hover:scale-110">
                        <Icon className="text-white w-7 h-7" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-2xl font-sora mb-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>{interview.jobTitle}</h3>
                        <p className={`text-sm leading-relaxed max-w-2xl ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>{interview.jobDescription}</p>
                        <div className="flex items-center gap-6 mt-4">
                          <span className={`text-sm font-medium flex items-center gap-2 ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                          <span className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                            {candidates.length} {candidates.length === 1 ? "Candidate" : "Candidates"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/scheduled/${interview.interview_id}/details`}>
                      <Button className={`font-inter text-sm transition-all ${darkTheme
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        }`}>
                        Full Details <LuActivity className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Candidates list */}
                  {candidates.length === 0 ? (
                    <div className={`text-center py-12 rounded-lg ${darkTheme ? "bg-slate-900/50" : "bg-blue-50"}`}>
                      <p className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>No candidates have completed this interview yet.</p>
                    </div>
                  ) : (
                    <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
                      {candidates.map((candidate: any, idx: number) => {
                        // Calculate average rating
                        const ratings = candidate.feedback?.data?.feedback?.rating;
                        let avgScore: number | null = null;
                        if (ratings) {
                          const values = Object.values(ratings);
                          const sum = values.reduce((acc: number, v: any) => acc + (v ?? 0), 0);
                          avgScore = values.length > 0 ? sum / values.length : null;
                        }

                        const getColor = (score: number) => {
                          if (score < 5) return darkTheme ? "text-red-400" : "text-red-600";
                          if (score < 7) return darkTheme ? "text-amber-400" : "text-amber-600";
                          return darkTheme ? "text-emerald-400" : "text-emerald-600";
                        };

                        const recommendation = candidate.feedback?.data?.feedback?.recommendation;

                        return (
                          <Card
                            key={idx}
                            className={`${darkTheme
                              ? "bg-slate-900 border-slate-700 hover:border-blue-600"
                              : "bg-slate-50 border-blue-100 hover:border-blue-300"
                              } p-5 relative group hover:shadow-lg transition-all duration-200 border`}
                          >
                            <div className="flex items-start gap-4">
                              <Image
                                src="/profile.png"
                                alt="profile"
                                width={48}
                                height={48}
                                className="rounded-full flex-shrink-0 ring-2 ring-blue-500/30"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold capitalize font-inter text-sm truncate ${darkTheme ? "text-white" : "text-slate-900"}`}>
                                  {candidate.userName}
                                </p>
                                <p className={`text-xs truncate ${darkTheme ? "text-slate-500" : "text-slate-500"}`}>
                                  {candidate.userEmail}
                                </p>
                                {avgScore !== null && (
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`font-bold text-sm ${getColor(avgScore)}`}>
                                      {avgScore.toFixed(1)}/10
                                    </span>
                                    {recommendation && (
                                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${recommendation === "Yes"
                                        ? darkTheme
                                          ? "bg-emerald-900/40 text-emerald-300"
                                          : "bg-emerald-100 text-emerald-700"
                                        : darkTheme
                                          ? "bg-red-900/40 text-red-300"
                                          : "bg-red-100 text-red-700"
                                        }`}>
                                        {recommendation === "Yes" ? "Approved" : "Not Recommended"}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Link href={`/scheduled/${interview.interview_id}/details`} className="flex-1">
                                <Button variant="outline" size="sm" className={`w-full text-xs font-medium ${darkTheme
                                  ? "border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-blue-500"
                                  : "border-blue-200 text-blue-600 hover:bg-blue-50/50 hover:border-blue-400"
                                  }`}>
                                  <LuActivity className="mr-1.5 h-3.5 w-3.5" /> Report
                                </Button>
                              </Link>
                              {candidate.resumeURL && (
                                <Link href={`/scheduled/${interview.interview_id}/details`} className="flex-1">
                                  <Button variant="outline" size="sm" className={`w-full text-xs font-medium ${darkTheme
                                    ? "border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:border-blue-500"
                                    : "border-blue-200 text-blue-600 hover:bg-blue-50/50 hover:border-blue-400"
                                    }`}>
                                    <LuDock className="mr-1.5 h-3.5 w-3.5" /> Resume
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* <div
        className={`grid ${
          view === "grid" ? "grid-cols-3" : "grid-cols-1"
        } border-dashed border-blue-600 p-4 rounded-md bg-white`}
      >
        <div className="flex w-full h-full items-center justify-center">
          hello
        </div>
      </div> */}
      </div>
    </div>
  );
};

export default ScheduledInterview;
