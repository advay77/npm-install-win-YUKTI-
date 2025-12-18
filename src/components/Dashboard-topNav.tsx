"use client";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import React from "react";
import { LuBell, LuSearch, LuChevronDown } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/SideBar";
import { useUserData } from "@/context/UserDetailContext";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuLogOut, LuSun, LuWallet, LuUser } from "react-icons/lu";
import { supabase } from "@/services/supabaseClient";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const DashboardTopNav = () => {
  const router = useRouter();
  const { darkTheme, toggleTheme } = useTheme();
  const { users, setUsers } = useUserData();
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    toast.loading("Signing out...");
    if (error) {
      console.error("Error signing out:", error.message);
      toast.error(error.message);
      return;
    }
    setUsers(null);
    router.push("/auth");
  };
  return (
    <div className="relative">
      {/* Decorative gradient top bar */}
      <div className={clsx(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r z-20",
        darkTheme
          ? "from-blue-600 via-blue-500 to-blue-600"
          : "from-gray-900 via-gray-700 to-gray-900"
      )}></div>

      <div
        className={clsx(
          "px-6 py-[12px] w-full font-inter flex items-center justify-between ",
          darkTheme ? "bg-slate-900 text-white" : "bg-white text-black"
        )}
      >
        <SidebarTrigger className={clsx(
          "h-10 w-10 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md",
          darkTheme
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300"
        )} />
        <div className={clsx(
          "flex items-center justify-between rounded-full px-3 font-inter shadow-md min-[800px]:min-w-[300px] min-[1000px]:min-w-[360px]",
          darkTheme
            ? "bg-slate-800 border border-slate-700"
            : "bg-blue-50 border border-blue-100"
        )}>
          <Input
            type="text"
            placeholder="Search"
            className={clsx(
              "bg-transparent shadow-none rounded-none focus-visible:ring-0 border-none",
              darkTheme ? "text-white placeholder:text-slate-400" : "text-black placeholder:text-gray-400"
            )}
          />
          <LuSearch className={clsx("text-xl", darkTheme ? "text-slate-400" : "text-black")} />
        </div>

        <div className="flex items-center gap-5">
          <LuBell className="text-xl" />
          <p className="flex items-center gap-1 font-sora text-sm text-gray-400">
            EN <LuChevronDown />
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer focus:outline-none">
              {/* <div className="cursor-pointer"> */}
              <Image
                src={users?.[0].picture || "/avatar.png"}
                width={50}
                height={50}
                className="rounded-full"
                alt="avatar"
              />
              {/* </div> */}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={clsx(
                "w-72 mr-5 font-inter text-[15px] space-y-1 rounded-none p-3 shadow-xl border",
                darkTheme
                  ? "bg-[#0c1024] text-white border-slate-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                  : "bg-white text-slate-900 border-blue-100"
              )}
              align="start"
            >
              <DropdownMenuLabel
                className={clsx(
                  "font-sora italic font-bold text-center tracking-[0.08em] w-full py-3 rounded-none uppercase",
                  darkTheme
                    ? "bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-700 text-white shadow-sm"
                    : "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white"
                )}
              >
                HEY, {users?.[0].name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-none transition-all",
                  darkTheme
                    ? "hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-white"
                    : "hover:bg-blue-50 data-[highlighted]:bg-blue-50 data-[highlighted]:text-slate-900"
                )}
              >
                <LuUser className="text-blue-600" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-none transition-all",
                  darkTheme
                    ? "hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-white"
                    : "hover:bg-blue-50 data-[highlighted]:bg-blue-50 data-[highlighted]:text-slate-900"
                )}
              >
                <LuSun className="text-yellow-500" /> Theme
              </DropdownMenuItem>
              <DropdownMenuItem
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-none transition-all",
                  darkTheme
                    ? "hover:bg-slate-800 data-[highlighted]:bg-slate-800 data-[highlighted]:text-white"
                    : "hover:bg-blue-50 data-[highlighted]:bg-blue-50 data-[highlighted]:text-slate-900"
                )}
              >
                <LuWallet className="text-purple-600" /> Subscription
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="mt-1 flex items-center justify-center gap-3 rounded-none cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-700 text-white hover:text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] focus:text-white"
              >
                <LuLogOut className="text-white hover:text-white" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced decorative bottom separator */}
      <div className="relative w-full h-[2px]">
        <div className={clsx(
          "absolute inset-0",
          darkTheme
            ? "bg-gradient-to-r from-blue-600/60 via-blue-500/50 to-blue-600/60"
            : "bg-gradient-to-r from-blue-400/70 via-blue-500/60 to-blue-400/70"
        )}>
          <div className={clsx(
            "absolute inset-0",
            darkTheme
              ? "shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              : "shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          )} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTopNav;
