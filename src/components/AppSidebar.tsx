"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/SideBar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LuCircleFadingPlus,
  LuLayoutGrid,
  LuCalendarDays,
  LuBoxes,
  LuWalletCards,
  LuSettings,
  LuChevronsDownUp,
} from "react-icons/lu";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";
import { useUserData } from "@/context/UserDetailContext";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "./ui/progress";
import Link from "next/link";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LuLayoutGrid,
  },
  {
    title: "Scheduled",
    url: "/scheduled",
    icon: LuCalendarDays,
  },
  {
    title: "All Interviews",
    url: "/all-interviews",
    icon: LuBoxes,
  },
];
export function AppSidebar() {
  const { users, remainingCredits } = useUserData();
  const path = usePathname();
  const { darkTheme } = useTheme();

  const totalCredits = users?.[0].credits || 0;
  const progress = (remainingCredits / totalCredits) * 100;
  // console.log("USERS DATA IN APPSIDEBAR", users);
  return (
    <Sidebar>
      <SidebarHeader className="py-5 px-4 relative">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>

        <div className="flex items-center gap-3.5 group cursor-pointer">
          <div
            className={clsx(
              "relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl font-sora shadow-lg transition-all duration-500 group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-3",
              darkTheme
                ? "bg-gradient-to-br from-white via-gray-50 to-gray-100 text-blue-600"
                : "bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 text-white"
            )}
          >
            <span className="relative z-10">I</span>
            {/* Glow effect */}
            <div className={clsx(
              "absolute inset-0 rounded-2xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-500",
              darkTheme ? "bg-blue-400" : "bg-blue-500"
            )}></div>
          </div>
          <div className="flex-1">
            <h2
              className={clsx(
                "text-[22px] font-black font-sora tracking-tight bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105 origin-left",
                darkTheme ? "from-white via-gray-100 to-gray-300" : "from-blue-700 via-blue-600 to-indigo-700"
              )}
            >
              INTERVIEWX
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-sm shadow-green-400/50"></div>
              <p className={clsx(
                "text-[11px] uppercase tracking-wide font-semibold truncate font-inter max-w-[160px] transition-colors duration-300",
                darkTheme ? "text-gray-400 group-hover:text-gray-300" : "text-slate-500 group-hover:text-slate-600"
              )}>
                {users?.[0].organization || "No Organization"}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <Separator className={clsx("my-2 mx-4", darkTheme ? "bg-gradient-to-r from-transparent via-gray-700 to-transparent" : "bg-gradient-to-r from-transparent via-slate-200 to-transparent")} />
      <SidebarContent className="px-4 py-2">
        <SidebarGroup className="mb-2">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className={clsx("h-3.5 w-1 rounded-full", darkTheme ? "bg-gradient-to-b from-blue-400 to-blue-600" : "bg-gradient-to-b from-blue-500 to-blue-700")}></div>
            <SidebarGroupLabel
              className={clsx(
                "text-[10px] uppercase tracking-[0.15em] font-inter font-bold",
                darkTheme ? "text-gray-400" : "text-slate-400"
              )}
            >
              Quick Action
            </SidebarGroupLabel>
          </div>
          <Link href="/dashboard/create-interview" className="w-full">
            <Button
              className={clsx(
                "group relative font-inter font-bold flex items-center justify-center gap-3 cursor-pointer w-full h-11 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden",
                darkTheme
                  ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white hover:from-gray-800 hover:to-gray-700"
                  : "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white hover:from-gray-800 hover:to-gray-700"
              )}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <LuCircleFadingPlus className="text-[19px] relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10 text-sm">Create New Interview</span>
            </Button>
          </Link>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className={clsx("h-3.5 w-1 rounded-full", darkTheme ? "bg-gradient-to-b from-blue-400 to-blue-600" : "bg-gradient-to-b from-blue-500 to-blue-700")}></div>
            <SidebarGroupLabel
              className={clsx(
                "text-[10px] uppercase tracking-[0.15em] font-inter font-bold",
                darkTheme ? "text-gray-400" : "text-slate-400"
              )}
            >
              Navigation
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={clsx(
                    "group rounded-xl transition-all duration-300",
                    path === item.url && "bg-gradient-to-r from-blue-50 via-blue-50 to-blue-100 shadow-md shadow-blue-100/50"
                  )}
                >
                  <SidebarMenuButton
                    asChild
                    className={clsx(
                      "flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-300",
                      path === item.url
                        ? "text-blue-700 font-bold"
                        : darkTheme
                          ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 hover:shadow-sm"
                    )}
                  >
                    <Link href={item.url}>
                      <div className={clsx(
                        "w-[18px] h-[18px] flex items-center justify-center transition-all duration-300",
                        path === item.url ? "scale-110" : "group-hover:scale-105"
                      )}>
                        <item.icon className="w-full h-full" />
                      </div>

                      <span
                        className={clsx("font-inter text-sm tracking-tight font-medium")}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-3">
        {/* Credits Card */}
        <div className="group h-[155px] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-400 w-full mb-3 rounded-2xl pt-3.5 pb-2 px-3.5 relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2.5 px-0.5">
              <span className="text-white font-inter font-bold text-base tracking-tight">
                {remainingCredits} <span className="font-medium text-sm">left</span>
              </span>
              <span className="text-white/90 font-inter font-semibold text-sm bg-white/10 px-2.5 py-0.5 rounded-full">
                {totalCredits}
              </span>
            </div>

            <Progress value={progress} className="h-2.5 rounded-full bg-white/25 shadow-inner border border-white/10">
              <div
                className="h-full rounded-full shadow-lg bg-white"
                style={{
                  width: `${progress}%`,
                }}
              ></div>
            </Progress>

            <div className="w-full mt-2.5">
              <h3 className="text-white font-inter font-bold text-sm hover:text-white/90 cursor-pointer transition-colors duration-200 flex items-center gap-1.5">
                Get more credits
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </h3>
              <h2 className="text-balance mt-2 font-inter font-medium text-white/95 text-xs max-w-[140px] leading-relaxed">
                {users?.[0].name}, you can make <span className="font-bold">{remainingCredits}</span> more Interviews
              </h2>
            </div>
            <Image
              src="/element2.png"
              alt="ad"
              width={350}
              height={350}
              className="absolute -bottom-2 left-20 opacity-90"
            />
          </div>
        </div>
        <div className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 rounded-2xl px-3.5 py-2.5 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="relative shrink-0 w-10 h-10">
            <Image
              src={users?.[0].picture || "/avatar.png"}
              alt="profile"
              width={40}
              height={40}
              className="w-full h-full rounded-full border-2 border-white/40 shadow-md object-cover ring-2 ring-white/10"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-700 shadow-sm"></div>
          </div>
          <div className="flex flex-col font-inter flex-1 min-w-0">
            <p className="text-sm font-bold tracking-tight truncate group-hover:text-white/95 transition-colors">
              {users?.[0].name}
            </p>
            <p className="font-medium text-xs truncate text-white/75 group-hover:text-white/85 transition-colors">
              {users?.[0].email}
            </p>
          </div>
          <Popover>
            <PopoverTrigger className="hover:bg-white/15 rounded-xl p-1.5 transition-all duration-200 hover:scale-110">
              <LuChevronsDownUp className="text-lg text-white cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent className="w-44">
              <div></div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
