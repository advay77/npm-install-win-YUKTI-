"use client";
import SendMailForm from "@/components/SendMailForm";
import { useTheme } from "@/context/ThemeProvider";
import { useEffect } from "react";
import { LuMessageSquareMore, LuStar } from "react-icons/lu";
import { Mail } from "lucide-react";

export default function SendMailPage() {
    const { darkTheme } = useTheme();

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header Section */}
                <div className="mb-4 relative">
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
                                    Send mails to candidates
                                </h1>
                                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-2 py-0.5 text-xs tracking-tight font-bold font-inter rounded-full flex items-center gap-1 shadow-md">
                                    Pro <LuStar className="text-white text-xs" />
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className={`text-sm mt-2 max-w-2xl font-inter leading-relaxed ml-12 ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
                        Reach out with feedback, next steps, or scheduling updates. Your mail will be sent using the configured sender credentials.
                    </p>
                </div>

                {/* Form Card */}
                <div className={`${darkTheme
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                    : "bg-white border border-gray-100/60 shadow-2xl"} rounded-2xl p-6 relative overflow-hidden group hover:shadow-3xl transition-all duration-300`}>
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/6 to-blue-500/6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    {/* Decorative top line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>

                    <div className="relative z-10">
                        <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${darkTheme ? "border-slate-700" : "border-gray-200"}`}>
                            <Mail className={`h-4 w-4 ${darkTheme ? "text-pink-300" : "text-pink-600"}`} />
                            <h2 className={`text-lg font-bold font-sora ${darkTheme ? "text-white" : "text-slate-800"}`}>Compose Message</h2>
                        </div>
                        <SendMailForm defaultSubject="Interview feedback and next steps" />
                    </div>
                </div>
            </div>
        </div>
    );
}
