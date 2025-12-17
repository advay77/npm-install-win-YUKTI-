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
import { LuActivity, LuLoader, LuVideo } from "react-icons/lu";
import Image from "next/image";
import Link from "next/link";

const icons = [Briefcase, Clock, FileText, UserCheck, Calendar];

const ScheduledInterview = () => {
  const { users } = useUserData();
  const { darkTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [interviewList, setInterviewList] = useState<any>([]);
  const [view, setView] = useState("grid");

  useEffect(() => {
    users && GetInterviewList();
  }, [users]);
  // we we have connect 2 tables interviews , interview-details using FK;
  const GetInterviewList = async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("interviews")
        .select(
          "jobTitle, jobDescription, interview_id, interview-details(userEmail)"
        )
        .eq("userEmail", users?.[0].email)
        .order("created_at", { ascending: false });
      console.log("interview data raw", result.data);
      setInterviewList(result.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="flex items-center gap-2">
          <LucideLoader className="animate-spin" size={32} />
          <h2 className="text-2xl">Loading Contents...</h2>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`w-full min-h-screen p-6 ${!darkTheme
        ? "bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20"
        : "bg-slate-900"
        } relative`}
    >
      <div>
        {/* Welcome card */}
        <div
          className={`${darkTheme ? "bg-slate-800 text-white" : "bg-white text-black"}
            rounded-2xl flex items-center justify-between relative max-w-[900px] mx-auto shadow-xl hover:shadow-2xl transition-all border border-blue-100/30 overflow-hidden`}
        >
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />

          <div className="relative z-10 flex flex-col justify-evenly h-full py-6 px-6">
            <h1 className="font-bold text-3xl tracking-tight capitalize font-sora mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome {users?.[0].name}
            </h1>
            <p className="font-inter text-sm md:text-base font-medium max-w-[520px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Track and manage all your scheduled interviews. Review candidates and open interview details in one place.
            </p>
            <Button className="py-2 px-4 text-sm tracking-tight font-inter font-semibold w-fit mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all">
              View
            </Button>
          </div>
          <div className="relative mr-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl rounded-full" />
            <Image
              src="/partnership.png"
              width={220}
              height={220}
              alt="welcome"
              className="object-cover relative z-10 drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Header & view toggle */}
        <div className="flex items-center justify-between mt-8 max-w-[1100px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
            <h2 className="font-bold text-2xl md:text-3xl font-sora tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Scheduled Interviews
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className={`${darkTheme ? "bg-slate-800 border border-slate-700" : "bg-white"} p-2 rounded-xl shadow-md flex`}>
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
          <div
            className={`grid ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6 mt-10 max-w-[1100px] mx-auto`}
          >
            {interviewList?.map((item: any, index: number) => {
              const Icon = icons[index % icons.length]; // pick icon by index

              return (
                <Card
                  key={item.interview_id}
                  className={`${darkTheme ? "bg-slate-800 border border-slate-700" : "bg-white"} rounded-2xl shadow-md hover:shadow-lg transition-all px-4 py-5 relative overflow-hidden group`}
                >
                  {/* overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* top line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Icon className="text-white w-5 h-5" />
                    </div>
                    <CardTitle className="font-semibold text-lg font-sora">
                      {item.jobTitle}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="text-sm font-inter space-y-3">
                    <p className="line-clamp-2 text-slate-600 dark:text-slate-300">
                      {item.jobDescription}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Active</span>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-slate-200">
                        Candidates: {item["interview-details"].length}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-end">
                    <Link href={`/scheduled/${item.interview_id}/details`}>
                      <Button className="font-inter text-sm cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all">
                        View Details <LuActivity />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
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
