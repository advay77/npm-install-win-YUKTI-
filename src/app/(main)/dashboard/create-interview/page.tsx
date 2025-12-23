/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { useUserData } from "@/context/UserDetailContext";
import { useTheme } from "@/context/ThemeProvider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import InterviewFormContainer from "@/components/InterviewFormContainer";
import { toast } from "sonner";
import InterviewQuestions from "@/components/InterviewQuestions";
import InterviewLink from "@/components/InterviewLink";

const CreateInterview = () => {
  const { darkTheme } = useTheme();
  const { users } = useUserData();
  const router = useRouter();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const userEmail = users?.[0]?.email;
  const remainingCredits = users?.[0]?.remainingCredits ?? 0;
  const isAdmin = userEmail === adminEmail;

  useEffect(() => {
    // Redirect if not admin and no credits
    if (!isAdmin && remainingCredits <= 0) {
      toast.error("No credits remaining. Please purchase credits to create interviews.");
      router.push("/dashboard");
    }
  }, [isAdmin, remainingCredits, router]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    interviewDuration: "",
    interviewType: [] as string[],
    acceptResume: true,
  });
  const [interviewID, setInterviewID] = useState<string>("");
  const onToggleInterviewType = (type: string) => {
    setFormData((prev) => {
      const isSelected = prev.interviewType.includes(type);
      return {
        ...prev,
        interviewType: isSelected
          ? prev.interviewType.filter((t) => t !== type)
          : [...prev.interviewType, type],
      };
    });
  };

  const onHandleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = () => {
    const { jobTitle, jobDescription, interviewDuration, interviewType } =
      formData;

    if (!jobTitle.trim()) {
      toast.error("Please enter the Job Title.");
      return;
    }

    if (
      jobDescription.trim().length < 50 &&
      jobDescription.trim().length > 800
    ) {
      toast.error("Job Description must be at least 50 characters.");
      return;
    }

    if (!interviewDuration) {
      toast.error("Please select Interview Duration.");
      return;
    }

    if (!interviewType) {
      toast.error("Please select Interview Type.");
      return;
    }

    toast.success("Data Saved Successfully");
    setStep(2);
  };

  const onCreateLink = (interview_id: string) => {
    setInterviewID(interview_id);
    setStep(3);
  };

  const steps = [
    { id: 1, label: "Role details" },
    { id: 2, label: "Questions" },
    { id: 3, label: "Share link" },
  ];

  return (
    <div className={`min-h-screen px-5 py-8 ${darkTheme ? "bg-slate-900 text-slate-100" : "bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900"}`}>
      <div className="mx-auto flex max-w-6xl flex-col space-y-6">
        <div className={`rounded-3xl border p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${darkTheme ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className={`text-[11px] uppercase tracking-[0.3em] ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
                Create new interview
              </p>
              <h1 className={`text-3xl font-semibold font-sora tracking-tight ${darkTheme ? "text-white" : "text-slate-900"}`}>
                Build a tailored interview in minutes
              </h1>
              <p className={`max-w-2xl text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Choose the role, set the duration, pick the style, and decide whether to accept resumes. We will keep everything structured for your candidates.
              </p>
              <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className={`rounded-full border px-3 py-1 ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}>Custom roles</span>
                <span className={`rounded-full border px-3 py-1 ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}>Duration control</span>
                <span className={`rounded-full border px-3 py-1 ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}>Interview type</span>
                <span className={`rounded-full border px-3 py-1 ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"}`}>Resume optional</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              <div className={`rounded-xl border px-4 py-3 text-sm shadow-inner ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300 shadow-slate-900" : "border-slate-200 bg-slate-50 text-slate-700 shadow-slate-200"}`}>
                <p className={`font-semibold ${darkTheme ? "text-white" : "text-slate-900"}`}>Progress</p>
                <p className={`text-xs ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>{steps[step - 1]?.label}</p>
                <Progress value={step * 33} className="mt-2 h-2 w-56" />
              </div>
              <div className={`flex items-center gap-2 text-xs ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Autosave ready
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {steps.map((item) => {
              const isActive = item.id === step;
              const isDone = item.id < step;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${darkTheme
                    ? isActive
                      ? "border-blue-500 bg-blue-900 text-blue-200"
                      : isDone
                        ? "border-emerald-600 bg-emerald-900/30 text-emerald-400"
                        : "border-slate-600 bg-slate-700 text-slate-400"
                    : isActive
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : isDone
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300" : "border-slate-200 bg-white text-slate-800"}`}>
                    {item.id}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] max-lg:grid-cols-1">
          <div className={`rounded-3xl border p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] ${darkTheme ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <div className={`flex items-center gap-3 text-sm ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
              <LuArrowLeft
                onClick={() => router.back()}
                className="h-5 w-5 cursor-pointer text-sky-600 transition hover:scale-105"
              />
              <p className={`text-lg font-semibold ${darkTheme ? "text-white" : "text-slate-900"}`}>Create new interview</p>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${darkTheme ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                Step {step} of 3
              </span>
            </div>

            <div className="mt-6">
              {step === 1 && (
                <InterviewFormContainer
                  formData={formData}
                  onHandleInputChange={onHandleInputChange}
                  onToggleInterviewType={onToggleInterviewType}
                  onSubmit={handleSubmit}
                />
              )}
              {step === 2 && (
                <InterviewQuestions
                  formData={formData}
                  onCreateLink={(interview_id) => onCreateLink(interview_id)}
                />
              )}
              {step === 3 && <InterviewLink />}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)] max-lg:grid-cols-1">
            <div className={`rounded-2xl border p-4 text-sm shadow-inner ${darkTheme
              ? "border-slate-600 bg-gradient-to-br from-blue-900/30 via-slate-800/50 to-slate-800 text-slate-300"
              : "border-slate-200 bg-gradient-to-br from-sky-100 via-indigo-100 to-fuchsia-100 text-slate-700"}`}>
              <p className={`text-base font-semibold ${darkTheme ? "text-blue-300" : "text-slate-900"}`}>Quick tips</p>
              <ul className={`mt-3 space-y-2 text-xs ${darkTheme ? "text-slate-400" : "text-slate-700"}`}>
                <li>Keep role titles clear so candidates know what to expect.</li>
                <li>Pick a duration that fits the depth of questions you plan to ask.</li>
                <li>Use interview type to signal the tone: technical, behavioral, or portfolio.</li>
                <li>Toggle resume acceptance if you need pre-screening context.</li>
              </ul>
            </div>

            <div className={`rounded-2xl border p-4 text-sm ${darkTheme ? "border-slate-600 bg-slate-700 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
              <p className={`text-sm font-semibold ${darkTheme ? "text-white" : "text-slate-900"}`}>Current selections</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${darkTheme ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
                  <span className={darkTheme ? "text-slate-400" : "text-slate-600"}>Interview type</span>
                  <span className={`font-semibold ${darkTheme ? "text-slate-200" : "text-slate-900"}`}>
                    {formData.interviewType.length > 0
                      ? formData.interviewType.join(", ")
                      : "Not set"}
                  </span>
                </div>
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${darkTheme ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
                  <span className={darkTheme ? "text-slate-400" : "text-slate-600"}>Duration</span>
                  <span className={`font-semibold ${darkTheme ? "text-slate-200" : "text-slate-900"}`}>
                    {formData.interviewDuration || "Not set"}
                  </span>
                </div>
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${darkTheme ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
                  <span className={darkTheme ? "text-slate-400" : "text-slate-600"}>Accept resume</span>
                  <span className={`font-semibold ${formData.acceptResume ? (darkTheme ? "text-emerald-400" : "text-emerald-600") : (darkTheme ? "text-amber-400" : "text-amber-600")}`}>
                    {formData.acceptResume ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInterview;
