/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useUserData } from "@/context/UserDetailContext";
import { supabase } from "@/services/supabaseClient";
import React, { useEffect, useMemo, useState } from "react";
import { LuLoader, LuVideo } from "react-icons/lu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeProvider";

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
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const icons = [Briefcase, Clock, FileText, UserCheck, Calendar];
const TYPE_OPTIONS = [
  "All",
  "Technical",
  "Behavioral",
  "Experience",
  "Problem Solving",
  "Leadership",
];
const DURATION_OPTIONS = [10, 15, 30, 45];
const DasboardRecentInterviews = () => {
  const [interviewList, setInterviewList] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const { users } = useUserData();
  const { darkTheme } = useTheme();
  const [view, setView] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  useEffect(() => {
    users && GetInterview();
  }, [users]);

  const GetInterview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("userEmail", users?.[0].email)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setInterviewList(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedDuration(null);
  };

  const filteredInterviews = useMemo(() => {
    const selectedTypesLc = selectedTypes.map((t) => t.toLowerCase());

    const extractTypeTokens = (it: any): string[] => {
      const explicit = it.interviewType ?? it.jobType ?? it.job_title ?? it.type ?? it.category ?? null;
      const tokens: string[] = [];
      if (Array.isArray(explicit)) {
        explicit.forEach((v) => tokens.push(String(v).toLowerCase().trim()));
      } else if (typeof explicit === "string") {
        explicit
          .split(/[,/|]/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .forEach((v) => tokens.push(v));
      } else if (explicit != null) {
        tokens.push(String(explicit).toLowerCase().trim());
      }
      const titleLc = String(it.jobTitle || "").toLowerCase();
      const descriptionLc = String(it.jobDescription || "").toLowerCase();
      // Heuristic: include common keywords from title/description
      ["technical", "behavioral", "experience", "problem solving", "leadership"].forEach((kw) => {
        if (titleLc.includes(kw) || descriptionLc.includes(kw)) tokens.push(kw);
      });
      return Array.from(new Set(tokens));
    };

    return (interviewList || []).filter((item: any) => {
      const itemTokens = extractTypeTokens(item);
      const durationVal = Number(item.interviewDuration);
      const matchesDuration = selectedDuration === null || durationVal === selectedDuration;
      // Type matching supports two modes:
      // 1) AND mode: when specific types are selected (without "All"), item must include ALL selected types.
      // 2) ALL mode: when "All" is selected, include everything EXCEPT items that match any other selected types (treated as exclusions).
      let matchesType = true;
      const hasAll = selectedTypesLc.includes("all");
      const otherTypes = selectedTypesLc.filter((t) => t !== "all");
      if (selectedTypesLc.length === 0) {
        matchesType = true;
      } else if (hasAll) {
        // Exclude items containing any explicitly selected types (acting as blocklist)
        matchesType = otherTypes.length === 0 || !otherTypes.some((t) => itemTokens.includes(t));
      } else {
        // AND across selected types
        matchesType = otherTypes.every((t) => itemTokens.includes(t));
      }
      return matchesType && matchesDuration;
    });
  }, [interviewList, selectedTypes, selectedDuration]);

  const handleSend = (item: any) => {
    const url = `${window.location.origin}/interview/${item.interview_id}`;
    const subject = encodeURIComponent(`Interview link for ${item.jobTitle ?? "your role"}`);
    const body = encodeURIComponent(
      `Hi,

Here is your interview link: ${url}
Duration: ${item.interviewDuration ?? ""} mins.

Thanks.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="my-10 px-4 sm:px-6 lg:px-10">
      <div className=" flex items-center justify-between">
        <div className="flex items-center gap-3 ml-5">
          <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
          <h2 className={`font-bold text-3xl font-sora ${darkTheme
            ? "text-white"
            : "bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
            }`}>
            Recent Interviews
          </h2>
        </div>

        <div className="flex items-center gap-5 mr-10">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
                <Filter className="w-4 h-4" />
                <span className="font-semibold">Filters</span>
                {(selectedTypes.length > 0 || selectedDuration !== null) && (
                  <span className="ml-1 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-sm">
                    {selectedTypes.length + (selectedDuration !== null ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-96 p-0 shadow-xl ${darkTheme ? "border-slate-700 bg-slate-800" : "border-blue-200 bg-white"}`}>
              <div className={`${darkTheme ? "bg-gradient-to-br from-slate-800 to-slate-700" : "bg-gradient-to-br from-white to-blue-50/30"} rounded-lg`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b ${darkTheme ? "border-slate-700 bg-gradient-to-r from-slate-700 to-slate-600" : "border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100/50"}`}>
                  <div className="flex items-center gap-2">
                    <Filter className={`w-5 h-5 ${darkTheme ? "text-blue-400" : "text-blue-600"}`} />
                    <h3 className={`font-bold text-lg font-sora ${darkTheme ? "text-white" : "text-blue-900"}`}>Filter Interviews</h3>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Interview Type Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-5 w-0.5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                      <p className={`font-semibold text-sm font-inter ${darkTheme ? "text-slate-200" : "text-slate-700"}`}>Interview Type</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {TYPE_OPTIONS.map((t) => (
                        <label
                          key={t}
                          className={`flex items-center gap-2.5 rounded-lg border-2 p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedTypes.includes(t)
                            ? darkTheme ? 'border-blue-500 bg-gradient-to-br from-blue-900 to-blue-800 shadow-sm' : 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm'
                            : darkTheme ? 'border-slate-600 bg-slate-700 hover:border-slate-500 hover:bg-slate-600' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                        >
                          <Checkbox
                            checked={selectedTypes.includes(t)}
                            onCheckedChange={() => toggleType(t)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <span className={`text-sm font-medium ${selectedTypes.includes(t) ? darkTheme ? 'text-blue-300' : 'text-blue-700' : darkTheme ? 'text-slate-200' : 'text-slate-600'}`}>
                            {t}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Interview Duration Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-5 w-0.5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
                      <p className={`font-semibold text-sm font-inter ${darkTheme ? "text-slate-200" : "text-slate-700"}`}>Interview Duration</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {DURATION_OPTIONS.map((d) => (
                        <Button
                          key={d}
                          size="sm"
                          className={`font-medium transition-all duration-200 ${selectedDuration === d
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg'
                            : darkTheme ? 'bg-slate-700 border-2 border-slate-600 text-slate-200 hover:border-slate-500 hover:bg-slate-600' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          onClick={() =>
                            setSelectedDuration(selectedDuration === d ? null : d)
                          }
                        >
                          {d} min
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className={`flex items-center justify-between px-5 py-4 border-t ${darkTheme ? "border-slate-700 bg-gradient-to-r from-slate-700 to-slate-600" : "border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50/30"}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className={`font-medium ${darkTheme ? "text-slate-300 hover:text-white hover:bg-slate-600" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
                  >
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setFilterOpen(false)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg font-medium px-6"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading && (
        <div className="w-full h-full flex items-center justify-center -mt-10">
          <div className="flex flex-col justify-center items-center mt-20">
            <LuLoader className="text-xl text-blue-600 animate-spin" />
            <p className="text-lg font-medium tracking-tight font-inter mt-2 text-gray-500">
              Loading Interviews
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex items-center justify-center">
        {interviewList?.length == 0 && !loading && (
          <div className=" flex flex-col justify-center items-center mt-20">
            <LuVideo className="text-3xl text-blue-600" />
            <p className="text-xl font-medium tracking-tight font-inter mt-2 text-gray-500">
              No Interviews to display
            </p>
          </div>
        )}
      </div>

      {filteredInterviews && !loading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-10 justify-items-center"
        >
          {filteredInterviews?.map((item: any, index: number) => {
            const Icon = icons[index % icons.length]; // pick icon by index

            return (
              <Card
                key={item.interview_id}
                className={`relative rounded-2xl shadow-[0_8px_32px_-8px_rgba(59,130,246,0.1)] hover:shadow-[0_16px_48px_-12px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 transition-all duration-300 p-5 w-full max-w-md flex flex-col justify-between group ${darkTheme
                  ? "bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 border border-slate-700"
                  : "bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200"
                  }`}
              >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />

                <CardHeader className="flex flex-row items-start justify-start gap-3 pb-1 relative z-10">
                  <div className={`p-3 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shrink-0 ${darkTheme
                    ? "bg-gradient-to-br from-blue-900 to-blue-800 text-blue-400"
                    : "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600"
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400 font-semibold">Role</p>
                    <CardTitle className={`font-bold text-lg font-sora leading-tight group-hover:text-blue-600 transition-colors duration-300 ${darkTheme ? "text-white" : "text-slate-900"
                      }`}>
                      {item.jobTitle}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className={`text-sm font-inter space-y-2 pt-1 relative z-10 ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
                  <p className={`line-clamp-2 text-left leading-relaxed text-sm ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
                    {item.jobDescription}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const tokens = ((): string[] => {
                        const explicit = item.interviewType ?? item.jobType ?? item.job_title ?? item.type ?? item.category ?? null;
                        const t: string[] = [];
                        if (Array.isArray(explicit)) {
                          explicit.forEach((v) => t.push(String(v).toLowerCase().trim()));
                        } else if (typeof explicit === "string") {
                          explicit
                            .split(/[,/|]/)
                            .map((s) => s.trim().toLowerCase())
                            .filter(Boolean)
                            .forEach((v) => t.push(v));
                        } else if (explicit != null) {
                          t.push(String(explicit).toLowerCase().trim());
                        }
                        const titleLc = String(item.jobTitle || "").toLowerCase();
                        const descriptionLc = String(item.jobDescription || "").toLowerCase();
                        ["technical", "behavioral", "experience", "problem solving", "leadership"].forEach((kw) => {
                          if (titleLc.includes(kw) || descriptionLc.includes(kw)) t.push(kw);
                        });
                        return Array.from(new Set(t)).slice(0, 5);
                      })();
                      return tokens.map((tag) => (
                        <span key={tag} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-xs border transition-colors duration-200 ${darkTheme
                          ? "bg-gradient-to-r from-blue-900 to-blue-800 text-blue-300 border-blue-700/50 hover:border-blue-600"
                          : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200/50 hover:border-blue-300"
                          }`}>
                          {tag}
                        </span>
                      ));
                    })()}
                  </div>
                  <div className={`flex items-center gap-2 rounded-lg bg-gradient-to-r p-2.5 ${darkTheme
                    ? "from-slate-700 to-slate-600"
                    : "from-slate-50 to-slate-100"
                    }`}>
                    <span className="text-base">⏱</span>
                    <span className={`font-semibold text-sm ${darkTheme ? "text-slate-200" : "text-slate-700"}`}>{item.interviewDuration} mins</span>
                  </div>
                </CardContent>

                <div className={`h-px bg-gradient-to-r to-transparent my-2 relative z-10 ${darkTheme ? "from-transparent via-slate-600" : "from-transparent via-slate-200"}`} />

                <CardFooter className="flex justify-between gap-3 pt-0 relative z-10">
                  <Button
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/interview/${item.interview_id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard");
                    }}
                    className={`transition-all duration-200 flex items-center font-medium flex-1 ${darkTheme
                      ? "bg-gradient-to-r from-blue-900 to-blue-800 text-blue-300 border border-blue-700 hover:from-blue-800 hover:to-blue-700 hover:border-blue-600 hover:text-blue-200"
                      : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 hover:text-blue-800"
                      }`}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Link
                  </Button>

                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center font-medium"
                    onClick={() => handleSend(item)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Send
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DasboardRecentInterviews;
