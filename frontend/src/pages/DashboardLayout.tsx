import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/layout/NavBar";
import { SideNav } from "@/components/layout/SideNav";

export default function DashboardLayout() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <NavBar
        onMenuClick={() => setIsSideNavOpen(!isSideNavOpen)}
        householdName="The Smith House"
      />
      
      <div className="flex w-full">
        <SideNav isOpen={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />
        
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
