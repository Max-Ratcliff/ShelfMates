import { NavLink } from "react-router-dom";
import { Home, Users, Clock, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/shared", icon: Home, label: "Shared Shelf" },
  { to: "/dashboard", icon: Users, label: "My Shelf" },
  { to: "/expiring", icon: Clock, label: "Expiring Soon" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function SideNav({ isOpen, onClose }: SideNavProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 sm:top-16 z-40 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 transform border-r border-border bg-card transition-transform duration-300 md:sticky md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 touch-manipulation" aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground">
              Keep your household's food fresh and organized
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
