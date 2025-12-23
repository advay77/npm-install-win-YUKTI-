/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useUserData } from "@/context/UserDetailContext";
import { useTheme } from "@/context/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { LuUser, LuMail, LuBuilding2, LuSave, LuLoader } from "react-icons/lu";
import Image from "next/image";

const ProfilePage = () => {
    const { users, setUsers } = useUserData();
    const { darkTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: users?.[0]?.name || "",
        email: users?.[0]?.email || "",
        organization: users?.[0]?.organization || "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("users")
                .update({
                    name: formData.name,
                    organization: formData.organization,
                })
                .eq("email", users?.[0]?.email)
                .select();

            if (error) throw error;

            // Update local state
            if (data && users) {
                setUsers([{ ...users[0], ...data[0] }]);
            }

            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`w-full min-h-screen p-6 ${!darkTheme
                ? "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50"
                : "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
                } relative overflow-hidden`}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.12),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.08),transparent_30%)]" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div
                            className={`h-12 w-1.5 rounded-full shadow-lg ${darkTheme
                                ? "bg-gradient-to-b from-blue-400 via-indigo-400 to-purple-500"
                                : "bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600"
                                }`}
                        ></div>
                        <div>
                            <h2
                                className={`font-bold text-3xl md:text-4xl font-sora tracking-tight ${darkTheme
                                    ? "bg-gradient-to-r from-white via-white to-slate-50 text-transparent bg-clip-text"
                                    : "bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-transparent bg-clip-text"
                                    }`}
                            >
                                Profile Settings
                            </h2>
                            <p className={`${darkTheme ? "text-slate-400" : "text-slate-600"} text-sm mt-1`}>Review your identity, plan, and organization details.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.12em] ${darkTheme ? "bg-slate-800/70 text-slate-200 border border-slate-700" : "bg-white text-slate-700 border border-blue-100 shadow-sm"}`}>
                            Status: Active
                        </div>
                        <div className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.12em] ${darkTheme ? "bg-blue-500/10 text-blue-200 border border-blue-500/40" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                            Credits: {users?.[0]?.credits || 0}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                    {/* Profile Card */}
                    <Card
                        className={`${darkTheme
                            ? "bg-slate-900/70 border-slate-800 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.45)] backdrop-blur"
                            : "bg-white border-blue-100 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.25)]"
                            } overflow-hidden relative pt-0`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5" />
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

                        <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-[-6px] rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 blur-md opacity-60" />
                                    <Image
                                        src={users?.[0]?.picture || "/avatar.png"}
                                        alt="profile"
                                        width={104}
                                        height={104}
                                        className="relative rounded-full border-4 border-white/10 shadow-xl object-cover"
                                    />
                                    <div className="absolute bottom-2 right-1 w-4 h-4 bg-green-400 rounded-full border-4 border-slate-900 shadow-sm" />
                                </div>
                                <div>
                                    <CardTitle
                                        className={`text-2xl font-bold font-sora mb-1 ${darkTheme ? "text-white" : "text-slate-900"
                                            }`}
                                    >
                                        {users?.[0]?.name}
                                    </CardTitle>
                                    <p
                                        className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-600"
                                            }`}
                                    >
                                        {users?.[0]?.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-200 border border-blue-500/30">Recruiter</span>
                                        <span className={`${darkTheme ? "text-slate-400" : "text-slate-500"} text-xs`}>Org: {formData.organization || "Not set"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 relative z-10">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className={`flex items-center gap-2 text-sm font-semibold ${darkTheme ? "text-slate-200" : "text-slate-700"
                                        }`}
                                >
                                    <LuUser className="text-blue-500" />
                                    Full Name
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`${darkTheme
                                        ? "bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                                        : "bg-white border-blue-100 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                        } transition-all shadow-inner`}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            {/* Email Field (Read-only) */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className={`flex items-center gap-2 text-sm font-semibold ${darkTheme ? "text-slate-200" : "text-slate-700"
                                        }`}
                                >
                                    <LuMail className="text-blue-500" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className={`${darkTheme
                                        ? "bg-slate-900/60 border-slate-800 text-slate-500"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                        } cursor-not-allowed`}
                                />
                                <p
                                    className={`text-xs ${darkTheme ? "text-slate-500" : "text-slate-500"
                                        }`}
                                >
                                    Email cannot be changed
                                </p>
                            </div>

                            {/* Organization Field */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="organization"
                                    className={`flex items-center gap-2 text-sm font-semibold ${darkTheme ? "text-slate-200" : "text-slate-700"
                                        }`}
                                >
                                    <LuBuilding2 className="text-blue-500" />
                                    Organization
                                </Label>
                                <Input
                                    id="organization"
                                    name="organization"
                                    type="text"
                                    value={formData.organization}
                                    onChange={handleInputChange}
                                    className={`${darkTheme
                                        ? "bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                                        : "bg-white border-blue-100 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                        } transition-all shadow-inner`}
                                    placeholder="Enter your organization name"
                                />
                            </div>

                            {/* Save Button */}
                            <div className="pt-2">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className={`w-full font-inter font-semibold text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2 ${darkTheme
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <LuLoader className="animate-spin text-lg" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <LuSave className="text-lg" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Info Card */}
                    <div className="space-y-6">
                        <Card
                            className={`${darkTheme
                                ? "bg-slate-900/70 border-slate-800 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.45)] backdrop-blur"
                                : "bg-white border-blue-100 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.25)]"
                                }`}
                        >
                            <CardHeader>
                                <CardTitle
                                    className={`text-xl font-bold font-sora flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"
                                        }`}
                                >
                                    Account Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`${darkTheme ? "bg-slate-800/60 border-slate-800" : "bg-blue-50 border-blue-100"} rounded-lg p-3 border`}>
                                        <p className={`${darkTheme ? "text-slate-400" : "text-slate-600"} text-xs font-semibold uppercase tracking-[0.14em]`}>Credits</p>
                                        <p className={`${darkTheme ? "text-blue-200" : "text-blue-700"} text-2xl font-bold`}>{users?.[0]?.credits || 0}</p>
                                    </div>
                                    <div className={`${darkTheme ? "bg-slate-800/60 border-slate-800" : "bg-emerald-50 border-emerald-100"} rounded-lg p-3 border`}>
                                        <p className={`${darkTheme ? "text-slate-400" : "text-slate-600"} text-xs font-semibold uppercase tracking-[0.14em]`}>Status</p>
                                        <p className="text-emerald-400 text-2xl font-bold">Active</p>
                                    </div>
                                </div>
                                <div className={`${darkTheme ? "text-slate-400" : "text-slate-600"} text-sm leading-relaxed`}>
                                    Keep your profile up to date so candidates and collaborators see accurate details. Changes apply instantly to your dashboard cards.
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className={`${darkTheme
                                ? "bg-slate-900/70 border-slate-800 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.45)] backdrop-blur"
                                : "bg-white border-blue-100 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.25)]"
                                }`}
                        >
                            <CardHeader>
                                <CardTitle
                                    className={`text-xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"
                                        }`}
                                >
                                    Quick Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className={`space-y-3 text-sm ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
                                <div className="flex items-start gap-2">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                                    <p>Use a clear profile photo so interviewees recognize you.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                                    <p>Keep your organization name consistent with your email domain.</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                                    <p>Review credits weekly to avoid interruptions when scheduling.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
