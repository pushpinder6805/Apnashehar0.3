import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  loading?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  className,
  loading = false
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("bg-card p-6 rounded-2xl border border-border shadow-sm h-36 animate-pulse", className)}>
        <div className="h-4 w-1/2 bg-muted rounded mb-4" />
        <div className="h-8 w-3/4 bg-muted rounded mb-2" />
        <div className="h-3 w-1/3 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between group",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
            {value}
          </h3>
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
            {icon}
          </div>
        )}
      </div>
      
      {(subtitle || trendValue) && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trendValue && (
            <span className={cn(
              "font-semibold px-2 py-0.5 rounded-full text-xs",
              trend === "up" ? "bg-red-100 text-red-700" : 
              trend === "down" ? "bg-green-100 text-green-700" : 
              "bg-gray-100 text-gray-700"
            )}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {trendValue}
            </span>
          )}
          {subtitle && (
            <span className="text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
