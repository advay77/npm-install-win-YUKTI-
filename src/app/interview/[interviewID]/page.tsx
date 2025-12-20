/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { LuClock2, LuMoveRight } from "react-icons/lu";
import { toast } from "sonner";
import { useInterview } from "@/context/interviewContext";
import { set } from "zod";
import { Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

const Interview = () => {
  const { interviewID } = useParams();
  // console.log("interviewID", interviewID);
  const router = useRouter();
  const { interviewInfo, setInterviewInfo } = useInterview();
  const [interviewDetails, setInterviewDetails] = useState<any>(null); //for displaying
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [wrongId, setWrongId] = useState<boolean>(false);

  // --- FILE PDF
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const uploadResume = async () => {
    if (!file) return;
    // Reject oversized files early (Supabase default limit ~50MB)
    const MAX_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error("File too large", {
        description: "Please upload a PDF under 50MB.",
      });
      return;
    }
    setUploading(true);

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${now.getMonth() + 1
      }-${now.getDate()}_${now.getHours()}-${now.getMinutes()}`;

    const filePath = `${timestamp}/resume.pdf`;

    const { error } = await supabase.storage
      .from("resume")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error.message);
      toast.error("Resume upload failed", {
        description: error.message,
      });
    } else {
      // Get public URL
      const { data } = supabase.storage.from("resume").getPublicUrl(filePath);
      setResumeUrl(data.publicUrl);
      toast.success("Resume uploaded successfully!");
      setUploaded(true);
      // console.log("Resume URL:", data.publicUrl);
      // Optional: verify object exists in bucket
      try {
        const { data: listData, error: listErr } = await supabase.storage
          .from("resume")
          .list(timestamp);
        if (listErr) {
          console.warn("List verify error:", listErr.message);
        } else if (!listData || listData.length === 0) {
          console.warn("Uploaded file not found in listing for:", timestamp);
        }
      } catch (e: any) {
        console.warn("List verification exception:", e?.message || String(e));
      }
    }

    setUploading(false);
  };
  // -----------------------

  useEffect(() => {
    interviewID && GetInterviewDetails();
  }, [interviewID]);

  const GetInterviewDetails = async () => {
    setLoading(true);
    try {
      const { data: interviews, error } = await supabase
        .from("interviews")
        .select(
          "jobTitle, jobDescription, interviewDuration,  acceptResume, organization"
        )
        .eq("interview_id", interviewID);

      if (interviews && interviews.length > 0) {
        setInterviewDetails(interviews[0]);
      } else {
        setWrongId(true);
        toast("Incorrect Interview ID");
      }
    } catch (err) {
      setLoading(false);
      toast("Incorrect Interview ID");
    } finally {
      setLoading(false);
    }

    // console.log("interviews", interviews);
  };

  const onJoinInterview = async () => {
    setLoading(true);
    const { data: interviews, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("interview_id", interviewID);

    if (interviews) {
      setInterviewInfo({
        userName: userName,
        userEmail: userEmail,
        jobTitle: interviews[0].jobTitle,
        jobPosition: interviews[0].jobDescription,
        interviewDuration: interviews[0].interviewDuration,
        interviewData: interviews[0].questionList,
        interviewID: interviewID,
        acceptResume: interviews[0].acceptResume,
        organization: interviews[0].organization,
        resumeURL: resumeUrl,
      });

      router.push(`/interview/${interviewID}/start`);
      setLoading(false);
    } else {
      toast("Incorrect Interview ID");
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-3 py-4 bg-gradient-to-br from-slate-50 via-white to-sky-100 overflow-hidden"
    >
      {wrongId ? (
        <Card className="min-w-[440px] flex items-center justify-center">
          <h1>Dear Candidate</h1>
          <CardContent>
            <p>Your provided Interview ID is incorrect</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative w-full max-w-3xl overflow-hidden border border-slate-200 bg-white/95 px-5 py-5 shadow-[0_25px_60px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-sky-100 via-indigo-50 to-amber-50 opacity-70" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Interview check-in</p>
                <h1 className="text-2xl font-semibold text-slate-900">Welcome Candidate</h1>
              </div>
              <div className="rounded-none border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-sky-800 shadow-[0_4px_12px_rgba(56,189,248,0.15)]">
                ID: {interviewID}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <Image
                src="/workspace.png"
                width={110}
                height={110}
                alt="workspace"
                className="mx-auto drop-shadow-sm"
              />
              <p className="text-xl font-semibold text-slate-900 capitalize">
                {interviewDetails?.jobTitle || "Collecting Information..."}
              </p>
              <p className="text-base font-medium text-slate-600">
                {interviewDetails?.organization || "No organization"}
              </p>
              <div className="flex items-center gap-2 rounded-none border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm">
                <LuClock2 className="h-4 w-4 text-slate-600" />
                {interviewDetails?.interviewDuration || "--"} minutes
              </div>
            </div>

            <Separator className="my-1" />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold text-slate-700">Full name</Label>
                <Input
                  placeholder="John Doe"
                  className="h-10 rounded-none border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-0"
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-semibold text-slate-700">Email</Label>
                <Input
                  placeholder="john@example.com"
                  className="h-10 rounded-none border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-0"
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
              {interviewDetails?.acceptResume && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Resume (PDF)</Label>
                  <div className="flex flex-wrap gap-3">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="h-10 w-full max-w-sm rounded-none border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-0"
                    />
                    <Button
                      variant="outline"
                      className="h-10 rounded-none border-slate-200 text-slate-800 hover:border-sky-300"
                      onClick={uploadResume}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          Uploading <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          Upload <UploadCloud className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner">
              <ul className="list-disc list-inside space-y-1">
                <li>Check that your camera and microphone are working.</li>
                <li>Ensure you have a stable internet connection.</li>
                <li>Find a quiet place before you begin.</li>
              </ul>
            </div>

            <div className="flex w-full items-center justify-end">
              <Button
                className="h-11 rounded-none bg-gradient-to-r from-sky-600 to-indigo-600 px-5 text-white shadow-md hover:from-sky-500 hover:to-indigo-500"
                disabled={
                  loading ||
                  !userName ||
                  !userEmail ||
                  (interviewDetails?.acceptResume && !uploaded)
                }
                onClick={() => onJoinInterview()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Join Interview
                <LuMoveRight className="ml-2 h-4 w-4" />
              </Button>
              {interviewDetails?.acceptResume && !uploaded && (
                <p className="ml-3 text-xs text-slate-500">
                  Please upload your resume to proceed.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
