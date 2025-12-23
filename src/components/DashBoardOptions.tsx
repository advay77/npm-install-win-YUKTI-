"use client";
import React from "react";
import { LuVideo, LuCircleFadingPlus, LuSearch, LuMailPlus } from "react-icons/lu";
import { LuStar, LuBookText, LuMessageSquareMore } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData } from "@/context/UserDetailContext";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DashBoardOptions = () => {
  const { darkTheme } = useTheme();
  const { users } = useUserData();
  const router = useRouter();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const userEmail = users?.[0]?.email;
  const remainingCredits = users?.[0]?.remainingCredits ?? 0;
  const isAdmin = userEmail === adminEmail;
  const hasCredits = remainingCredits > 0 || isAdmin;

  const handleProClick = (path: string) => {
    if (!hasCredits && !isAdmin) {
      toast.error("No credits remaining. Please purchase credits to continue.", {
        duration: 3000,
      });
      return;
    }
    router.push(path);
  };

  return (
    <div className="grid grid-cols-1 min-[800px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-6 w-full my-8 max-w-[1400px] mx-auto">
      {/* First Card - Create Interview */}
      <div
        className={`group ${darkTheme ? "bg-slate-900 text-white" : "bg-gradient-to-br from-white via-white to-blue-50/50 text-black"
          } py-5 px-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blue-100/30 relative overflow-hidden`}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <LuVideo className="text-2xl text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-3 py-1.5 text-xs tracking-tight font-bold font-inter rounded-full flex items-center gap-1.5 shadow-md">
              Pro <LuStar className="text-white text-sm" />
            </span>
          </div>
          <h2 className={`font-bold text-xl font-inter mt-3 mb-2 ${darkTheme ? "text-white" : "text-slate-800"}`}>
            Create New Interview
          </h2>
          <p className={`text-sm font-medium tracking-tight font-inter leading-relaxed ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
            Create AI interviews for your candidates and get interview results, insights and more in minutes.
          </p>
          <Button
            onClick={() => handleProClick("/dashboard/create-interview")}
            disabled={!hasCredits && !isAdmin}
            className={`py-2.5 px-5 text-sm tracking-tight cursor-pointer font-inter font-semibold w-full mt-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 ${hasCredits || isAdmin
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              : "bg-gradient-to-r from-slate-400 to-slate-500 text-white cursor-not-allowed opacity-60"
              }`}
          >
            Create Interview <LuCircleFadingPlus className="text-lg" />
          </Button>
        </div>
      </div>
      {/* Second Card - Check Resume */}
      <div
        className={`group ${darkTheme ? "bg-slate-900 text-white" : "bg-gradient-to-br from-white via-white to-purple-50/50 text-black"
          } py-5 px-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-100/30 relative overflow-hidden`}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <LuBookText className="text-2xl text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-3 py-1.5 text-xs tracking-tight font-bold font-inter rounded-full flex items-center gap-1.5 shadow-md">
              Pro <LuStar className="text-white text-sm" />
            </span>
          </div>
          <h2 className={`font-bold text-xl font-inter mt-3 mb-2 ${darkTheme ? "text-white" : "text-slate-800"}`}>
            Check Submitted Resume
          </h2>
          <p className={`text-sm font-medium tracking-tight font-inter leading-relaxed ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
            See all the resume submitted by candidates during interviews in one place.
          </p>
          <Button
            onClick={() => handleProClick("/scheduled")}
            disabled={!hasCredits && !isAdmin}
            className={`py-2.5 px-5 text-sm tracking-tight font-inter font-semibold w-full mt-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 ${hasCredits || isAdmin
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                : "bg-gradient-to-r from-slate-400 to-slate-500 text-white cursor-not-allowed opacity-60"
              }`}
          >
            Check Resume <LuSearch className="text-lg" />
          </Button>
        </div>
      </div>
      {/* Third Card - Send Mails */}
      <div
        className={`group ${darkTheme ? "bg-slate-900 text-white" : "bg-gradient-to-br from-white via-white to-pink-50/50 text-black"
          } py-5 px-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100/30 relative overflow-hidden`}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <LuMessageSquareMore className="text-2xl text-white" />
            </div>
          </div>
          <h2 className={`font-bold text-xl font-inter mt-3 mb-2 ${darkTheme ? "text-white" : "text-slate-800"}`}>
            Send Mails to Candidates
          </h2>
          <p className={`text-sm font-medium tracking-tight font-inter leading-relaxed ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
            Send custom emails to candidates and browse all your mails in one place.
          </p>
          <Link href="/dashboard/send-mail">
            <Button
              className="py-2.5 px-5 text-sm tracking-tight font-inter font-semibold w-full mt-5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              Send Mails <LuMailPlus className="text-lg" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashBoardOptions;
