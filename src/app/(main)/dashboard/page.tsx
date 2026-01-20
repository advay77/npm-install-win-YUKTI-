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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ScreenSizeBlocker from "@/components/ScreenBlocker";
import { useRouter } from "next/navigation";
import OnboardingDialog from "@/components/OnboardingDialog";

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
      className={`w-full h-screen overflow-y-auto overflow-x-hidden ${!darkTheme
        ? "bg-gradient-to-br from-blue-50 via-slate-50 to-slate-50"
        : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        } relative`}
    >
      <div className="flex-1">
        <div className="w-full py-8 px-6 min-h-screen">
          {/* WELCOME BOX */}
          <div className="relative max-w-[900px] mx-auto mb-8">
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 rounded-2xl blur-3xl"></div>

            <div
              className={`rounded-2xl flex items-center justify-between relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border ${darkTheme
                ? "bg-slate-800 border-slate-700 shadow-xl"
                : "bg-gradient-to-br from-white to-blue-50 border-blue-100 shadow-lg"
                }`}
            >
              {/* Decorative gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"></div>

              {/* Subtle overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${darkTheme ? "from-blue-600/10 to-purple-600/10" : "from-blue-500/5 to-purple-500/5"}`} />

              <div className="flex flex-col justify-evenly h-full py-8 px-8 z-10 flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-1.5 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-lg"></div>
                  <h1 className={`font-bold text-3xl md:text-4xl tracking-tight capitalize font-sora ${darkTheme
                    ? "text-white"
                    : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent"
                    }`}>
                    Welcome {users?.[0].name}
                  </h1>
                </div>
                <p className={`font-inter text-base font-medium max-w-[480px] leading-relaxed ${darkTheme ? "text-slate-300" : "text-slate-700"
                  }`}>
                  Welcome to your dashboard. Check out the recent activity and track who has completed interviews.
                </p>
                <Button
                  onClick={() => router.push("/scheduled")}
                  className={`group py-3 px-7 text-sm tracking-tight font-inter font-semibold w-fit mt-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 ${darkTheme
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    }`}
                >
                  View Activity
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </div>
              <div className="relative mr-6">
                <div className={`absolute inset-0 bg-gradient-to-br blur-2xl rounded-full ${darkTheme
                  ? "from-blue-600/30 to-purple-600/20"
                  : "from-blue-400/30 to-purple-400/20"
                  }`}></div>
                <Image
                  src="/discussion.png"
                  width={220}
                  height={220}
                  alt="welcome"
                  className="object-cover relative z-10 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
          {/* OPTIONS */}
          <DashBoardOptions />

          {/* VIEW RECENT INTERVIEWS BUTTON */}
          <div className="flex justify-center mt-12 mb-12">
            <Button
              onClick={openRecentInterviewsModal}
              className={`group font-inter font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-3 ${darkTheme
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                }`}
            >
              View Recent Interviews
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
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
          </DialogHeader>
          <DasboardRecentInterviews />
        </DialogContent>
      </Dialog>

      <SheetDemo />

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
