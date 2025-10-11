import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/layout/NavBar";
import { SideNav } from "@/components/layout/SideNav";
import { useHousehold } from "@/contexts/HouseholdContext";

export default function DashboardLayout() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const { householdData } = useHousehold();

  return (
    <div className="min-h-screen w-full bg-background">
      <NavBar
        onMenuClick={() => setIsSideNavOpen(!isSideNavOpen)}
        householdName={householdData?.name || "No Household"}
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
