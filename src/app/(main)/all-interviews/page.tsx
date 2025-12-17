/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData } from "@/context/UserDetailContext";
import { supabase } from "@/services/supabaseClient";
import { Archive, Copy, Trash2, Filter as FilterIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
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
import { LuVideo } from "react-icons/lu";

const icons = [Briefcase, Clock, FileText, UserCheck, Calendar];

const AllInterview = () => {
  const { darkTheme } = useTheme();
  const { users } = useUserData();
  const [interviewList, setInterviewList] = useState<any>([]);
  const [view, setView] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  useEffect(() => {
    users && GetInterviewList();
  }, [users]);

  const GetInterviewList = async () => {
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("userEmail", users?.[0].email);

    setInterviewList(data);
  };

  const TYPE_OPTIONS = [
    "All",
    "Technical",
    "Behavioral",
    "Experience",
    "Problem Solving",
    "Leadership",
  ];
  const DURATION_OPTIONS = [10, 15, 30, 45];

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };
  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedDuration(null);
  };

  const filteredInterviews = React.useMemo(() => {
    const selectedTypesLc = selectedTypes.map((t) => t.toLowerCase());

    const extractTypeTokens = (it: any): string[] => {
      const explicit = it.interviewType ?? it.jobType ?? it.job_title ?? it.type ?? it.category ?? null;
      const tokens: string[] = [];
      if (Array.isArray(explicit)) {
        explicit.forEach((v: any) => tokens.push(String(v).toLowerCase().trim()));
      } else if (typeof explicit === "string") {
        explicit
          .split(/[,/|]/)
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean)
          .forEach((v: string) => tokens.push(v));
      } else if (explicit != null) {
        tokens.push(String(explicit).toLowerCase().trim());
      }
      const titleLc = String(it.jobTitle || "").toLowerCase();
      const descriptionLc = String(it.jobDescription || "").toLowerCase();
      ["technical", "behavioral", "experience", "problem solving", "leadership"].forEach((kw) => {
        if (titleLc.includes(kw) || descriptionLc.includes(kw)) tokens.push(kw);
      });
      return Array.from(new Set(tokens));
    };

    return (interviewList || []).filter((item: any) => {
      const itemTokens = extractTypeTokens(item);
      const durationVal = Number(item.interviewDuration);
      const matchesDuration = selectedDuration === null || durationVal === selectedDuration;
      // Type matching: AND when specific types selected; if 'All' is selected, treat other selected types as exclusions
      let matchesType = true;
      const hasAll = selectedTypesLc.includes("all");
      const otherTypes = selectedTypesLc.filter((t) => t !== "all");
      if (selectedTypesLc.length === 0) {
        matchesType = true;
      } else if (hasAll) {
        matchesType = otherTypes.length === 0 || !otherTypes.some((t) => itemTokens.includes(t));
      } else {
        matchesType = otherTypes.every((t) => itemTokens.includes(t));
      }
      return matchesType && matchesDuration;
    });
  }, [interviewList, selectedTypes, selectedDuration]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("interviews")
        .delete()
        .eq("interview_id", id);

      if (error) throw error;

      setInterviewList((prev: any[]) => prev?.filter((i) => i.interview_id !== id));
      toast.success("Interview deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete interview");
    }
  };

  return (
    <div
      className={`w-full h-full p-6 ${!darkTheme
        ? "bg-gradient-to-br from-blue-50 to-gray-100"
        : "bg-gray-200"
        } relative`}
    >
      <div className="">
        <div className=" flex items-center justify-between">
          <div className="flex items-center gap-3 ml-5">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            <h2 className="font-bold text-3xl font-sora bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              All Interviews
            </h2>
          </div>
          <div className="flex items-center gap-5 mr-10">
            <div className="space-x-2 bg-white p-2 rounded-md flex">
              <Button
                variant={view === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
                className="rounded-md"
              >
                <Grid2X2 className="w-4 h-4" />
              </Button>

              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                className="rounded-md"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FilterIcon className="w-4 h-4" />
                  Filters
                  {(selectedTypes.length > 0 || selectedDuration !== null) && (
                    <span className="ml-1 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      {selectedTypes.length + (selectedDuration !== null ? 1 : 0)}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Interview Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TYPE_OPTIONS.map((t) => (
                        <label key={t} className="flex items-center gap-2 rounded-md border p-2">
                          <Checkbox
                            checked={selectedTypes.includes(t)}
                            onCheckedChange={() => toggleType(t)}
                          />
                          <span className="text-sm">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Interview Duration</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((d) => (
                        <Button
                          key={d}
                          size="sm"
                          variant={selectedDuration === d ? "default" : "outline"}
                          onClick={() =>
                            setSelectedDuration(selectedDuration === d ? null : d)
                          }
                        >
                          {d} min
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => setFilterOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="w-full flex items-center justify-center">
          {interviewList?.length == 0 && (
            <div className=" flex flex-col justify-center items-center mt-20">
              <LuVideo className="text-3xl text-blue-600" />
              <p className="text-2xl font-medium tracking-tight font-inter mt-2 text-gray-500">
                No Interviews to display
              </p>
            </div>
          )}
        </div>

        {interviewList && (
          view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-10 justify-items-center">
              {filteredInterviews?.map((item: any, index: number) => {
                const Icon = icons[index % icons.length];
                return (
                  <Card
                    key={item.interview_id}
                    className="relative bg-gradient-to-br from-white via-white to-slate-50 border border-slate-200 rounded-2xl shadow-[0_8px_32px_-8px_rgba(59,130,246,0.1)] hover:shadow-[0_16px_48px_-12px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 transition-all duration-300 p-6 w-full max-w-md flex flex-col justify-between group"
                  >
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />

                    <CardHeader className="flex flex-row items-start justify-start gap-3 pb-2 relative z-10">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-400 font-semibold">Role</p>
                        <CardTitle className="font-bold text-lg text-slate-900 font-sora leading-tight group-hover:text-blue-600 transition-colors duration-300">
                          {item.jobTitle}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="text-sm text-slate-600 font-inter space-y-3 pt-2 relative z-10">
                      <p className="line-clamp-3 text-left leading-relaxed text-slate-600 text-sm">{item.jobDescription}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const tokens = ((): string[] => {
                            const explicit = item.interviewType ?? item.jobType ?? item.job_title ?? item.type ?? item.category ?? null;
                            const t: string[] = [];
                            if (Array.isArray(explicit)) {
                              explicit.forEach((v: any) => t.push(String(v).toLowerCase().trim()));
                            } else if (typeof explicit === "string") {
                              explicit
                                .split(/[,/|]/)
                                .map((s: string) => s.trim().toLowerCase())
                                .filter(Boolean)
                                .forEach((v: string) => t.push(v));
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
                            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-2.5 py-1 font-medium text-xs border border-blue-200/50 hover:border-blue-300 transition-colors duration-200">
                              {tag}
                            </span>
                          ));
                        })()}
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 p-2.5">
                        <span className="text-base">⏱</span>
                        <span className="text-slate-700 font-semibold text-sm">{item.interviewDuration} mins</span>
                      </div>
                    </CardContent>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-3 relative z-10" />

                    <CardFooter className="flex justify-between gap-3 pt-1 relative z-10">
                      <Button
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/interview/${item.interview_id}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copied to clipboard");
                        }}
                        className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 hover:text-blue-800 transition-all duration-200 flex items-center font-medium flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" /> Link
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleDelete(item.interview_id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center font-medium"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 space-y-4">
              {filteredInterviews?.map((item: any, index: number) => {
                const Icon = icons[index % icons.length];
                return (
                  <Card
                    key={item.interview_id}
                    className="relative bg-gradient-to-r from-white via-white to-slate-50 border border-slate-200 rounded-2xl shadow-[0_8px_32px_-8px_rgba(59,130,246,0.1)] hover:shadow-[0_16px_48px_-12px_rgba(59,130,246,0.15)] hover:translate-x-1 transition-all duration-300 p-5 w-full group"
                  >
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-transparent to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400 font-semibold">Role</p>
                          <CardTitle className="font-bold text-lg text-slate-900 font-sora leading-tight group-hover:text-blue-600 transition-colors duration-300">
                            {item.jobTitle}
                          </CardTitle>
                          <p className="line-clamp-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
                            {item.jobDescription}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {(() => {
                              const tokens = ((): string[] => {
                                const explicit = item.interviewType ?? item.jobType ?? item.job_title ?? item.type ?? item.category ?? null;
                                const t: string[] = [];
                                if (Array.isArray(explicit)) {
                                  explicit.forEach((v: any) => t.push(String(v).toLowerCase().trim()));
                                } else if (typeof explicit === "string") {
                                  explicit
                                    .split(/[,/|]/)
                                    .map((s: string) => s.trim().toLowerCase())
                                    .filter(Boolean)
                                    .forEach((v: string) => t.push(v));
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
                                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-2.5 py-1 font-medium text-xs border border-blue-200/50 hover:border-blue-300 transition-colors duration-200">
                                  {tag}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-1.5 font-semibold">
                          ⏱
                          <span className="text-slate-800">{item.interviewDuration} mins</span>
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4 relative z-10" />

                    <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
                        <span className="font-medium">Active</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/interview/${item.interview_id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copied to clipboard");
                          }}
                          className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-300 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 hover:text-blue-800 transition-all duration-200 flex items-center font-medium"
                        >
                          <Copy className="w-4 h-4 mr-2" /> Link
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleDelete(item.interview_id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center font-medium"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
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

export default AllInterview;
