"use client";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import React, { useState } from "react";
import { LuBell, LuSearch, LuChevronDown, LuX } from "react-icons/lu";
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
import { useRouter, usePathname } from "next/navigation";

const DashboardTopNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { darkTheme, toggleTheme } = useTheme();
  const { users, setUsers } = useUserData();
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Navigate to search or filter current page
      console.log("Searching for:", searchValue);
      // You can add actual search logic here
    }
  };
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
          "h-11 w-11 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl",
          darkTheme
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-500/20"
            : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-2 border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400"
        )} />

        {/* Enhanced Search Bar */}
        <form onSubmit={handleSearch} className={clsx(
          "relative flex items-center rounded-2xl px-4 py-3 font-inter transition-all duration-300 min-[800px]:min-w-[320px] min-[1000px]:min-w-[420px]",
          isFocused
            ? darkTheme
              ? "bg-slate-800 border-2 border-blue-500 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20"
              : "bg-white border-2 border-blue-500 shadow-xl shadow-blue-300/50 ring-4 ring-blue-400/20"
            : darkTheme
              ? "bg-slate-800 border-2 border-slate-600 shadow-md hover:border-blue-400 hover:shadow-lg"
              : "bg-blue-50 border-2 border-blue-200 shadow-md hover:border-blue-300 hover:shadow-lg backdrop-blur-sm"
        )}>
          <LuSearch className={clsx(
            "text-xl mr-3 transition-all duration-300",
            isFocused
              ? darkTheme ? "text-blue-400 scale-110" : "text-blue-600 scale-110"
              : darkTheme ? "text-slate-400" : "text-slate-500"
          )} />
          <Input
            type="text"
            placeholder="Search interviews, candidates..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
            className={clsx(
              "flex-1 bg-transparent shadow-none border-none focus-visible:ring-0 h-auto p-0 placeholder:transition-colors font-medium text-[15px]",
              darkTheme
                ? "text-white placeholder:text-slate-400"
                : "text-slate-800 placeholder:text-slate-400"
            )}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className={clsx(
                "ml-2 p-1.5 rounded-lg transition-all duration-200 hover:scale-110",
                darkTheme
                  ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                  : "hover:bg-blue-100 text-slate-500 hover:text-blue-600"
              )}
            >
              <LuX className="text-base" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-5">
          <button className={clsx(
            "relative p-2.5 rounded-xl transition-all duration-300 hover:scale-105",
            darkTheme
              ? "hover:bg-slate-800 text-slate-300 hover:text-white"
              : "hover:bg-blue-50 text-slate-600 hover:text-blue-600"
          )}>
            <LuBell className="text-xl" />
            <span className={clsx(
              "absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse",
              darkTheme ? "border-2 border-slate-900" : "border-2 border-white shadow-sm"
            )}></span>
          </button>
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
                onClick={() => router.push('/profile')}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-none transition-all cursor-pointer",
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
                onClick={() => router.push('/subscription')}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-none transition-all cursor-pointer",
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
    </div >
  );
};

export default DashboardTopNav;
