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
                } relative`}
        >
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
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
                        Profile Settings
                    </h2>
                </div>

                {/* Profile Card */}
                <Card
                    className={`${darkTheme
                        ? "bg-slate-800 border-slate-700 shadow-xl"
                        : "bg-white border-blue-100 shadow-lg"
                        } overflow-hidden`}
                >
                    {/* Decorative top line */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700" />

                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Image
                                    src={users?.[0]?.picture || "/avatar.png"}
                                    alt="profile"
                                    width={100}
                                    height={100}
                                    className="rounded-full border-4 border-blue-500/30 shadow-lg object-cover"
                                />
                                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-4 border-white shadow-sm"></div>
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
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
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
                                    ? "bg-slate-900 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                    : "bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                    } transition-all`}
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
                                    ? "bg-slate-900/50 border-slate-700 text-slate-400"
                                    : "bg-slate-50 border-slate-200 text-slate-500"
                                    } cursor-not-allowed`}
                            />
                            <p
                                className={`text-xs ${darkTheme ? "text-slate-500" : "text-slate-400"
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
                                    ? "bg-slate-900 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                                    : "bg-white border-blue-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                                    } transition-all`}
                                placeholder="Enter your organization name"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className={`w-full font-inter font-semibold text-white py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 ${darkTheme
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <LuLoader className="animate-spin text-xl" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <LuSave className="text-xl" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Info Card */}
                <Card
                    className={`mt-6 ${darkTheme
                        ? "bg-slate-800 border-slate-700 shadow-xl"
                        : "bg-white border-blue-100 shadow-lg"
                        }`}
                >
                    <CardHeader>
                        <CardTitle
                            className={`text-xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"
                                }`}
                        >
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span
                                className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-600"
                                    }`}
                            >
                                Total Credits
                            </span>
                            <span
                                className={`text-sm font-bold ${darkTheme ? "text-blue-400" : "text-blue-600"
                                    }`}
                            >
                                {users?.[0]?.credits || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span
                                className={`text-sm font-medium ${darkTheme ? "text-slate-400" : "text-slate-600"
                                    }`}
                            >
                                Account Status
                            </span>
                            <span className="text-sm font-bold text-green-500">Active</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
