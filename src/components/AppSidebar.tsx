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
      <SidebarHeader className="py-4">
        <div className="flex items-center justify-center gap-3 px-2">
          <div
            className={clsx(
              "w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xl font-sora shadow-lg transition-all duration-300 hover:scale-105",
              darkTheme ? "bg-gradient-to-br from-white to-gray-100 text-blue-600" : "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
            )}
          >
            I
          </div>
          <div>
            <h2
              className={clsx(
                "text-xl font-extrabold font-sora tracking-tight bg-gradient-to-r bg-clip-text text-transparent",
                darkTheme ? "from-white to-gray-300" : "from-blue-600 to-blue-800"
              )}
            >
              INTERVIEWX
            </h2>
            <p className={clsx("text-xs capitalize font-medium truncate font-inter max-w-[180px]", darkTheme ? "text-gray-400" : "text-gray-600")}>
              {users?.[0].organization || "No Organization"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <Separator className={clsx("my-2", darkTheme ? "bg-gray-700" : "bg-gray-200")} />
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel
            className={clsx(
              "text-xs uppercase tracking-wider font-inter font-semibold mb-2",
              darkTheme ? "text-gray-500" : "text-gray-400"
            )}
          >
            New Interview
          </SidebarGroupLabel>
          <Link href="/dashboard/create-interview" className="w-full">
            <Button
              className={clsx(
                "mt-1 font-inter font-semibold flex items-center justify-center gap-3 cursor-pointer w-full h-11 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]",
                darkTheme
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              )}
            >
              <LuCircleFadingPlus className="text-lg" />
              Create New Interview
            </Button>
          </Link>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel
            className={clsx(
              "text-xs uppercase tracking-wider font-inter font-semibold mb-2",
              darkTheme ? "text-gray-500" : "text-gray-400"
            )}
          >
            Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={clsx(
                    "rounded-lg transition-all duration-200",
                    path === item.url && "bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm"
                  )}
                >
                  <SidebarMenuButton
                    asChild
                    className={clsx(
                      "flex items-center gap-3 h-11 px-3 rounded-lg transition-all duration-200 hover:bg-blue-50",
                      path === item.url
                        ? "text-blue-700 font-semibold"
                        : darkTheme ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-blue-600"
                    )}
                  >
                    <Link href={item.url}>
                      <div className={clsx(
                        "w-5 h-5 flex items-center justify-center transition-all duration-200",
                        path === item.url && "scale-110"
                      )}>
                        <item.icon className="w-full h-full" />
                      </div>

                      <span
                        className={clsx("font-inter text-sm tracking-tight")}
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
      <SidebarFooter className="px-3 pb-3">
        {/* AD FOR PRO */}
        <div className="h-[190px] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-400 w-full mb-3 rounded-xl pt-3 pb-1 px-3 relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-white font-inter font-bold text-sm">
              {remainingCredits} left
            </span>
            <span className="text-white/90 font-inter font-medium text-sm">
              {totalCredits}
            </span>
          </div>

          <Progress value={progress} className="h-2.5 rounded-full bg-white/30 shadow-inner">
            <div
              className="h-full rounded-full shadow-sm"
              style={{
                width: `${progress}%`,
                backgroundColor: "white",
              }}
            ></div>
          </Progress>

          <div className="w-full">
            <h3 className="text-white font-inter font-semibold text-sm hover:text-white/90 mt-2 cursor-pointer transition-colors duration-200">
              Get more credits
            </h3>
            <h2 className="text-balance mt-3 font-inter font-medium text-white/95 text-sm max-w-[140px] leading-snug">
              {users?.[0].name} you can make {remainingCredits} more Interviews
            </h2>
            <Image
              src="/element2.png"
              alt="ad"
              width={350}
              height={350}
              className="absolute -bottom-2 left-20 opacity-90"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-3 py-2.5 text-white shadow-md">
          <div className="relative shrink-0 w-10 h-10">
            <Image
              src={users?.[0].picture || "/avatar.png"}
              alt="profile"
              width={40}
              height={40}
              className="w-full h-full rounded-full border-2 border-white/30 shadow-sm object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-700"></div>
          </div>
          <div className="flex flex-col font-inter flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-tight truncate">
              {users?.[0].name}
            </p>
            <p className="font-normal text-xs truncate text-white/80">
              {users?.[0].email}
            </p>
          </div>
          <Popover>
            <PopoverTrigger className="hover:bg-white/10 rounded-lg p-1 transition-colors duration-200">
              <LuChevronsDownUp className="text-lg text-white cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent className="w-44 ">
              <div></div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
