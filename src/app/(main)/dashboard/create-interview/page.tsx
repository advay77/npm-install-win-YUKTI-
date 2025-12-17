/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
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
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 px-5 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                Create new interview
              </p>
              <h1 className="text-3xl font-semibold font-sora tracking-tight text-slate-900">
                Build a tailored interview in minutes
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Choose the role, set the duration, pick the style, and decide whether to accept resumes. We will keep everything structured for your candidates.
              </p>
              <div className="flex flex-wrap gap-2 text-[12px] font-semibold text-slate-700">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">Custom roles</span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">Duration control</span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">Interview type</span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1">Resume optional</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 text-right">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200">
                <p className="font-semibold text-slate-900">Progress</p>
                <p className="text-xs text-slate-500">{steps[step - 1]?.label}</p>
                <Progress value={step * 33} className="mt-2 h-2 w-56" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
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
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${isActive
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : isDone
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-800">
                    {item.id}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] max-lg:grid-cols-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <LuArrowLeft
                onClick={() => router.back()}
                className="h-5 w-5 cursor-pointer text-sky-600 transition hover:scale-105"
              />
              <p className="text-lg font-semibold text-slate-900">Create new interview</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600">
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

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-indigo-100 to-fuchsia-100 p-4 text-sm text-slate-700 shadow-inner">
              <p className="text-base font-semibold text-slate-900">Quick tips</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                <li>Keep role titles clear so candidates know what to expect.</li>
                <li>Pick a duration that fits the depth of questions you plan to ask.</li>
                <li>Use interview type to signal the tone: technical, behavioral, or portfolio.</li>
                <li>Toggle resume acceptance if you need pre-screening context.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="text-sm font-semibold text-slate-900">Current selections</p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Interview type</span>
                  <span className="font-semibold text-slate-900">
                    {formData.interviewType.length > 0
                      ? formData.interviewType.join(", ")
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-semibold text-slate-900">
                    {formData.interviewDuration || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-slate-600">Accept resume</span>
                  <span className={`font-semibold ${formData.acceptResume ? "text-emerald-600" : "text-amber-600"}`}>
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
