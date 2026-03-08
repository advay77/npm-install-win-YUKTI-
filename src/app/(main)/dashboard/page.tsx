/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useRef, useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData } from "@/context/UserDetailContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import DashBoardOptions from "@/components/DashBoardOptions";
import DasboardRecentInterviews from "@/components/DasboardRecentInterviews";
import { SheetDemo } from "@/components/DashBoardRightSlider";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ScreenSizeBlocker from "@/components/ScreenBlocker";
import { useRouter } from "next/navigation";
import OnboardingDialog from "@/components/OnboardingDialog";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { LuVideo, LuUsers, LuActivity, LuShieldCheck, LuZap, LuTrendingUp, LuLayoutGrid, LuSearch, LuArrowRight, LuLayoutDashboard } from "react-icons/lu";

const Page = () => {
  const { darkTheme } = useTheme();
  const { users, loading, isNewUser } = useUserData();
  const router = useRouter();
  const [showRecentInterviewsModal, setShowRecentInterviewsModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(isNewUser || users?.[0]?.organization === "no organization");

  const openRecentInterviewsModal = () => {
    setShowRecentInterviewsModal(true);
  };

  return (
    <div
      className={`flex flex-col flex-1 overflow-x-hidden ${!darkTheme
        ? "bg-slate-50"
        : "bg-[#0c0f1d]"
        } relative font-inter`}
    >
      <div className="flex-1">
        {/* TOP STATUS TICKER */}
        <div className={`w-full py-2 px-6 border-b flex items-center justify-between overflow-hidden relative z-50 ${darkTheme ? "bg-slate-900/50 border-white/5" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>System Online</span>
            </div>
            <div className={`h-3 w-px ${darkTheme ? "bg-slate-800" : "bg-slate-200"}`}></div>
            <div className="flex items-center gap-2">
              <LuShieldCheck className="w-3 h-3 text-blue-500" />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>Verified Assessments</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${darkTheme ? "text-slate-600" : "text-slate-400"}`}>Interview Activity</span>
            <div className="flex items-center gap-1">
              <LuTrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500">+4% this week</span>
            </div>
          </div>
        </div>

        <div className="w-full py-8 md:py-12 px-4 md:px-8 max-w-[1600px] mx-auto">
          {/* PREMIUM HERO SECTION */}
          <div className="relative mb-12">
            {/* Background Decorative Elements */}
            <div className={`absolute -top-32 -left-32 w-[500px] h-[500px] blur-[160px] rounded-full opacity-20 animate-pulse ${darkTheme ? "bg-blue-600" : "bg-blue-300"}`}></div>
            <div className={`absolute -bottom-32 -right-32 w-[500px] h-[500px] blur-[160px] rounded-full opacity-10 ${darkTheme ? "bg-purple-600" : "bg-purple-200"}`}></div>

            <Card
              className={`rounded-[40px] relative overflow-hidden transition-all duration-700 border-none group ${darkTheme
                ? "bg-slate-900/60 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]"
                : "bg-white shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] border border-blue-50"
                }`}
            >
              {/* Animated background highlights */}
              <div className={`absolute top-0 right-0 w-full h-full pointer-events-none opacity-30 ${darkTheme ? "mix-blend-lighten" : "mix-blend-multiply"}`}>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[70%] rounded-full bg-purple-500/10 blur-[100px] animate-pulse delay-1000" />
              </div>

              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

              <div className="flex flex-col lg:flex-row items-center gap-12 p-8 md:p-14 relative z-10">
                <div className="flex-1 text-center md:text-left space-y-7">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-4 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-600 text-[11px] font-bold uppercase tracking-wider"
                  >
                    Recruiter Workspace
                  </motion.div>

                  <h1 className={`font-bold text-4xl md:text-6xl tracking-tight leading-[1.1] font-sora ${darkTheme
                    ? "text-white"
                    : "text-slate-900"
                    }`}>
                    Streamline Your <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Hiring Process</span>
                  </h1>

                  <p className={`font-inter text-lg font-medium max-w-[600px] leading-relaxed ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Welcome back, <span className="text-blue-600 font-bold">{users?.[0]?.name?.split(' ')[0]}</span>. Manage your interviews and candidates in one simple place.
                  </p>

                  <div className="flex flex-wrap items-center gap-5 justify-center md:justify-start pt-4">
                    <Button
                      onClick={() => router.push("/scheduled")}
                      className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)]"
                    >
                      View Live Reports
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openRecentInterviewsModal}
                      className={`h-14 px-10 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${darkTheme ? "border-white/5 bg-white/5 hover:bg-white/10 text-white" : "border-slate-100 bg-slate-50/50 hover:bg-slate-100 text-slate-700"}`}
                    >
                      Scout Activity
                    </Button>
                  </div>
                </div>

                <div className="relative group perspective-1000 w-full lg:w-auto flex justify-center lg:block">
                  <div className={`absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full scale-125 group-hover:bg-indigo-500/30 transition-all duration-1000`}></div>
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className={`relative z-10 p-2 rounded-[48px] ${darkTheme ? "bg-slate-950/40 border-white/5 shadow-2xl" : "bg-white/40 border-white shadow-xl"} border-2 backdrop-blur-md overflow-hidden`}
                  >
                    <Image
                      src="/discussion.png"
                      width={400}
                      height={400}
                      alt="hiring hero"
                      priority
                      className="object-cover drop-shadow-2xl brightness-110 contrast-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none"></div>
                  </motion.div>
                </div>
              </div>
            </Card>
          </div>

          {/* BESPOKE STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Remaining Credits", value: users?.[0]?.remainingcredits ?? 0, trend: "Standard Plan", icon: LuZap, color: "text-blue-600", bg: "bg-blue-500/5", signal: 75 },
              { label: "Active Interviews", value: "12", trend: "Running", icon: LuActivity, color: "text-indigo-600", bg: "bg-indigo-500/5", signal: 45 },
              { label: "Total Candidates", value: "84", trend: "Processed", icon: LuUsers, color: "text-emerald-600", bg: "bg-emerald-500/5", signal: 92 },
              { label: "Accuracy Rate", value: "98%", trend: "AI Verified", icon: LuShieldCheck, color: "text-slate-600", bg: "bg-slate-500/5", signal: 98 },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Card className={`p-6 rounded-[32px] border-none shadow-sm flex flex-col gap-5 transition-all hover:scale-[1.02] relative overflow-hidden group ${darkTheme ? "bg-slate-900/60" : "bg-white border-slate-100"}`}>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>{stat.label}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl font-black font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>{stat.value}</h3>
                        <span className={`text-[8px] font-black uppercase hidden sm:block ${stat.color} opacity-80`}>{stat.trend}</span>
                      </div>
                    </div>
                  </div>

                  {/* Micro-Progress Signal */}
                  <div className="w-full h-1 bg-slate-500/10 rounded-full overflow-hidden relative z-10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.signal}%` }}
                      transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                      className={`h-full rounded-full opacity-60 ${stat.color.replace('text-', 'bg-')}`}
                    />
                  </div>

                  {/* Subtle background glow */}
                  <div className={`absolute -right-4 -bottom-4 w-20 h-20 blur-3xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${stat.bg.replace('/10', '')}`} />
                </Card>
              </motion.div>
            ))}
          </div>

          {/* INTERACTIVE SHORTCUTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => router.push("/pipeline")}
              className={`p-10 rounded-[48px] border cursor-pointer group relative overflow-hidden transition-all duration-500 ${darkTheme ? "bg-slate-900 border-white/5 hover:border-blue-500/50 shadow-2xl shadow-blue-500/5" : "bg-white border-blue-100 hover:border-blue-400 shadow-xl shadow-blue-500/5"}`}
            >
              <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-[24px] bg-blue-500/10 flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform duration-500 shadow-inner">🚀</div>
                  <h3 className={`text-2xl font-bold font-sora tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>Candidate Pipeline</h3>
                  <p className={`text-sm font-medium leading-relaxed ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    View and manage all your candidates. Track their progress through different stages of the interview process.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-500 font-black text-[11px] uppercase tracking-widest">
                    Enter Orchestration Hub <LuArrowRight className="group-hover:translate-x-2 transition-transform duration-500" />
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className={`w-6 h-6 rounded-full border-2 ${darkTheme ? "border-slate-900 bg-slate-800" : "border-white bg-slate-200"}`}></div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px] font-black text-blue-500 border-2 border-transparent">+12</div>
                  </div>
                </div>
              </div>
              <div className={`absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-all duration-1000 group-hover:opacity-20 ${darkTheme ? "bg-blue-600" : "bg-blue-400"}`}></div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => router.push("/analytics")}
              className={`p-10 rounded-[48px] border cursor-pointer group relative overflow-hidden transition-all duration-500 ${darkTheme ? "bg-slate-900 border-white/5 hover:border-purple-500/50 shadow-2xl shadow-purple-500/5" : "bg-white border-purple-100 hover:border-purple-400 shadow-xl shadow-purple-500/5"}`}
            >
              <div className="flex flex-col h-full justify-between gap-8 relative z-10">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-[24px] bg-purple-500/10 flex items-center justify-center text-3xl group-hover:-rotate-12 transition-transform duration-500 shadow-inner">📊</div>
                  <h3 className={`text-2xl font-bold font-sora tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>Interview Insights</h3>
                  <p className={`text-sm font-medium leading-relaxed ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
                    Detailed analysis of candidate performance. Understand their technical skills and behavior through AI-generated reports.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-500 font-black text-[11px] uppercase tracking-widest">
                    Access Data Fabric <LuArrowRight className="group-hover:translate-x-2 transition-transform duration-500" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${darkTheme ? "bg-white/5 text-purple-400" : "bg-purple-50 text-purple-500"}`}>
                    Smart Signals Active
                  </div>
                </div>
              </div>
              <div className={`absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-all duration-1000 group-hover:opacity-20 ${darkTheme ? "bg-purple-600" : "bg-purple-400"}`}></div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <h2 className={`text-3xl font-black font-sora tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>Core Modules</h2>
            <div className={`flex-1 h-px ${darkTheme ? "bg-white/5" : "bg-slate-100"}`}></div>
          </div>

          {/* OPTIONS */}
          <DashBoardOptions />

          {/* PLATFORM HIGHLIGHTS - AI Report Preview only */}
          <div className="mt-20 pb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`p-8 md:p-14 rounded-[56px] border-none relative overflow-hidden group ${darkTheme ? "bg-[#161b33] shadow-[0_32px_120px_rgba(0,0,0,0.5)]" : "bg-blue-600 shadow-[0_32px_120px_rgba(37,99,235,0.25)]"}`}
            >
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-400/20 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 space-y-8 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                    Live Performance Auditor
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black font-sora text-white leading-[1.05] tracking-tighter">
                    Instant AI <br />
                    <span className="opacity-50 text-white font-black">Performance Reports</span>
                  </h2>
                  <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-[500px]">
                    Stop manual reviewing. Our proprietary neural engine analyzes thousands of data points to generate comprehensive veracity reports in milliseconds.
                  </p>
                  <Button
                    onClick={() => router.push("/scheduled")}
                    className="h-14 px-10 rounded-2xl bg-white text-blue-600 hover:bg-slate-50 font-black text-xs uppercase tracking-widest transition-all shadow-2xl hover:scale-105 active:scale-95"
                  >
                    Experience Intelligence Hub
                  </Button>
                </div>

                <div className="flex-1 w-full max-w-[550px] aspect-[4/3] rounded-[48px] bg-slate-950/60 border-2 border-white/10 backdrop-blur-3xl p-8 overflow-hidden shadow-[0_64px_120px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-[1.01] duration-1000 relative">
                  {/* Scanning Animation */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan z-20"></div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                        <LuTrendingUp className="text-blue-400 w-7 h-7" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-2.5 w-32 bg-white/20 rounded-full"></div>
                        <div className="h-2 w-20 bg-white/10 rounded-full"></div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-[9px] text-emerald-400 font-black uppercase tracking-widest">
                          Elite Score: 94%
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold mt-1 animate-pulse">VERIFIED</span>
                      </div>
                    </div>

                    <div className={`h-px w-full ${darkTheme ? "bg-white/5" : "bg-white/10"}`}></div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3 p-5 rounded-[24px] bg-white/5 border border-white/5 transition-colors group-hover:bg-white/10">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Technical</span>
                          <span className="text-xs font-bold text-white">88%</span>
                        </div>
                        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "88%" }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                          />
                        </div>
                      </div>
                      <div className="space-y-3 p-5 rounded-[24px] bg-white/5 border border-white/5 transition-colors group-hover:bg-white/10">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Cognitive</span>
                          <span className="text-xs font-bold text-white">92%</span>
                        </div>
                        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "92%" }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <div className="h-2.5 w-full bg-white/10 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <div className="h-2.5 w-[90%] bg-white/10 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <div className="h-2.5 w-[75%] bg-white/10 rounded-full"></div>
                      </div>
                    </div>

                    <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* MODAL FOR RECENT INTERVIEWS */}
      <Dialog open={showRecentInterviewsModal} onOpenChange={setShowRecentInterviewsModal}>
        <DialogContent className={`sm:max-w-[80vw] w-[98vw] h-[80vh] overflow-y-auto p-6 rounded-2xl ${darkTheme
          ? "bg-slate-900 border-slate-700 [&>button]:text-slate-300 [&>button]:hover:text-white"
          : "bg-white border-slate-200"
          }`}>
          {/* Accessibility: provide an invisible title for screen readers */}
          <DialogHeader className="sr-only">
            <DialogTitle>Recent Interviews</DialogTitle>
            <DialogDescription>List of recent interviews attempted by candidates.</DialogDescription>
          </DialogHeader>
          <DasboardRecentInterviews />
        </DialogContent>
      </Dialog>



      <ScreenSizeBlocker />

      {/* Onboarding Dialog for New Users */}
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
    </div>
  );
};

export default Page;
