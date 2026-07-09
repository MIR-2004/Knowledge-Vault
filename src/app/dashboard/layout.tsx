import React from "react";
import Sidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar Panel */}
      <Sidebar />

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {/* Visual backdrop details */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#40534c_0.5px,transparent_0.5px),linear-gradient(to_bottom,#40534c_0.5px,transparent_0.5px)] bg-[size:6rem_6rem] opacity-5 pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto flex flex-col z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
