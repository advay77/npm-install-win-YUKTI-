"use client";
import React from "react";
import { useTheme } from "@/context/ThemeProvider";
import { LuClock } from "react-icons/lu";

const SubscriptionPage = () => {
    const { darkTheme } = useTheme();

    return (
        <div
            className={`w-full h-screen overflow-hidden flex flex-col p-6 ${!darkTheme
                ? "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50"
                : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
                } relative`}
        >
            {/* Header - Left Aligned */}
            <div className="flex items-center gap-4 max-w-[1400px] mx-auto w-full">
                <div
                    className={`h-12 w-1.5 rounded-full shadow-lg ${darkTheme
                        ? "bg-gradient-to-b from-blue-400 via-indigo-400 to-purple-500"
                        : "bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600"
                        }`}
                ></div>
                <h2
                    className={`font-bold text-3xl md:text-4xl font-sora tracking-tight ${darkTheme
                        ? "bg-gradient-to-r from-white via-white to-slate-50 text-transparent bg-clip-text"
                        : "bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-transparent bg-clip-text"
                        }`}
                >
                    Subscription Plans
                </h2>
            </div>

            {/* Coming Soon - Perfectly Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className={`flex flex-col items-center gap-6 ${darkTheme ? "opacity-50" : "opacity-60"}`}>
                    <div className={`p-4 rounded-full ${darkTheme ? "bg-slate-800/30" : "bg-slate-200/40"}`}>
                        <LuClock className={`text-7xl ${darkTheme ? "text-slate-300" : "text-slate-600"}`} />
                    </div>
                    <h3
                        className={`text-3xl md:text-4xl font-bold font-sora tracking-tight ${darkTheme ? "text-slate-300" : "text-slate-600"}`}
                    >
                        Coming Soon
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;
