"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useUserData } from "@/context/UserDetailContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { useTheme } from "@/context/ThemeProvider";
import {
    Boxes as LuBoxes,
    User as LuUser,
    Mail as LuMail,
    CheckCircle2 as LuCheckCircle2,
    XCircle as LuXCircle,
    Clock as LuClock,
    ChevronRight as LuChevronRight,
    MoreVertical as LuMoreVertical,
    Search as LuSearch,
    Filter as LuFilter,
    AlertTriangle as LuAlertTriangle,
    TrendingUp as LuTrendingUp,
    Target as LuTarget,
    Zap as LuZap,
    ShieldAlert as LuShieldAlert,
    MessageSquare as LuMessageSquare
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const PIPELINE_STAGES = [
    { id: "invited", label: "Invited", color: "bg-blue-500", icon: LuMail, chartColor: "#3b82f6" },
    { id: "in-progress", label: "In Progress", color: "bg-amber-500", icon: LuClock, chartColor: "#f59e0b" },
    { id: "pending", label: "Evaluation Pending", color: "bg-purple-500", icon: LuBoxes, chartColor: "#8b5cf6" },
    { id: "shortlisted", label: "Shortlisted", color: "bg-emerald-500", icon: LuCheckCircle2, chartColor: "#10b981" },
    { id: "rejected", label: "Rejected", color: "bg-red-500", icon: LuXCircle, chartColor: "#ef4444" },
];

const PipelinePage = () => {
    const { users } = useUserData();
    const { darkTheme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCommentCand, setActiveCommentCand] = useState<any>(null);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (users?.[0]?.email) {
            fetchCandidates();
        }
    }, [users]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            // Fetch interviews created by this recruiter
            const { data: interviews, error: intError } = await supabase
                .from("interviews")
                .select("interview_id, jobTitle")
                .eq("userEmail", users?.[0].email);

            if (intError) throw intError;

            const interviewIds = interviews.map(i => i.interview_id);
            if (interviewIds.length === 0) {
                setCandidates([]);
                return;
            }

            // Fetch candidate results for these interviews
            const { data: details, error: detError } = await supabase
                .from("interview-details")
                .select("*")
                .in("interview_id", interviewIds)
                .order("created_at", { ascending: false });

            if (detError) throw detError;

            // Map candidates to their respective job titles
            const mappedCandidates = details.map(cand => ({
                ...cand,
                jobTitle: interviews.find(i => i.interview_id === cand.interview_id)?.jobTitle || "Unknown Role"
            }));

            setCandidates(mappedCandidates);
        } catch (err) {
            console.error("Pipeline Fetch Error:", err);
            toast.error("Failed to load candidate pipeline");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("interview-details")
                .update({ recomended: newStatus === "shortlisted" ? "Yes" : "No" })
                .eq("id", id);

            if (error) throw error;

            setCandidates(prev => prev.map(c => c.id === id ? { ...c, recomended: newStatus === "shortlisted" ? "Yes" : "No" } : c));
            toast.success(`Candidate ${newStatus} successfully`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const addComment = async () => {
        if (!newComment.trim() || !activeCommentCand) return;

        try {
            const existingComments = activeCommentCand.feedback?.metadata?.comments || [];
            const updatedComments = [
                ...existingComments,
                {
                    user: users?.[0].name || "HR",
                    text: newComment,
                    date: new Date().toISOString()
                }
            ];

            const updatedFeedback = {
                ...activeCommentCand.feedback,
                metadata: {
                    ...activeCommentCand.feedback?.metadata,
                    comments: updatedComments
                }
            };

            const { error } = await supabase
                .from("interview-details")
                .update({ feedback: updatedFeedback })
                .eq("id", activeCommentCand.id);

            if (error) throw error;

            setCandidates(prev => prev.map(c => c.id === activeCommentCand.id ? { ...c, feedback: updatedFeedback } : c));
            setActiveCommentCand({ ...activeCommentCand, feedback: updatedFeedback });
            setNewComment("");
            toast.success("Comment added");
        } catch (err) {
            toast.error("Failed to add comment");
        }
    };

    // Sophisticated mapping to pipeline stages
    const getCandidateStage = (cand: any) => {
        if (cand.recomended === "Yes") return "shortlisted";
        if (cand.recomended === "No") return "rejected";

        const hasFeedback = cand.feedback?.data?.feedback?.rating;
        if (hasFeedback) return "pending";

        return "in-progress";
    };

    const groupedCandidates = useMemo(() => {
        const groups: Record<string, any[]> = {
            "invited": [],
            "in-progress": [],
            "pending": [],
            "shortlisted": [],
            "rejected": [],
        };

        candidates.forEach(cand => {
            if (searchQuery && !cand.userName.toLowerCase().includes(searchQuery.toLowerCase())) return;
            const stage = getCandidateStage(cand);
            if (groups[stage]) groups[stage].push(cand);
            else groups["pending"].push(cand); // Fallback
        });

        return groups;
    }, [candidates, searchQuery]);

    const funnelData = useMemo(() => {
        return PIPELINE_STAGES.map(stage => ({
            name: stage.label,
            value: (groupedCandidates as any)[stage.id]?.length || 0,
            color: stage.chartColor
        }));
    }, [groupedCandidates]);

    const getColorForScore = (score: number) => {
        if (score < 5) return "text-red-500";
        if (score < 7) return "text-amber-500";
        return "text-emerald-500";
    };

    return (
        <div className={`flex flex-col flex-1 overflow-x-hidden ${darkTheme ? "bg-[#0c0f1d] text-white" : "bg-slate-50 text-slate-900"} font-inter`}>
            {/* Header Area */}
            <header className={`sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-all duration-300 ${darkTheme ? "bg-[#0c0f1d]/90 border-white/5" : "bg-white/95 border-slate-200"}`}>
                <div className="mx-auto px-4 md:px-8 py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10`}>
                                <LuBoxes className="text-white text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black font-sora tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-400 bg-clip-text text-transparent">
                                    Candidate Pipeline
                                </h1>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
                                        Live Recruitment Intelligence Hub
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-3">
                            <div className="relative group w-full md:w-80">
                                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-hover:text-blue-500" />
                                <input
                                    type="text"
                                    placeholder="Scout candidates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-11 pr-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all outline-none border ${darkTheme
                                        ? "bg-white/5 border-white/10 focus:bg-white/10 focus:border-blue-500/50 text-white"
                                        : "bg-slate-100 border-slate-200 focus:bg-white focus:border-blue-500 text-slate-700 shadow-sm"
                                        }`}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className={`h-11 w-11 p-0 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${darkTheme ? "bg-white/5 border-white/10 hover:border-blue-500/50" : "bg-white border-slate-200"}`}
                            >
                                <LuFilter className="w-4 h-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 md:px-8 py-8 space-y-10">
                {/* Board Analytics Snapshot */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[
                        {
                            label: "Total Conversion",
                            value: `${candidates.length > 0 ? ((groupedCandidates.shortlisted.length / candidates.length) * 100).toFixed(0) : 0}%`,
                            trend: "Elite Accuracy",
                            icon: LuTarget,
                            color: "text-emerald-500",
                            bg: "bg-emerald-500/10"
                        },
                        {
                            label: "AI Veracity Score",
                            value: candidates.length > 0 ? (candidates.reduce((acc, curr) => {
                                const ratings = curr.feedback?.data?.feedback?.rating;
                                if (!ratings) return acc;
                                const vals = Object.values(ratings) as number[];
                                return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
                            }, 0) / candidates.filter(c => c.feedback?.data?.feedback?.rating).length || 0).toFixed(1) : "0.0",
                            trend: "System Verified",
                            icon: LuTrendingUp,
                            color: "text-blue-500",
                            bg: "bg-blue-500/10"
                        },
                        {
                            label: "Elite Talent",
                            value: candidates.filter(c => {
                                const ratings = c.feedback?.data?.feedback?.rating;
                                if (!ratings) return false;
                                const vals = Object.values(ratings) as number[];
                                return (vals.reduce((a, b) => a + b, 0) / vals.length) >= 8.5;
                            }).length,
                            trend: "Top 5% Identified",
                            icon: LuZap,
                            color: "text-amber-500",
                            bg: "bg-amber-500/10"
                        },
                        {
                            label: "Proctor Flags",
                            value: candidates.filter(c => c.feedback?.metadata?.warning_count > 0).length,
                            trend: "Critical Risks",
                            icon: LuShieldAlert,
                            color: "text-red-500",
                            bg: "bg-red-500/10"
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                        >
                            <Card className={`p-4 md:p-6 rounded-[28px] border-none shadow-sm flex items-center gap-4 transition-all hover:scale-[1.02] ${darkTheme ? "bg-slate-900/60" : "bg-white border-slate-200"}`}>
                                <div className={`h-11 w-11 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.15em] truncate ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
                                        {stat.label}
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-xl md:text-2xl font-black font-sora tracking-tighter">{stat.value}</h3>
                                        <span className={`text-[8px] font-black uppercase hidden sm:inline-block ${stat.color} opacity-80`}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Recruiting Funnel Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className={`p-8 rounded-[40px] border relative overflow-hidden group ${darkTheme ? "bg-slate-900/40 border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50"}`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] -ml-32 -mb-32 rounded-full" />

                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-2 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                                <h2 className="text-xl font-black font-sora tracking-tight">Hiring Velocity</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Live</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${darkTheme ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                                    Pipeline Analytics
                                </div>
                            </div>
                        </div>

                        <div className="h-[220px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} layout="vertical" barSize={40} margin={{ left: 140, right: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: '700', fill: darkTheme ? '#64748b' : '#475569' }}
                                        width={140}
                                    />
                                    <Tooltip
                                        cursor={{ fill: darkTheme ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{
                                            backgroundColor: darkTheme ? '#0f172a' : '#ffffff',
                                            borderRadius: '24px',
                                            border: 'none',
                                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                                            padding: '16px'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                                        {funnelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </motion.div>

                {/* Main Pipeline Board */}
                <div className="relative mt-8 px-4 md:px-8">
                    <div className="flex gap-6 overflow-x-auto pb-12 pt-2 snap-x scroll-smooth no-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {PIPELINE_STAGES.map((stage, sIdx) => (
                                <motion.div
                                    key={stage.id}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (sIdx * 0.1) }}
                                    className="flex-shrink-0 w-[280px] md:w-[320px] snap-start flex flex-col gap-4"
                                >
                                    {/* Stage Title */}
                                    <div className="flex items-center justify-between px-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`h-2.5 w-2.5 rounded-full ${stage.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                                            <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
                                                {stage.label}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${darkTheme ? "bg-white/5 text-slate-500" : "bg-white text-slate-400 border border-slate-100 shadow-sm"}`}>
                                                {groupedCandidates[stage.id]?.length || 0}
                                            </span>
                                        </div>
                                        <LuMoreVertical className="w-4 h-4 text-slate-500 opacity-50 cursor-pointer" />
                                    </div>

                                    {/* Stage Column Body */}
                                    <div className={`flex-1 rounded-[32px] p-3 min-h-[600px] transition-all duration-500 border overflow-y-auto no-scrollbar ${darkTheme
                                        ? "bg-slate-900/30 border-white/5 shadow-inner"
                                        : "bg-slate-100/50 border-slate-200/50 shadow-inner"
                                        }`}>
                                        <div className="space-y-3">
                                            <AnimatePresence>
                                                {groupedCandidates[stage.id]?.map((cand, idx) => {
                                                    const ratings = cand.feedback?.data?.feedback?.rating;
                                                    let score = 0;
                                                    if (ratings) {
                                                        const vals = Object.values(ratings) as number[];
                                                        score = vals.reduce((a, b) => a + b, 0) / vals.length;
                                                    }

                                                    return (
                                                        <motion.div
                                                            key={cand.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <Link
                                                                href={`/scheduled/${cand.interview_id}/details`}
                                                                className="block"
                                                            >
                                                                <Card className={`group relative p-5 rounded-[28px] border-2 transition-all duration-300 overflow-hidden ${darkTheme
                                                                    ? "bg-slate-900/80 border-white/5 hover:border-blue-500/40 hover:bg-slate-800 focus-within:ring-2 ring-blue-500/20"
                                                                    : "bg-white border-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10"
                                                                    }`}>
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="relative shrink-0">
                                                                            <div className="w-12 h-12 relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg">
                                                                                <Image
                                                                                    src="/profile.png"
                                                                                    alt={cand.userName}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                />
                                                                            </div>
                                                                            <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] ${darkTheme ? "border-slate-800" : "border-white"} ${stage.color} shadow-lg`} />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between mb-1">
                                                                                <h4 className="text-[15px] font-black truncate tracking-tight capitalize leading-none pt-0.5">
                                                                                    {cand.userName}
                                                                                </h4>
                                                                                <motion.div
                                                                                    whileHover={{ x: 3 }}
                                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                >
                                                                                    <LuChevronRight className="text-blue-500 w-4 h-4" />
                                                                                </motion.div>
                                                                            </div>

                                                                            <p className="text-[11px] font-bold text-slate-500 truncate mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                                                                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                                                                {cand.jobTitle}
                                                                            </p>

                                                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                                                {score >= 8.5 && (
                                                                                    <div className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1">
                                                                                        <LuZap className="w-2.5 h-2.5" />
                                                                                        FAST-TRACK
                                                                                    </div>
                                                                                )}
                                                                                {score > 0 && (
                                                                                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 ${score >= 7
                                                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                                                        : score >= 5
                                                                                            ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                                                            : "bg-red-500/10 border-red-500/20 text-red-500"
                                                                                        }`}>
                                                                                        {score.toFixed(1)} <span className="text-[8px] opacity-60">SCORE</span>
                                                                                    </div>
                                                                                )}
                                                                                {cand.feedback?.metadata?.warning_count > 0 && (
                                                                                    <div className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-red-600 border border-red-400/50 text-white flex items-center gap-1 shadow-lg shadow-red-500/20 animate-pulse">
                                                                                        <LuShieldAlert className="w-2.5 h-2.5" />
                                                                                        {cand.feedback.metadata.warning_count} VIOLATIONS
                                                                                    </div>
                                                                                )}
                                                                                {cand.feedback?.metadata?.comments?.length > 0 && (
                                                                                    <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${darkTheme ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                                                                                        <LuMessageSquare className="w-2.5 h-2.5" />
                                                                                        {cand.feedback.metadata.comments.length}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center justify-between mt-auto">
                                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${darkTheme ? "text-slate-600" : "text-slate-400"}`}>
                                                                                    {new Date(cand.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                                </span>

                                                                                <button
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveCommentCand(cand); }}
                                                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all ${darkTheme
                                                                                        ? "bg-slate-800 hover:bg-slate-700 text-white"
                                                                                        : "bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-600 shadow-sm"
                                                                                        }`}
                                                                                >
                                                                                    <LuMessageSquare className="w-3 h-3" />
                                                                                    NOTE
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {cand.feedback?.metadata?.warning_count > 0 && (
                                                                        <div className={`mt-3 pt-3 border-t ${darkTheme ? "border-white/5" : "border-slate-100"}`}>
                                                                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                                                {['Tab Switch', 'Face Hidden', 'Secondary Device'].map((marker, mIdx) => (
                                                                                    <span
                                                                                        key={mIdx}
                                                                                        className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${darkTheme ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600"
                                                                                            }`}
                                                                                    >
                                                                                        {marker}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Stage Specific Actions */}
                                                                    {stage.id === "pending" && (
                                                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-dashed border-slate-700/20">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="h-9 px-2 text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-500 rounded-2xl border border-red-500/20"
                                                                                onClick={(e) => { e.preventDefault(); updateStatus(cand.id, "rejected"); }}
                                                                            >
                                                                                Reject
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-9 px-2 text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20"
                                                                                onClick={(e) => { e.preventDefault(); updateStatus(cand.id, "shortlisted"); }}
                                                                            >
                                                                                Shortlist
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </Card>
                                                            </Link>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>

                                            {groupedCandidates[stage.id]?.length === 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="py-24 flex flex-col items-center justify-center text-center px-4"
                                                >
                                                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 ${darkTheme ? "bg-slate-800/50" : "bg-white shadow-xl shadow-slate-200"}`}>
                                                        <stage.icon className={`text-2xl ${darkTheme ? "text-slate-700" : "text-slate-200"}`} />
                                                    </div>
                                                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${darkTheme ? "text-slate-600" : "text-slate-400"}`}>
                                                        Workspace Empty
                                                    </p>
                                                    <p className={`text-[10px] font-bold max-w-[150px] leading-relaxed ${darkTheme ? "text-slate-700" : "text-slate-300"}`}>
                                                        No candidates currently in {stage.label} stage
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* Collaboration Hub */}
            <Dialog open={!!activeCommentCand} onOpenChange={(open) => !open && setActiveCommentCand(null)}>
                <DialogContent className={`sm:max-w-[450px] rounded-[32px] overflow-hidden p-0 border-none shadow-[0_32px_80px_rgba(0,0,0,0.4)] ${darkTheme ? "bg-[#0f172a] text-white" : "bg-white text-slate-900"}`}>
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-2xl font-black font-sora tracking-tighter">
                            Collaboration Hub
                        </DialogTitle>
                        <DialogDescription className={`font-bold text-[11px] uppercase tracking-widest ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
                            Internal Intelligence for {activeCommentCand?.userName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-4 space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
                        {(activeCommentCand?.feedback?.metadata?.comments || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${darkTheme ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <LuMessageSquare className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest">No signals</p>
                                <p className="text-[10px] font-bold">Share context with your team</p>
                            </div>
                        ) : (
                            activeCommentCand.feedback.metadata.comments.map((comment: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`p-5 rounded-[24px] ${darkTheme ? "bg-slate-900 border border-white/5" : "bg-slate-50 border border-slate-100"}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-500">
                                                {comment.user.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500">{comment.user}</span>
                                        </div>
                                        <span className={`text-[9px] font-bold ${darkTheme ? "text-slate-600" : "text-slate-400"}`}>
                                            {new Date(comment.date).toLocaleDateString()} · {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[13px] font-medium leading-relaxed opacity-90">{comment.text}</p>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className={`p-8 bg-gradient-to-t ${darkTheme ? "from-slate-950/50 to-transparent border-t border-white/5" : "from-slate-50 to-transparent border-t border-slate-100"}`}>
                        <div className="flex gap-3">
                            <div className="flex-1 relative group">
                                <Input
                                    placeholder="Type a team note..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className={`rounded-2xl h-12 px-5 border-2 transition-all font-bold text-sm ${darkTheme
                                        ? "bg-slate-900 border-white/5 focus:border-blue-500 focus:bg-slate-800"
                                        : "bg-white border-slate-100 focus:border-blue-500"
                                        }`}
                                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    ENTER TO POST
                                </div>
                            </div>
                            <Button
                                onClick={addComment}
                                className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95"
                            >
                                Post
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default PipelinePage;
