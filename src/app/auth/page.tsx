"use client";
import React from "react";
import clsx from "clsx";
import { BsStars } from "react-icons/bs";
import Image from "next/image";
import { supabase } from "@/services/supabaseClient";
import { toast } from "react-hot-toast";
import { SparklesCore } from "@/components/ui/sparkles";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
const Login = () => {
  const router = useRouter();
  const handleLogin = async (provider: "google" | "discord") => {
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback";

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-center w-full h-screen relative overflow-hidden"
      )}
    >
      {/* Gradient + Grid Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
          linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
          radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
          radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
        `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      />

      {/* Content */}
      {/* animate-moving-gradient */}
      <div className="flex flex-col items-center justify-center relative z-10 ">
        <div className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 border-2 border-yellow-400 rounded-full mb-20 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 hover:from-yellow-100 hover:to-amber-100 transition-all duration-300 shadow-lg hover:shadow-xl">
          <BsStars className="text-yellow-500 text-lg animate-pulse" />
          <span className="text-sm font-semibold text-gray-900 font-inter">Try it for Free</span>
          <BsStars className="text-yellow-500 text-lg animate-pulse" />
        </div>

        <h1 className="font-extrabold text-5xl md:text-6xl font-sora tracking-tight mb-3">
          INTERVIEWX
        </h1>

        <h2 className=" text-2xl md:text-4xl font-sora font-semibold tracking-tight text-center w-full md:max-w-[700px] mx-auto  leading-tight max-[600px]:px-4 max-[650px]:mt-3">
          AI-powered Recruitment Platform To Simplify Hiring
        </h2>

        <div className="max-[650px]:hidden w-[40rem] relative my-5">
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
          <div className="max-w-[20rem] h-[2rem] mx-auto">
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1000}
              className="w-full h-full"
              particleColor="#0000"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 mb-12">
          <p className="text-gray-900 max-[650px]:mt-14 mt-10 text-4xl font-sora font-bold tracking-tight">
            Get Started Now
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400" />
          <p className="text-gray-500 text-sm font-inter max-w-sm text-center">
            Join thousands of recruiters using INTERVIEWX to streamline hiring
          </p>
        </div>

        <div className="flex items-center justify-center w-full max-w-lg px-4">
          <Button
            onClick={() => handleLogin("google")}
            variant="outline"
            className="w-full py-7 shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 cursor-pointer border-2 border-blue-300 bg-gradient-to-r from-blue-50 via-white to-blue-50 hover:from-blue-100 hover:via-blue-50 hover:to-blue-100 hover:scale-[1.01] active:scale-[0.99] rounded-none"
          >
            <span className="flex items-center justify-center gap-3 font-inter text-gray-900 tracking-tight font-bold text-lg">
              <Image src="/google.png" alt="Google" width={32} height={32} />
              <span>Sign in with Google</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
