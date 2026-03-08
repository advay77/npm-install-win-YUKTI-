"use client";
import SendMailForm from "@/components/SendMailForm";
import { useTheme } from "@/context/ThemeProvider";
import { useEffect, useState } from "react";
import { LuMessageSquareMore, LuFileUp, LuUsers, LuSend, LuLoader, LuTrash2 } from "react-icons/lu";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import BulkInviteForm from "@/components/BulkInviteForm";
import { toast } from "sonner";
import axios from "axios";

export default function SendMailPage() {
    const { darkTheme } = useTheme();

    const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual");

    // Lock page scroll while this view is active
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    return (
        <div
            className={`${darkTheme ? "bg-slate-900" : "bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20"} h-screen w-full overflow-hidden`}
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full flex flex-col">
                {/* Header Section */}
                <div className="mb-4 relative shrink-0">
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl blur-3xl -z-10"></div>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md">
                            <LuMessageSquareMore className="text-xl text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-inter font-medium text-pink-600 tracking-wide uppercase">Messaging</p>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold font-sora tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {activeTab === "individual" ? "Send individual mail" : "Bulk candidate invites"}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className={`flex p-1 rounded-xl mb-6 self-start ${darkTheme ? "bg-slate-800/50" : "bg-slate-100"}`}>
                    <button
                        onClick={() => setActiveTab("individual")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "individual"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Individual Mail
                    </button>
                    <button
                        onClick={() => setActiveTab("bulk")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "bulk"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Bulk Invite (CSV)
                    </button>
                </div>

                {/* Form Card */}
                <div className={`${darkTheme
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                    : "bg-white border border-gray-100/60 shadow-2xl"} rounded-2xl p-6 relative overflow-y-auto flex-1 group hover:shadow-3xl transition-all duration-300 min-h-0 custom-scrollbar`}>
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/4 to-blue-500/4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    {/* Decorative top line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shrink-0"></div>

                    <div className="relative z-10">
                        <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${darkTheme ? "border-slate-700" : "border-gray-200"}`}>
                            <Mail className={`h-4 w-4 ${darkTheme ? "text-pink-300" : "text-pink-600"}`} />
                            <h2 className={`text-lg font-bold font-sora ${darkTheme ? "text-white" : "text-slate-800"}`}>
                                {activeTab === "individual" ? "Compose Message" : "Import & Launch"}
                            </h2>
                        </div>
                        {activeTab === "individual" ? (
                            <SendMailForm defaultSubject="Interview feedback and next steps" />
                        ) : (
                            <BulkInviteForm />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
