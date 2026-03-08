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
  Filter,
} from "lucide-react";
import { LuActivity, LuLoader, LuVideo, LuDock } from "react-icons/lu";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo } from "react";

const icons = [Briefcase, Clock, FileText, UserCheck, Calendar];

const ScheduledInterview = () => {
  const { users } = useUserData();
  const { darkTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [interviewList, setInterviewList] = useState<any>([]);
  const [usedFallback, setUsedFallback] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [recommendationFilter, setRecommendationFilter] = useState("all"); // all, Yes (Approved), No (Not Recommended)

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

      // If no interviews found for this recruiter, don't show interviews from other users
      if (!interviews || interviews.length === 0) {
        setUsedFallback(false);
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

  const filteredData = useMemo(() => {
    if (!interviewList) return [];

    const isAdvancedFilterActive = minScore > 0 || recommendationFilter !== "all";
    const isSearchActive = searchQuery.trim() !== "";

    return interviewList.map((interview: any) => {
      const candidates = interview["interview-details"] || [];

      const filteredCandidates = candidates.filter((cand: any) => {
        // Name/Email match
        const searchLower = searchQuery.toLowerCase().trim();
        const matchesSearch = !isSearchActive ||
          cand.userName?.toLowerCase().includes(searchLower) ||
          cand.userEmail?.toLowerCase().includes(searchLower) ||
          interview.jobTitle?.toLowerCase().includes(searchLower);

        // Score match
        const ratings = cand.feedback?.data?.feedback?.rating;
        let avgScore: number | null = null;
        if (ratings) {
          const values = Object.values(ratings) as number[];
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + (Number(b) || 0), 0);
            avgScore = sum / values.length;
          }
        }

        // If minScore is 0, we don't filter.
        // If minScore > 0, we only show candidates who have a score AND meet the threshold.
        const matchesScore = minScore === 0 || (avgScore !== null && avgScore >= minScore);

        // Recommendation match
        const recommendation = cand.feedback?.data?.feedback?.recommendation;
        const matchesRec = recommendationFilter === "all" || recommendation === recommendationFilter;

        return matchesSearch && matchesScore && matchesRec;
      });

      return {
        ...interview,
        filteredCandidates
      };
    }).filter((interview: any) => {
      const hasMatchingCandidates = interview.filteredCandidates.length > 0;

      // If any filter is active, only show interviews that HAVE matching candidates
      if (isAdvancedFilterActive || isSearchActive) {
        return hasMatchingCandidates;
      }

      return true; // No filters active, show everything.
    });
  }, [interviewList, searchQuery, minScore, recommendationFilter]);

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
        {/* Header */}
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-1.5 rounded-full shadow-lg ${darkTheme ? "bg-gradient-to-b from-blue-400 via-indigo-400 to-purple-500" : "bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600"}`}></div>
            <h2 className={`font-bold text-3xl md:text-4xl font-sora tracking-tight ${darkTheme ? "bg-gradient-to-r from-white via-white to-slate-50 text-transparent bg-clip-text" : "bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-transparent bg-clip-text"}`}>
              Interview Results & Candidates
            </h2>
            {usedFallback && (
              <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold ${darkTheme ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                Showing all interviews
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group w-full md:w-80">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${darkTheme ? "text-slate-500 group-hover:text-blue-400" : "text-slate-400 group-hover:text-blue-500"}`} />
              <Input
                placeholder="Search candidates or jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-11 pr-4 py-2 rounded-2xl text-sm transition-all outline-none border ${darkTheme
                  ? "bg-slate-900/50 border-slate-800 focus:border-blue-500/50 text-white"
                  : "bg-white border-slate-200 focus:border-blue-500 shadow-sm"
                  }`}
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`flex items-center gap-2 rounded-2xl border transition-all h-10 ${minScore > 0 || recommendationFilter !== "all"
                    ? "border-blue-500 bg-blue-500/10 text-blue-500"
                    : darkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-sm font-semibold">Filters</span>
                  {(minScore > 0 || recommendationFilter !== "all") && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={`w-80 p-6 rounded-3xl border ${darkTheme ? "bg-slate-900 border-slate-800 shadow-2xl shadow-black/50" : "bg-white border-slate-200 shadow-xl"}`}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold text-base ${darkTheme ? "text-white" : "text-slate-900"}`}>Advanced Filters</h4>
                    {(minScore > 0 || recommendationFilter !== "all") && (
                      <button
                        onClick={() => { setMinScore(0); setRecommendationFilter("all"); }}
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className={`text-[11px] font-black uppercase tracking-wider ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      Minimum Score: {minScore}/10
                    </label>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={minScore}
                        onChange={(e) => setMinScore(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-blue-500/20 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={`text-[11px] font-black uppercase tracking-wider ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      Recommendation
                    </label>
                    <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
                      <SelectTrigger className={`w-full rounded-xl ${darkTheme ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                        <SelectValue placeholder="All Recommendations" />
                      </SelectTrigger>
                      <SelectContent className={darkTheme ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Yes">Approved Only</SelectItem>
                        <SelectItem value="No">Not Recommended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          {interviewList?.length === 0 && (
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

          {interviewList?.length > 0 && filteredData?.length === 0 && (
            <div className=" flex flex-col justify-center items-center mt-32">
              <div className={`p-4 rounded-full ${darkTheme ? "bg-slate-800" : "bg-slate-100"} mb-4`}>
                <Search className={`text-5xl ${darkTheme ? "text-slate-500" : "text-slate-400"}`} />
              </div>
              <p className={`text-xl font-semibold tracking-tight font-inter ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                No candidates match your filters
              </p>
              <p className={`text-sm mt-2 ${darkTheme ? "text-slate-500" : "text-slate-600"}`}>
                Try adjusting your search or advanced filters
              </p>
              <Button
                variant="link"
                onClick={() => { setSearchQuery(""); setMinScore(0); setRecommendationFilter("all"); }}
                className="text-blue-500 font-bold mt-2"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Interview sections with candidates */}
        {filteredData && filteredData.length > 0 && (
          <div className="space-y-8 mt-10 max-w-[1400px] mx-auto">
            {filteredData?.map((interview: any, index: number) => {
              const Icon = icons[index % icons.length];
              const candidates = interview.filteredCandidates || [];

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
                    <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default ScheduledInterview;
