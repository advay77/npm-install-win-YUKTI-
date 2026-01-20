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
  LuClock,
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
import { toast } from "sonner";

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
  const progress = totalCredits > 0 ? ((remainingCredits || 0) / totalCredits) * 100 : 0;
  return (
    <Sidebar>
      <SidebarHeader className="py-5 px-4 relative">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>

        <div className="flex items-center gap-3.5 group cursor-pointer">
          <div className="relative w-12 h-12">
            <Image
              src="/logo.png"
              alt="INTERVIEWX logo"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
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
                    path === item.url && (darkTheme
                      ? "bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-md shadow-blue-700/30"
                      : "bg-gradient-to-r from-blue-50 via-blue-50 to-blue-100 shadow-md shadow-blue-100/50"
                    )
                  )}
                >
                  <SidebarMenuButton
                    asChild
                    className={clsx(
                      "flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-300",
                      path === item.url
                        ? darkTheme
                          ? "text-blue-300 font-bold"
                          : "text-blue-700 font-bold"
                        : darkTheme
                          ? "text-gray-400 hover:text-white hover:bg-blue-900/40 hover:shadow-md"
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
        <Link href="/subscription" className="block mb-3">
          <div className={clsx(
            "group relative w-full rounded-lg p-3 transition-all duration-300 cursor-pointer overflow-hidden",
            darkTheme
              ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-800 border border-gray-700/50 hover:border-blue-500/30"
              : "bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 hover:from-blue-100 hover:to-blue-50 border border-blue-200/50 hover:border-blue-400/50"
          )}>
            {/* Subtle background pattern */}
            <div className={clsx(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              darkTheme ? "bg-gradient-to-br from-blue-500/5 to-transparent" : "bg-gradient-to-br from-blue-500/5 to-transparent"
            )}></div>

            {/* Credit card image - positioned on right */}
            <div className="absolute -top-2 -right-2 w-24 h-24 opacity-40 group-hover:opacity-60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <Image
                src="/element2.png"
                alt="credits"
                width={112}
                height={112}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="relative z-10">
              {/* Credits display */}
              <div className="mb-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className={clsx(
                    "w-2 h-2 rounded-full",
                    darkTheme ? "bg-blue-500" : "bg-blue-600"
                  )}></div>
                  <span className={clsx(
                    "text-[10px] uppercase tracking-wider font-inter font-semibold",
                    darkTheme ? "text-gray-400" : "text-gray-500"
                  )}>
                    Available Credits
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={clsx(
                    "font-inter font-black text-3xl tracking-tight",
                    darkTheme
                      ? "bg-gradient-to-br from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent"
                      : "bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent"
                  )}>
                    {remainingCredits}
                  </span>
                  <span className={clsx(
                    "font-inter font-medium text-xs",
                    darkTheme ? "text-gray-500" : "text-gray-600"
                  )}>
                    / {totalCredits}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2.5">
                <div className={clsx(
                  "relative h-1.5 rounded-full overflow-hidden",
                  darkTheme ? "bg-gray-800" : "bg-blue-100"
                )}>
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-500 relative",
                      darkTheme
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                        : "bg-gradient-to-r from-blue-500 to-blue-600"
                    )}
                    style={{ width: `${progress}%` }}
                  >
                    {/* Animated shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={clsx(
                    "text-[10px] font-inter font-medium",
                    darkTheme ? "text-gray-500" : "text-gray-600"
                  )}>
                    {Math.round(progress)}% used
                  </span>
                  <span className={clsx(
                    "text-[10px] font-inter font-semibold px-2 py-0.5 rounded-full",
                    darkTheme ? "bg-gray-800 text-blue-400" : "bg-blue-100 text-blue-600"
                  )}>
                    {remainingCredits} left
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className={clsx(
                "flex items-center justify-between py-1.5 px-3 rounded-lg transition-all duration-300",
                darkTheme
                  ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 group-hover:from-blue-500/20 group-hover:to-indigo-500/20"
                  : "bg-gradient-to-r from-blue-500/10 to-blue-600/10 group-hover:from-blue-500/20 group-hover:to-blue-600/20"
              )}>
                <div>
                  <p className={clsx(
                    "font-inter font-bold text-sm flex items-center gap-1.5",
                    darkTheme ? "text-blue-400" : "text-blue-600"
                  )}>
                    Get more credits
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </p>
                  <p className={clsx(
                    "font-inter text-[10px] mt-0.5",
                    darkTheme ? "text-gray-500" : "text-gray-600"
                  )}>
                    Upgrade your plan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
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
          <button
            onClick={() => {
              const now = new Date();
              const options: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              };
              const formatted = now.toLocaleString('en-US', options);
              toast.info(formatted, {
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontWeight: '500',
                  fontSize: '14px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                },
              });
            }}
            className="hover:bg-white/15 rounded-xl p-1.5 transition-all duration-200 hover:scale-110"
          >
            <LuClock className="text-lg text-white cursor-pointer" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
