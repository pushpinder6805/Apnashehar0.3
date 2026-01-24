import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Sprout, 
  Menu,
  X 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Mandi Prices", icon: Sprout, href: "/commodities" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-xl lg:shadow-none flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-8 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/25">
              C
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight text-foreground">CityPulse</h1>
              <p className="text-xs text-muted-foreground font-medium">Daily Urban Insights</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setIsOpen(false)} // Close on mobile navigate
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <item.icon 
                  size={20} 
                  className={cn(
                    "transition-colors", 
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border/50 bg-muted/20">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h4 className="text-sm font-semibold mb-1">Data Sources</h4>
            <p className="text-xs text-muted-foreground">
              Powered by Data.gov.in & Open Weather API
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
