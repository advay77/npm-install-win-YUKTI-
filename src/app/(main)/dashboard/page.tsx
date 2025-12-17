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

const Page = () => {
  const { darkTheme } = useTheme();
  const { users, loading } = useUserData();
  const router = useRouter();
  const [showRecentInterviewsModal, setShowRecentInterviewsModal] = useState(false);

  const openRecentInterviewsModal = () => {
    setShowRecentInterviewsModal(true);
  };

  return (
    <div
      className={`w-full h-full ${!darkTheme
        ? "bg-gradient-to-br from-blue-50 to-gray-100"
        : "bg-gray-200"
        } relative`}
    >
      <div className="flex-1">
        <div className="w-full py-4 px-6">
          {/* WELCOME BOX */}
          <div className="relative max-w-[900px] mx-auto">
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 rounded-2xl blur-3xl"></div>

            <div
              className={`${darkTheme ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white" : "bg-gradient-to-br from-white via-white to-blue-50/30 text-black"
                } rounded-2xl flex items-center justify-between relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100/20`}
            >
              {/* Decorative gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

              <div className="flex flex-col justify-evenly h-full py-6 px-6 z-10 flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h1 className="font-bold text-3xl tracking-tight capitalize font-sora bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Welcome {users?.[0].name}
                  </h1>
                </div>
                <p className="font-inter text-base font-medium max-w-[450px] text-slate-600 leading-relaxed">
                  Welcome to your dashboard. Check out the recent activity and track who has completed interviews.
                </p>
                <Button className="py-2.5 px-6 text-sm tracking-tight font-inter font-semibold w-fit mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2">
                  View Activity
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </div>
              <div className="relative mr-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl rounded-full"></div>
                <Image
                  src="/discussion.png"
                  width={200}
                  height={200}
                  alt="welcome"
                  className="object-cover relative z-10 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
          {/* OPTIONS */}
          <DashBoardOptions />

          {/* VIEW RECENT INTERVIEWS BUTTON */}
          <div className="flex justify-center mt-10 mb-10">
            <Button
              onClick={openRecentInterviewsModal}
              className="group bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-inter font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
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
        <DialogContent className="sm:max-w-[80vw] w-[98vw] h-[80vh] overflow-y-auto p-6">
          <DasboardRecentInterviews />
        </DialogContent>
      </Dialog>

      <SheetDemo />

      <ScreenSizeBlocker />
    </div>
  );
};

export default Page;
