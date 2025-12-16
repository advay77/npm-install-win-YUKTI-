/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { Button } from "@/components/ui/button";
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
import { Archive, Copy, Trash2 } from "lucide-react";
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
          <h2 className="font-semibold text-2xl font-inter capitalize ml-5">
            All Interviews
          </h2>
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

            <div className="flex items-center gap-3 bg-white p-2 rounded-md">
              <Filter />
              <p>Filters</p>
            </div>
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
              {interviewList?.map((item: any, index: number) => {
                const Icon = icons[index % icons.length];
                return (
                  <Card
                    key={item.interview_id}
                    className="relative bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl shadow-[0_10px_40px_-24px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_50px_-22px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-200 p-6 w-full max-w-md flex flex-col gap-4"
                  >
                    <CardHeader className="flex flex-row items-start justify-start gap-3 pb-0">
                      <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-inner shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs uppercase tracking-[0.08em] text-slate-500 font-semibold">Role</p>
                        <CardTitle className="font-semibold text-xl text-slate-900 font-sora leading-tight">
                          {item.jobTitle}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="text-sm text-slate-600 font-inter space-y-4 pt-2">
                      <p className="line-clamp-3 text-left leading-relaxed text-slate-700">{item.jobDescription}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                          ⏱
                          <span className="text-slate-800">{item.interviewDuration} mins</span>
                        </span>
                      </div>
                    </CardContent>

                    <div className="h-px bg-slate-100" />

                    <CardFooter className="flex justify-between gap-4 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/interview/${item.interview_id}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copied to clipboard");
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        Copy Link <Copy className="ml-2 w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.interview_id)}
                      >
                        Delete <Trash2 className="ml-2 w-4 h-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 space-y-4">
              {interviewList?.map((item: any, index: number) => {
                const Icon = icons[index % icons.length];
                return (
                  <Card
                    key={item.interview_id}
                    className="relative bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-[0_10px_40px_-24px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_50px_-22px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 p-5 w-full"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-inner shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-500 font-semibold">Role</p>
                          <CardTitle className="font-semibold text-xl text-slate-900 font-sora leading-tight">
                            {item.jobTitle}
                          </CardTitle>
                          <p className="line-clamp-2 text-sm text-slate-700 leading-relaxed max-w-2xl">
                            {item.jobDescription}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                          ⏱
                          <span className="text-slate-800">{item.interviewDuration} mins</span>
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 my-4" />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Active
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/interview/${item.interview_id}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copied to clipboard");
                          }}
                          className="border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          Copy Link <Copy className="ml-2 w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.interview_id)}
                        >
                          Delete <Trash2 className="ml-2 w-4 h-4" />
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
