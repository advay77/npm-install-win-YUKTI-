"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { useUserData } from "@/context/UserDetailContext";
import { useTheme } from "@/context/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { LuFileUp, LuUsers, LuSend, LuLoader, LuTrash2 } from "react-icons/lu";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BulkInviteForm = () => {
    const { darkTheme } = useTheme();
    const { users, setRemainingCredits } = useUserData();
    const [interviews, setInterviews] = useState<any[]>([]);
    const [selectedInterview, setSelectedInterview] = useState<string>("");
    const [loadingInterviews, setLoadingInterviews] = useState(false);
    const [candidates, setCandidates] = useState<{ name: string; email: string }[]>([]);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const userEmail = users?.[0]?.email;
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const isAdmin = userEmail === adminEmail;
    const remainingCredits = users?.[0]?.remainingcredits ?? 0;

    useEffect(() => {
        if (userEmail) {
            fetchInterviews();
        }
    }, [userEmail]);

    const fetchInterviews = async () => {
        setLoadingInterviews(true);
        try {
            const { data, error } = await supabase
                .from("interviews")
                .select("interview_id, jobTitle, interviewType")
                .eq("userEmail", userEmail)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setInterviews(data || []);
        } catch (err) {
            console.error("Error fetching interviews:", err);
            toast.error("Failed to load your interviews.");
        } finally {
            setLoadingInterviews(false);
        }
    };

    // Category and Sub-category state
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");

    const CATEGORIES = [
        { id: "technical", label: "Technical Assessment", subOptions: ["Web Developer", "App Developer", "AI/ML Engineer", "DevOps Engineer", "Other Technical"] },
        { id: "problem_solving", label: "Problem Solving", subOptions: ["DSA Assessment", "Coding Challenge"] },
        { id: "aptitude", label: "Aptitude Round" },
        { id: "logical", label: "Logical Reasoning" },
        { id: "behavioural", label: "Behavioural Round" },
        { id: "hr", label: "HR Assessment" },
    ];

    // Map existing interviews to our specific UI categories
    const getInterviewForSelection = (category: string, subCategory?: string) => {
        const typeQuery = (subCategory || category).toLowerCase();
        return interviews.find(int => {
            const typesStr = (Array.isArray(int.interviewType) ? int.interviewType : []).join(" ").toLowerCase();
            const titleStr = (int.jobTitle || "").toLowerCase();
            return typesStr.includes(typeQuery) || titleStr.includes(typeQuery);
        });
    };

    // Auto-select the interview ID when category/sub-category changes
    useEffect(() => {
        const matchingInt = getInterviewForSelection(selectedCategory, selectedSubCategory);
        if (matchingInt) {
            setSelectedInterview(matchingInt.interview_id);
        } else {
            setSelectedInterview("");
        }
    }, [selectedCategory, selectedSubCategory, interviews]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".csv")) {
            toast.error("Please upload a valid .csv file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
            if (lines.length < 2) {
                toast.error("CSV file is empty or missing data rows.");
                return;
            }

            const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
            const nameIdx = headers.indexOf("name");
            const emailIdx = headers.indexOf("email");

            if (nameIdx === -1 || emailIdx === -1) {
                toast.error("CSV must contain 'name' and 'email' headers.");
                return;
            }

            const parsedCandidates = lines.slice(1).map((line) => {
                const values = line.split(",");
                return {
                    name: values[nameIdx]?.trim() || "",
                    email: values[emailIdx]?.trim() || "",
                };
            }).filter(c => c.email !== "");

            setCandidates(parsedCandidates);
            toast.success(`Loaded ${parsedCandidates.length} candidates.`);
        };
        reader.readAsText(file);
    };

    const removeCandidate = (index: number) => {
        setCandidates(prev => prev.filter((_, i) => i !== index));
    };

    const handleBulkSend = async () => {
        if (!selectedInterview) {
            toast.error("Please select an interview first.");
            return;
        }
        if (candidates.length === 0) {
            toast.error("Please upload a CSV file with candidates.");
            return;
        }

        // Check credits
        if (!isAdmin && remainingCredits < candidates.length) {
            toast.error(`Insufficient credits. You need ${candidates.length} credits but have only ${remainingCredits}.`);
            return;
        }

        const interview = interviews.find(i => i.interview_id === selectedInterview);
        const jobTitle = interview?.jobTitle || "your upcoming interview";
        const interviewLinkBase = `${window.location.origin}/interview/${selectedInterview}`;

        setSending(true);
        setProgress({ current: 0, total: candidates.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            try {
                const body = `Hi ${candidate.name},

You have been invited for the ${jobTitle} interview at our organization.

Please use the following link to start your AI-powered interview:
${interviewLinkBase}

Requirements:
- Stable internet connection
- Working microphone and camera
- Chrome or Edge browser (desktop version)

Good luck!`;

                await axios.post("/api/send-mail", {
                    to: candidate.email,
                    subject: `Interview Invitation: ${jobTitle}`,
                    body: body,
                    userEmail: userEmail,
                });

                successCount++;
            } catch (err) {
                console.error(`Failed to send mail to ${candidate.email}:`, err);
                failCount++;
            }
            setProgress(prev => ({ ...prev, current: i + 1 }));

            // Update credits locally after each success (matching backend logic)
            if (!isAdmin) {
                setRemainingCredits(prev => (prev != null ? prev - 1 : 0));
            }
        }

        setSending(false);
        if (failCount === 0) {
            toast.success(`Successfully invited all ${successCount} candidates!`);
            setCandidates([]);
        } else {
            toast.warning(`Sent ${successCount} successfully, but ${failCount} failed.`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Step 1: Integrated Selection Panel */}
            <div className="space-y-4">
                <Label className={`text-sm font-semibold font-inter flex items-center gap-2 ${darkTheme ? "text-slate-200" : "text-slate-900"}`}>
                    <LuFileUp className={`h-4 w-4 ${darkTheme ? "text-blue-400" : "text-blue-600"}`} />
                    Select Professional Assessment Link
                </Label>

                {/* Primary Category Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setSelectedCategory(cat.id);
                                setSelectedSubCategory("");
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all duration-200 group relative overflow-hidden ${selectedCategory === cat.id
                                ? (darkTheme ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10" : "border-blue-600 bg-blue-50")
                                : (darkTheme ? "border-slate-800 bg-slate-800/20 hover:border-slate-700" : "border-gray-200 bg-white hover:border-blue-200")}`}
                        >
                            <div className="relative z-10 flex flex-col gap-1">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${selectedCategory === cat.id ? "text-blue-500" : (darkTheme ? "text-slate-500" : "text-slate-400")}`}>Round Type</span>
                                <span className={`text-sm font-bold ${selectedCategory === cat.id ? (darkTheme ? "text-white" : "text-blue-700") : (darkTheme ? "text-slate-300" : "text-slate-700")}`}>{cat.label}</span>
                            </div>
                            {selectedCategory === cat.id && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Conditional Sub-category Selection */}
                {selectedCategory && CATEGORIES.find(c => c.id === selectedCategory)?.subOptions && (
                    <div className={`p-4 rounded-2xl animate-fade-in ${darkTheme ? "bg-slate-900/50 border border-slate-800" : "bg-blue-50/50 border border-blue-100"}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${darkTheme ? "text-slate-500" : "text-slate-500"}`}>Select Specific Specialization</p>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.find(c => c.id === selectedCategory)?.subOptions?.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubCategory(sub)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 ${selectedSubCategory === sub
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                                        : (darkTheme ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300")}`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Final Selection Status */}
                <div className={`px-4 py-3 rounded-xl border flex items-center justify-between ${selectedInterview ? (darkTheme ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-100") : (darkTheme ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")}`}>
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${selectedInterview ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}`}>
                            {selectedInterview ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className={`text-xs font-bold ${selectedInterview ? (darkTheme ? "text-emerald-400" : "text-emerald-700") : (darkTheme ? "text-amber-400" : "text-amber-700")}`}>
                                {selectedInterview ? "Link Ready to Send" : "No Matching Interview Found"}
                            </p>
                            <p className="text-[10px] opacity-60">
                                {selectedInterview ? `Using: ${interviews.find(i => i.interview_id === selectedInterview)?.jobTitle}` : "Create an interview of this type first."}
                            </p>
                        </div>
                    </div>
                    {selectedInterview && (
                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">
                            Ref: {selectedInterview.slice(0, 8)}
                        </div>
                    )}
                </div>
            </div>

            {/* Step 2: Upload CSV */}
            <div className="space-y-2">
                <Label className={`text-sm font-semibold font-inter flex items-center gap-2 ${darkTheme ? "text-slate-200" : "text-slate-900"}`}>
                    <LuUsers className={`h-4 w-4 ${darkTheme ? "text-purple-400" : "text-purple-600"}`} />
                    Upload Candidate CSV
                </Label>
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${darkTheme
                        ? "border-slate-700 bg-slate-800/40 hover:border-blue-500/50"
                        : "border-gray-200 bg-gray-50/50 hover:border-blue-500/50"
                        } relative cursor-pointer group`}
                >
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-3">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${darkTheme ? "bg-slate-700 text-blue-400" : "bg-white text-blue-600 shadow-sm"}`}>
                            <LuFileUp className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <p className={`font-bold text-sm ${darkTheme ? "text-white" : "text-slate-900"}`}>Click or drag CSV here</p>
                            <p className={`text-xs mt-1 ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>File must have "name" and "email" headers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidate List Preview */}
            {candidates.length > 0 && (
                <div className={`rounded-xl border overflow-hidden ${darkTheme ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-white"}`}>
                    <div className={`px-4 py-2 border-b flex justify-between items-center ${darkTheme ? "border-slate-700 bg-slate-800" : "border-gray-100 bg-gray-50"}`}>
                        <span className={`text-xs font-bold uppercase tracking-wider ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
                            Candidate List ({candidates.length})
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCandidates([])} className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10">
                            Clear All
                        </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className={`text-[10px] uppercase font-bold ${darkTheme ? "text-slate-500" : "text-gray-400"}`}>
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className={`text-xs ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                                {candidates.map((c, i) => (
                                    <tr key={i} className={`border-t ${darkTheme ? "border-slate-800 hover:bg-slate-700/50" : "border-gray-50 hover:bg-gray-50/80"}`}>
                                        <td className="px-4 py-2 font-medium">{c.name}</td>
                                        <td className="px-4 py-2">{c.email}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => removeCandidate(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <LuTrash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Send Progress */}
            {sending && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-blue-500">
                        <span>Sending Invites...</span>
                        <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-2 w-full bg-blue-500/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <Button
                onClick={handleBulkSend}
                disabled={sending || candidates.length === 0 || !selectedInterview}
                className={`w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${candidates.length > 0 && selectedInterview && !sending
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/25"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
            >
                {sending ? (
                    <>
                        <LuLoader className="h-5 w-5 animate-spin" /> Batch Processing...
                    </>
                ) : (
                    <>
                        <LuSend className="h-5 w-5" /> Launch Bulk Invites
                    </>
                )}
            </Button>

            {/* Tip Box */}
            <div className={`p-4 rounded-xl border flex gap-3 ${darkTheme ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-700"}`}>
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">How it works</p>
                    <p className="text-xs leading-relaxed opacity-80">
                        Upload a CSV with <strong>name</strong> and <strong>email</strong> columns. Each invite will use 1 credit. Candidates will receive a professional invitation with their unique interview link.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BulkInviteForm;
