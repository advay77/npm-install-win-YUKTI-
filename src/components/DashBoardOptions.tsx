"use client";
import React from "react";
import { LuVideo, LuCircleFadingPlus, LuSearch, LuMailPlus, LuStar, LuBookText, LuMessageSquareMore } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData } from "@/context/UserDetailContext";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const DashBoardOptions = () => {
  const { darkTheme } = useTheme();
  const { users } = useUserData();
  const router = useRouter();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const userEmail = users?.[0]?.email;
  const remainingCredits = users?.[0]?.remainingcredits ?? 0;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full group/container">
      {/* First Card - Create Interview */}
      <motion.div
        whileHover={{ y: -8, scale: 1.01 }}
        className={`group relative p-10 rounded-[40px] border transition-all duration-500 overflow-hidden ${darkTheme
          ? "bg-slate-900/40 border-white/5 shadow-2xl hover:bg-slate-900/60"
          : "bg-white border-blue-50 shadow-[0_20px_50px_rgba(37,99,235,0.08)] hover:shadow-[0_40px_80px_rgba(37,99,235,0.12)]"
          }`}
      >
        <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000 ${darkTheme ? "bg-blue-600/10 group-hover:bg-blue-600/20" : "bg-blue-600/5 group-hover:bg-blue-600/10"}`}></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-500/20 transition-all duration-500"
            >
              <LuVideo className="text-3xl text-white" />
            </motion.div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] uppercase font-black tracking-[0.2em]">
              PRO DEPLOY <LuStar className="animate-pulse" />
            </div>
          </div>

          <h3 className={`text-2xl font-bold font-sora leading-tight mb-4 tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>
            Create New <br />
            Interview
          </h3>

          <p className={`text-sm font-medium leading-relaxed mb-10 flex-1 ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Set up a tailored AI interview for any role. Define the skills you want to assess and get started in minutes.
          </p>

          <Button
            onClick={() => handleProClick("/dashboard/create-interview")}
            disabled={!hasCredits && !isAdmin}
            className={`h-14 w-full rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${hasCredits || isAdmin
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:scale-[1.02]"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
          >
            Deploy New Interview
          </Button>
        </div>
      </motion.div>

      {/* Second Card - Analytics */}
      <motion.div
        whileHover={{ y: -8, scale: 1.01 }}
        className={`group relative p-10 rounded-[40px] border transition-all duration-500 overflow-hidden ${darkTheme
          ? "bg-slate-900/40 border-white/5 shadow-2xl hover:bg-slate-900/60"
          : "bg-white border-purple-50 shadow-[0_20px_50px_rgba(147,51,234,0.08)] hover:shadow-[0_40px_80px_rgba(147,51,234,0.12)]"
          }`}
      >
        <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000 ${darkTheme ? "bg-purple-600/10 group-hover:bg-purple-600/20" : "bg-purple-600/5 group-hover:bg-purple-600/10"}`}></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <motion.div
              whileHover={{ rotate: -12, scale: 1.1 }}
              className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-500/20 transition-all duration-500"
            >
              <LuBookText className="text-3xl text-white" />
            </motion.div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[9px] uppercase font-black tracking-[0.2em]">
              INSIGHTS HUB
            </div>
          </div>

          <h3 className={`text-2xl font-bold font-sora leading-tight mb-4 tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>
            Review <br />
            Candidates
          </h3>

          <p className={`text-sm font-medium leading-relaxed mb-10 flex-1 ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Review candidate performance, read transcripts, and see AI-generated summaries to help you make better hiring decisions.
          </p>

          <Button
            onClick={() => handleProClick("/scheduled")}
            className={`h-14 w-full rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20 hover:scale-[1.02] active:scale-95`}
          >
            Open Review Hub
          </Button>
        </div>
      </motion.div>

      {/* Third Card - Communication */}
      <motion.div
        whileHover={{ y: -8, scale: 1.01 }}
        className={`group relative p-10 rounded-[40px] border transition-all duration-500 overflow-hidden ${darkTheme
          ? "bg-slate-900/40 border-white/5 shadow-2xl hover:bg-slate-900/60"
          : "bg-white border-pink-50 shadow-[0_20px_50px_rgba(236,72,153,0.08)] hover:shadow-[0_40px_80px_rgba(236,72,153,0.12)]"
          }`}
      >
        <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000 ${darkTheme ? "bg-pink-600/10 group-hover:bg-pink-600/20" : "bg-pink-600/5 group-hover:bg-pink-600/10"}`}></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-xl shadow-pink-500/20 transition-all duration-500"
            >
              <LuMessageSquareMore className="text-3xl text-white" />
            </motion.div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[9px] uppercase font-black tracking-[0.25em]">
              BETA <LuStar className="animate-pulse" />
            </div>
          </div>

          <h3 className={`text-2xl font-bold font-sora leading-tight mb-4 tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>
            Candidate <br />
            Communication
          </h3>

          <p className={`text-sm font-medium leading-relaxed mb-10 flex-1 ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
            Stay in touch with your candidates. Send follow-up emails and interview links directly from the platform.
          </p>

          <Link href="/dashboard/send-mail" className="w-full">
            <Button
              className={`h-14 w-full rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/20 hover:scale-[1.02] active:scale-95`}
            >
              Launch Outreach
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default DashBoardOptions;
