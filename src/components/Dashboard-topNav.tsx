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
    <div>
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
        <div className="flex items-center justify-between bg-blue-50 rounded-full px-3  font-inter shadow-md min-[800px]:min-w-[300px] min-[1000px]:min-w-[360px]">
          <Input
            type="text"
            placeholder="Search"
            className="bg-transparent shadow-none rounded-none focus-visible:ring-0 border-none"
          />
          <LuSearch className="text-xl text-black" />
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
              className="w-56 mr-5 font-inter text-lg space-y-1"
              align="start"
            >
              <DropdownMenuLabel className="font-medium text-center tracking-tight">
                {users?.[0].name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <LuUser /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer"
              >
                <LuSun /> Theme
              </DropdownMenuItem>
              <DropdownMenuItem className=" cursor-pointer">
                <LuWallet /> Subscription
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center justify-center gap-3 bg-blue-100 rounded-sm cursor-pointer"
              >
                <LuLogOut className="text-blue-600" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />
    </div>
  );
};

export default DashboardTopNav;
