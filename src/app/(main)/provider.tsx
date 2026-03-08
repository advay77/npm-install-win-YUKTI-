"use client";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardTopNav from "@/components/Dashboard-topNav";
import { SidebarProvider, SidebarInset } from "@/components/ui/SideBar";
import { useTheme } from "@/context/ThemeProvider";
import React from "react";

function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { darkTheme } = useTheme();
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className={`flex flex-col min-h-screen ${darkTheme ? "bg-[#0c0f1d]" : "bg-slate-50"}`}>
        <DashboardTopNav />
        <main className="flex-1 w-full overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardProvider;
